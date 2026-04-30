'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useBusinesses } from '@/hooks/useBusinesses';
import { BusinessReport } from '@/types';
import {
  getReportsForOwner,
  runRetentionForBusiness,
  getDaysUntilDeletion,
  getRetentionUrgency,
  RETENTION_DAYS,
} from '@/services/reportService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { user } = useAuth();
  const { businesses, loading: bizLoading } = useBusinesses(user?.uid);

  const [reports, setReports] = useState<BusinessReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getReportsForOwner(user.uid);
      setReports(data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleGenerate = async (businessId: string, businessName: string) => {
    if (!user?.uid) return;
    setGenerating(businessId);
    try {
      const result = await runRetentionForBusiness(businessId, businessName, user.uid);
      if (result.success) {
        toast.success(`Report generated for ${businessName}!`);
        await fetchReports();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  // Group reports by business
  const reportsByBusiness = reports.reduce<Record<string, BusinessReport[]>>((acc, r) => {
    if (!acc[r.businessId]) acc[r.businessId] = [];
    acc[r.businessId].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            PDF reports are stored permanently. Raw logs are kept for {RETENTION_DAYS} days only.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchReports}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Retention policy info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex items-start gap-4"
      >
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock size={18} className="text-violet-600" />
        </div>
        <div>
          <p className="font-semibold text-violet-900">15-Day Data Retention Policy</p>
          <p className="text-sm text-violet-700 mt-1 leading-relaxed">
            Activity logs (QR scans and review clicks) are automatically deleted after{' '}
            <strong>{RETENTION_DAYS} days</strong> to protect customer privacy.
            PDF reports are generated before deletion and stored permanently here.
            Download your reports anytime.
          </p>
        </div>
      </motion.div>

      {/* Business retention status */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4">Business Status</h2>
        {bizLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Building2 size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No businesses yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => {
              const daysLeft = getDaysUntilDeletion(biz.nextDeletionDate);
              const urgency = getRetentionUrgency(daysLeft);
              const bizReports = reportsByBusiness[biz.id] || [];
              const latestReport = bizReports[0];

              return (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: biz.brandColor }}
                      >
                        {biz.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{biz.name}</p>
                        <p className="text-xs text-gray-500">{biz.category} · {biz.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Retention status */}
                      {daysLeft !== null ? (
                        <span
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                            urgency === 'red'
                              ? 'bg-red-100 text-red-700'
                              : urgency === 'orange'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {urgency === 'red' ? (
                            <AlertTriangle size={11} />
                          ) : (
                            <Clock size={11} />
                          )}
                          {daysLeft === 0 ? 'Deleting today' : `${daysLeft}d until deletion`}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5 rounded-full bg-gray-100">
                          <Clock size={11} />
                          No deletion scheduled
                        </span>
                      )}

                      {/* Last report */}
                      {latestReport ? (
                        <a
                          href={latestReport.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          <Download size={12} />
                          Latest Report
                        </a>
                      ) : null}

                      {/* Generate button */}
                      <button
                        onClick={() => handleGenerate(biz.id, biz.name)}
                        disabled={generating === biz.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
                      >
                        {generating === biz.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <FileText size={12} />
                        )}
                        {generating === biz.id ? 'Generating...' : 'Generate Report'}
                      </button>
                    </div>
                  </div>

                  {/* Report history */}
                  {bizReports.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-xs font-medium text-gray-500 mb-2">Report History</p>
                      <div className="space-y-1.5">
                        {bizReports.slice(0, 5).map((report) => (
                          <div
                            key={report.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 text-gray-600">
                              <CheckCircle size={12} className="text-emerald-500" />
                              <span>
                                {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
                              </span>
                              <span className="text-gray-400">
                                · {report.totalScans} scans · {report.totalClicks} clicks · {report.conversionRate}%
                              </span>
                            </div>
                            <a
                              href={report.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1"
                            >
                              <Download size={11} />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* All reports list */}
      {reports.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-4">All Reports ({reports.length})</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Business</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Period</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Scans</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Clicks</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Rate</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Generated</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{report.businessName}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">{report.totalScans}</td>
                        <td className="px-5 py-3.5 text-gray-700">{report.totalClicks}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={report.conversionRate >= 50 ? 'success' : 'default'}>
                            {report.conversionRate}%
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {formatDate(report.generatedAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <a
                            href={report.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                          >
                            <Download size={13} />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No reports yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Generate your first report from the business status section above.
          </p>
        </div>
      )}
    </div>
  );
}
