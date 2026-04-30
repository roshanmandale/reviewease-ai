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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildReportHTML, RETENTION_DAYS } from '@/services/reportService';

// ─── Security ─────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const vercelCron = req.headers.get('x-vercel-cron');
  if (vercelCron === '1') return true;

  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;

  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tsToDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return new Date();
}

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

    const recentScans  = scanSnap.docs.filter((d) => tsToDate(d.data().timestamp) >= cutoff);
    const oldScans     = scanSnap.docs.filter((d) => tsToDate(d.data().timestamp) < cutoff);
    const recentClicks = clickSnap.docs.filter((d) => tsToDate(d.data().timestamp) >= cutoff);
    const oldClicks    = clickSnap.docs.filter((d) => tsToDate(d.data().timestamp) < cutoff);

    // Nothing old to delete — skip
    if (oldScans.length === 0 && oldClicks.length === 0) {
      return { businessId, status: 'skipped', scansDeleted: 0, clicksDeleted: 0 };
    }

    const totalScans     = recentScans.length;
    const totalClicks    = recentClicks.length;
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

    // Build HTML report with real report ID
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

    // Store as data URL (no Firebase Storage needed)
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await updateDoc(doc(db, 'reports', reportRef.id), { pdfUrl: dataUrl });

    // Update business retention fields
    const nextDeletion = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await updateDoc(doc(db, 'businesses', businessId), {
      lastReportGeneratedAt: serverTimestamp(),
      nextDeletionDate: nextDeletion.toISOString(),
      updatedAt: serverTimestamp(),
    });

    // Delete old logs in batches — ONLY after report is saved
    const toDelete = [...oldScans, ...oldClicks];
    for (let i = 0; i < toDelete.length; i += 400) {
      const batch = writeBatch(db);
      toDelete.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    console.log(`[cron] ✅ ${businessName}: deleted ${oldScans.length}+${oldClicks.length} logs`);

    return {
      businessId,
      status: 'success',
      scansDeleted: oldScans.length,
      clicksDeleted: oldClicks.length,
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
