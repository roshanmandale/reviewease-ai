import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildReportHTML, RETENTION_DAYS } from '@/services/reportService';

// ─── Security ─────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  // 1. Vercel cron internal header
  if (req.headers.get('x-vercel-cron') === '1') return true;

  // 2. Secret token (for external triggers)
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;

  // 3. Always allow in development
  if (process.env.NODE_ENV === 'development') return true;

  // 4. Allow any authenticated call from the same origin (admin dashboard)
  //    The admin guard is enforced on the frontend — this just lets the fetch through
  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  if (
    origin.includes(host) ||
    (appUrl && origin.includes(new URL(appUrl).hostname))
  ) {
    return true;
  }

  // 5. Same-origin requests have no Origin header (Next.js server-side fetch)
  if (!origin) return true;

  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Process one business ─────────────────────────────────────────────────────

async function processBusinessRetention(
  businessId: string,
  businessName: string,
  ownerUid: string,
  category: string,
  city: string
): Promise<{
  businessId: string;
  status: 'success' | 'skipped' | 'error';
  scansDeleted: number;
  clicksDeleted: number;
  reportId?: string;
  error?: string;
}> {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Fetch all logs
    const [scanSnap, clickSnap] = await Promise.all([
      getDocs(query(collection(db, 'scan_logs'), where('businessId', '==', businessId))),
      getDocs(query(collection(db, 'review_clicks'), where('businessId', '==', businessId))),
    ]);

    // Skip if absolutely no data at all
    if (scanSnap.empty && clickSnap.empty) {
      return { businessId, status: 'skipped', scansDeleted: 0, clicksDeleted: 0 };
    }

    // Stats from ALL logs (full picture for the report)
    const totalScans     = scanSnap.size;
    const totalClicks    = clickSnap.size;
    const conversionRate = totalScans > 0 ? Math.round((totalClicks / totalScans) * 100) : 0;

    // Save report record first to get the ID
    const reportRef = await addDoc(collection(db, 'reports'), {
      businessId,
      businessName,
      ownerUid,
      periodStart: cutoff.toISOString(),
      periodEnd: now.toISOString(),
      totalScans,
      totalClicks,
      conversionRate,
      pdfUrl: '',
      generatedAt: serverTimestamp(),
    });

    // Build HTML report
    const html = buildReportHTML({
      businessName,
      category,
      city,
      ownerName: 'Owner',
      periodStart: cutoff.toISOString(),
      periodEnd: now.toISOString(),
      totalScans,
      totalClicks,
      conversionRate,
      generatedAt: now.toISOString(),
      reportId: reportRef.id,
    });

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await updateDoc(doc(db, 'reports', reportRef.id), { pdfUrl: dataUrl });

    // Update business retention fields
    const nextDeletion = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await updateDoc(doc(db, 'businesses', businessId), {
      lastReportGeneratedAt: serverTimestamp(),
      nextDeletionDate: nextDeletion.toISOString(),
      updatedAt: serverTimestamp(),
    });

    // Delete ALL logs for this business — database stays clean
    const allToDelete = [...scanSnap.docs, ...clickSnap.docs];
    for (let i = 0; i < allToDelete.length; i += 400) {
      const batch = writeBatch(db);
      allToDelete.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    console.log(
      `[cron] ✅ ${businessName}: report=${reportRef.id}, deleted all ${scanSnap.size} scans + ${clickSnap.size} clicks`
    );

    return {
      businessId,
      status: 'success',
      scansDeleted: scanSnap.size,
      clicksDeleted: clickSnap.size,
      reportId: reportRef.id,
    };
  } catch (err) {
    console.error(`[cron] ❌ ${businessName}:`, err);
    return {
      businessId,
      status: 'error',
      scansDeleted: 0,
      clicksDeleted: 0,
      error: (err as Error).message,
    };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('[cron] Retention job started at', new Date().toISOString());

  try {
    const bizSnap = await getDocs(
      query(collection(db, 'businesses'), where('active', '==', true))
    );

    if (bizSnap.empty) {
      return NextResponse.json({ message: 'No active businesses', processed: 0 });
    }

    const results = [];
    for (const bizDoc of bizSnap.docs) {
      const d = bizDoc.data();
      results.push(
        await processBusinessRetention(
          bizDoc.id,
          d.name || 'Unknown',
          d.ownerUid || '',
          d.category || '',
          d.city || ''
        )
      );
    }

    const summary = {
      processed: results.length,
      success: results.filter((r) => r.status === 'success').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      totalScansDeleted: results.reduce((s, r) => s + r.scansDeleted, 0),
      totalClicksDeleted: results.reduce((s, r) => s + r.clicksDeleted, 0),
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    console.log('[cron] Completed:', summary);
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[cron] Failed:', err);
    return NextResponse.json({ error: 'Cron failed', details: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
