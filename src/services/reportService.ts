import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';import { db } from '@/lib/firebase';
import { BusinessReport } from '@/types';
import { getScanLogs, getReviewClicks } from './logService';

export const RETENTION_DAYS = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tsToIso(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

export function getDaysUntilDeletion(nextDeletionDate?: string): number | null {
  if (!nextDeletionDate) return null;
  const diff = new Date(nextDeletionDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getRetentionUrgency(daysLeft: number | null): 'red' | 'orange' | 'blue' | null {
  if (daysLeft === null) return null;
  if (daysLeft <= 3) return 'red';
  if (daysLeft <= 7) return 'orange';
  return 'blue';
}

// ─── Report HTML builder ──────────────────────────────────────────────────────

export function buildReportHTML(data: {
  businessName: string;
  category: string;
  city: string;
  ownerName: string;
  periodStart: string;
  periodEnd: string;
  totalScans: number;
  totalClicks: number;
  conversionRate: number;
  generatedAt: string;
  reportId: string;
}): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ReviewKaro Report — ${data.businessName}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 0;
    }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }

    /* Header */
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #7c3aed; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .brand-icon svg { width: 20px; height: 20px; fill: white; }
    .brand-name { font-size: 20px; font-weight: 700; color: #7c3aed; }
    .report-meta { text-align: right; }
    .report-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; }
    .report-id { font-size: 11px; color: #6b7280; font-family: monospace; margin-top: 2px; }

    /* Business info */
    .biz-section { margin-bottom: 32px; }
    .biz-name { font-size: 28px; font-weight: 700; color: #111827; }
    .biz-meta { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .biz-owner { font-size: 13px; color: #9ca3af; margin-top: 2px; }

    /* Period */
    .period-box { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 14px 18px; margin-bottom: 28px; display: flex; align-items: center; gap: 10px; }
    .period-icon { font-size: 18px; }
    .period-text { font-size: 14px; color: #5b21b6; font-weight: 500; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 14px; padding: 24px 16px; text-align: center; }
    .stat-card.primary { background: linear-gradient(135deg, #7c3aed, #4f46e5); border-color: transparent; }
    .stat-value { font-size: 40px; font-weight: 800; color: #7c3aed; line-height: 1; }
    .stat-card.primary .stat-value { color: white; }
    .stat-label { font-size: 11px; color: #9ca3af; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .stat-card.primary .stat-label { color: rgba(255,255,255,0.7); }

    /* Breakdown */
    .section-title { font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f9fafb; font-size: 13px; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }

    /* Notice */
    .notice { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 28px; font-size: 12px; color: #92400e; display: flex; gap: 8px; align-items: flex-start; }

    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
    .footer-left { font-size: 11px; color: #9ca3af; line-height: 1.6; }
    .footer-brand { font-size: 12px; font-weight: 700; color: #7c3aed; }

    /* Print button */
    .print-btn { display: inline-flex; align-items: center; gap: 6px; background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 24px; }
    .print-btn:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Print button (hidden when printing) -->
    <div class="no-print" style="margin-bottom: 20px;">
      <button class="print-btn" onclick="window.print()">
        🖨️ Save as PDF / Print
      </button>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div>
          <div class="brand-name">ReviewKaro</div>
          <div style="font-size:11px;color:#9ca3af;">Analytics Report</div>
        </div>
      </div>
      <div class="report-meta">
        <div class="report-label">Report ID</div>
        <div class="report-id">${data.reportId}</div>
        <div class="report-label" style="margin-top:6px;">Generated</div>
        <div style="font-size:11px;color:#6b7280;">${fmtTime(data.generatedAt)}</div>
      </div>
    </div>

    <!-- Business Info -->
    <div class="biz-section">
      <div class="biz-name">${data.businessName}</div>
      <div class="biz-meta">${data.category} &nbsp;·&nbsp; ${data.city}</div>
      <div class="biz-owner">Owner: ${data.ownerName}</div>
    </div>

    <!-- Period -->
    <div class="period-box">
      <div class="period-icon">📅</div>
      <div class="period-text">
        Report Period: <strong>${fmt(data.periodStart)}</strong> — <strong>${fmt(data.periodEnd)}</strong>
        &nbsp;(${RETENTION_DAYS} days)
      </div>
    </div>

    <!-- Retention notice -->
    <div class="notice">
      <span>⚠️</span>
      <span>Raw activity logs are stored for <strong>${RETENTION_DAYS} days</strong> only to protect customer privacy.
      This report is saved permanently and can be downloaded anytime from your ReviewKaro dashboard.</span>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.totalScans}</div>
        <div class="stat-label">QR Scans</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.totalClicks}</div>
        <div class="stat-label">Review Clicks</div>
      </div>
      <div class="stat-card primary">
        <div class="stat-value">${data.conversionRate}%</div>
        <div class="stat-label">Conversion Rate</div>
      </div>
    </div>

    <!-- Detail breakdown -->
    <div style="margin-bottom: 28px;">
      <div class="section-title">Summary Breakdown</div>
      <div class="detail-row">
        <span class="detail-label">Total QR Code Scans</span>
        <span class="detail-value">${data.totalScans}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Total Review Clicks (Copy & Post)</span>
        <span class="detail-value">${data.totalClicks}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Conversion Rate (Scans → Reviews)</span>
        <span class="detail-value">${data.conversionRate}%</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Scans Without Review</span>
        <span class="detail-value">${data.totalScans - data.totalClicks}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Report Period (Days)</span>
        <span class="detail-value">${RETENTION_DAYS} days</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Period Start</span>
        <span class="detail-value">${fmt(data.periodStart)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Period End</span>
        <span class="detail-value">${fmt(data.periodEnd)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <div class="footer-brand">ReviewKaro</div>
        <div>Turn happy customers into Google reviews in seconds.</div>
        <div>Reports stored permanently · Raw logs deleted after ${RETENTION_DAYS} days</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#9ca3af;">
        <div>Generated: ${fmtTime(data.generatedAt)}</div>
        <div>Report ID: ${data.reportId}</div>
      </div>
    </div>

  </div>
</body>
</html>`;
}

// ─── Report CRUD ──────────────────────────────────────────────────────────────

export async function getReportsForBusiness(businessId: string): Promise<BusinessReport[]> {
  const snap = await getDocs(
    query(collection(db, 'reports'), where('businessId', '==', businessId), limit(50))
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        businessId: data.businessId,
        businessName: data.businessName,
        ownerUid: data.ownerUid,
        periodStart: tsToIso(data.periodStart),
        periodEnd: tsToIso(data.periodEnd),
        totalScans: data.totalScans || 0,
        totalClicks: data.totalClicks || 0,
        conversionRate: data.conversionRate || 0,
        pdfUrl: data.pdfUrl || '',
        generatedAt: tsToIso(data.generatedAt),
      } as BusinessReport;
    })
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

export async function getReportsForOwner(ownerUid: string): Promise<BusinessReport[]> {
  const snap = await getDocs(
    query(collection(db, 'reports'), where('ownerUid', '==', ownerUid), limit(100))
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        businessId: data.businessId,
        businessName: data.businessName,
        ownerUid: data.ownerUid,
        periodStart: tsToIso(data.periodStart),
        periodEnd: tsToIso(data.periodEnd),
        totalScans: data.totalScans || 0,
        totalClicks: data.totalClicks || 0,
        conversionRate: data.conversionRate || 0,
        pdfUrl: data.pdfUrl || '',
        generatedAt: tsToIso(data.generatedAt),
      } as BusinessReport;
    })
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

// ─── Core: generate report + save to Firestore + delete old logs ──────────────

export async function runRetentionForBusiness(
  businessId: string,
  businessName: string,
  ownerUid: string,
  ownerName: string = 'Owner',
  category: string = '',
  city: string = ''
): Promise<{ success: boolean; reportId?: string; htmlContent?: string; error?: string }> {
  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // 1. Fetch logs
    const [scans, clicks] = await Promise.all([
      getScanLogs(businessId),
      getReviewClicks(businessId),
    ]);

    const windowScans  = scans;
    const windowClicks = clicks;
    const totalScans   = windowScans.length;
    const totalClicks  = windowClicks.length;
    const conversionRate = totalScans > 0 ? Math.round((totalClicks / totalScans) * 100) : 0;

    // 2. Save report record to Firestore first (get the ID)
    const reportRef = await addDoc(collection(db, 'reports'), {
      businessId,
      businessName,
      ownerUid,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      totalScans,
      totalClicks,
      conversionRate,
      pdfUrl: '',          // will be updated below
      generatedAt: serverTimestamp(),
    });

    // 3. Build HTML report with the real report ID
    const htmlContent = buildReportHTML({
      businessName,
      category,
      city,
      ownerName,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      totalScans,
      totalClicks,
      conversionRate,
      generatedAt: now.toISOString(),
      reportId: reportRef.id,
    });

    // 4. Store HTML as a data URL so it can be opened without Firebase Storage
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

    // 5. Update report with the data URL
    await updateDoc(doc(db, 'reports', reportRef.id), { pdfUrl: dataUrl });

    // 6. Update business retention fields
    const nextDeletion = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await updateDoc(doc(db, 'businesses', businessId), {
      lastReportGeneratedAt: serverTimestamp(),
      nextDeletionDate: nextDeletion.toISOString(),
      updatedAt: serverTimestamp(),
    });

    // 7. Delete ALL logs for this business after report is saved
    const allScans  = await getDocs(query(collection(db, 'scan_logs'), where('businessId', '==', businessId)));
    const allClicks = await getDocs(query(collection(db, 'review_clicks'), where('businessId', '==', businessId)));
    const allDocs   = [...allScans.docs, ...allClicks.docs];
    for (let i = 0; i < allDocs.length; i += 400) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    if (allDocs.length > 0) {
      console.log(`[retention] Deleted all ${allDocs.length} logs for ${businessId}`);
    }

    return { success: true, reportId: reportRef.id, htmlContent };
  } catch (err) {
    console.error('[retention] Failed for', businessId, err);
    return { success: false, error: (err as Error).message };
  }
}
