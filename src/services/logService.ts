import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScanLog, ReviewClick, AnalyticsData } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function tsToIso(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ─── Scan Logs ────────────────────────────────────────────────────────────────

/**
 * Log a QR code scan event.
 * Auto-creates the `scan_logs` collection on first write.
 */
export async function logScan(data: Omit<ScanLog, 'id'>): Promise<void> {
  await addDoc(collection(db, 'scan_logs'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/**
 * Fetch recent scan logs for a business.
 * Uses only a single where() — no composite index required.
 * Sorted client-side.
 */
export async function getScanLogs(businessId: string): Promise<ScanLog[]> {
  const q = query(
    collection(db, 'scan_logs'),
    where('businessId', '==', businessId),
    limit(200)
  );
  const snap = await getDocs(q);
  const logs = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      businessId: data.businessId,
      slug: data.slug,
      deviceType: data.deviceType,
      userAgent: data.userAgent,
      timestamp: tsToIso(data.timestamp),
    } as ScanLog;
  });
  // Sort newest first client-side
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Review Clicks ────────────────────────────────────────────────────────────

/**
 * Log a review click / copy event.
 * Auto-creates the `review_clicks` collection on first write.
 */
export async function logReviewClick(data: Omit<ReviewClick, 'id'>): Promise<void> {
  await addDoc(collection(db, 'review_clicks'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

/**
 * Fetch recent review click logs for a business.
 * Uses only a single where() — no composite index required.
 * Sorted client-side.
 */
export async function getReviewClicks(businessId: string): Promise<ReviewClick[]> {
  const q = query(
    collection(db, 'review_clicks'),
    where('businessId', '==', businessId),
    limit(200)
  );
  const snap = await getDocs(q);
  const clicks = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      businessId: data.businessId,
      rating: data.rating,
      tone: data.tone,
      reviewText: data.reviewText,
      redirected: data.redirected,
      timestamp: tsToIso(data.timestamp),
    } as ReviewClick;
  });
  return clicks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Analytics Aggregation ────────────────────────────────────────────────────

/**
 * Build daily analytics from scan_logs and review_clicks.
 * Uses only single-field where('businessId', 'in', ...) — no composite index.
 * Date filtering and sorting done client-side.
 */
export async function getAnalyticsForOwner(
  businessIds: string[],
  days = 14
): Promise<AnalyticsData[]> {
  if (businessIds.length === 0) {
    // Return empty days array
    return buildEmptyDays(days);
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);

  // Chunk into groups of 10 (Firestore 'in' limit)
  const chunks: string[][] = [];
  for (let i = 0; i < businessIds.length; i += 10) {
    chunks.push(businessIds.slice(i, i + 10));
  }

  const scansByDate: Record<string, number> = {};
  const clicksByDate: Record<string, number> = {};

  for (const chunk of chunks) {
    // Scans — single where('businessId', 'in', ...) only
    const scanSnap = await getDocs(
      query(collection(db, 'scan_logs'), where('businessId', 'in', chunk))
    );
    scanSnap.docs.forEach((d) => {
      const date = tsToIso(d.data().timestamp).slice(0, 10);
      if (date >= sinceDate) {
        scansByDate[date] = (scansByDate[date] || 0) + 1;
      }
    });

    // Clicks — single where('businessId', 'in', ...) only
    const clickSnap = await getDocs(
      query(collection(db, 'review_clicks'), where('businessId', 'in', chunk))
    );
    clickSnap.docs.forEach((d) => {
      const date = tsToIso(d.data().timestamp).slice(0, 10);
      if (date >= sinceDate) {
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
      }
    });
  }

  // Build full date range with zeros for missing days
  return buildEmptyDays(days).map((d) => ({
    date: d.date,
    scans: scansByDate[d.date] || 0,
    clicks: clicksByDate[d.date] || 0,
  }));
}

function buildEmptyDays(days: number): AnalyticsData[] {
  const result: AnalyticsData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({ date: d.toISOString().slice(0, 10), scans: 0, clicks: 0 });
  }
  return result;
}

// ─── Recent Activity Feed ─────────────────────────────────────────────────────

/**
 * Fetch recent activity (scans + clicks) for a set of businesses.
 * Uses only single-field where() — no composite index required.
 */
export async function getRecentActivity(
  businessIds: string[],
  businessNameMap: Record<string, string>,
  maxItems = 10
): Promise<Array<{ id: string; type: 'scan' | 'review'; business: string; time: string }>> {
  if (businessIds.length === 0) return [];

  const chunk = businessIds.slice(0, 10);
  const items: Array<{ id: string; type: 'scan' | 'review'; business: string; ts: Date }> = [];

  // Scans
  const scanSnap = await getDocs(
    query(collection(db, 'scan_logs'), where('businessId', 'in', chunk), limit(50))
  );
  scanSnap.docs.forEach((d) => {
    const data = d.data();
    items.push({
      id: d.id,
      type: 'scan',
      business: businessNameMap[data.businessId] || 'Unknown',
      ts: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
    });
  });

  // Clicks
  const clickSnap = await getDocs(
    query(collection(db, 'review_clicks'), where('businessId', 'in', chunk), limit(50))
  );
  clickSnap.docs.forEach((d) => {
    const data = d.data();
    items.push({
      id: d.id,
      type: 'review',
      business: businessNameMap[data.businessId] || 'Unknown',
      ts: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
    });
  });

  // Sort newest first client-side
  items.sort((a, b) => b.ts.getTime() - a.ts.getTime());

  return items.slice(0, maxItems).map((item) => ({
    id: item.id,
    type: item.type,
    business: item.business,
    time: formatRelativeTime(item.ts),
  }));
}
