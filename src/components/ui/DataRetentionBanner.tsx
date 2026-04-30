'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Download, X, Clock, FileText } from 'lucide-react';
import { Business, BusinessReport } from '@/types';
import {
  getDaysUntilDeletion,
  getRetentionUrgency,
  getReportsForBusiness,
  runRetentionForBusiness,
  RETENTION_DAYS,
} from '@/services/reportService';
import toast from 'react-hot-toast';

interface DataRetentionBannerProps {
  businesses: Business[];
  ownerUid: string;
}

export function DataRetentionBanner({ businesses, ownerUid }: DataRetentionBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  // Find businesses that need attention (have a nextDeletionDate set)
  const urgentBusinesses = businesses
    .map((b) => ({
      business: b,
      daysLeft: getDaysUntilDeletion(b.nextDeletionDate),
      urgency: getRetentionUrgency(getDaysUntilDeletion(b.nextDeletionDate)),
    }))
    .filter(
      (item) =>
        item.daysLeft !== null &&
        item.daysLeft <= 7 &&
        !dismissed.includes(item.business.id)
    )
    .sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99));

  if (urgentBusinesses.length === 0) return null;

  const handleDownload = async (business: Business) => {
    setDownloading(business.id);
    try {
      const reports = await getReportsForBusiness(business.id);
      if (reports.length === 0) {
        toast.error('No report available yet. Generate one first.');
        return;
      }
      const latest = reports[0];
      window.open(latest.pdfUrl, '_blank');
      toast.success('Report opened in new tab');
    } catch {
      toast.error('Failed to fetch report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleGenerateAndDownload = async (business: Business) => {
    setGenerating(business.id);
    try {
      const result = await runRetentionForBusiness(business.id, business.name, ownerUid);
      if (result.success) {
        toast.success('Report generated successfully! Opening...');
        const reports = await getReportsForBusiness(business.id);
        if (reports.length > 0) window.open(reports[0].pdfUrl, '_blank');
      } else {
        toast.error('Failed to generate report. Please try again.');
      }
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="space-y-3">
        {urgentBusinesses.map(({ business, daysLeft, urgency }) => {
          const isRed = urgency === 'red';
          const isOrange = urgency === 'orange';

          const colors = isRed
            ? {
                bg: 'bg-red-50',
                border: 'border-red-200',
                icon: 'bg-red-100 text-red-600',
                title: 'text-red-800',
                body: 'text-red-600',
                badge: 'bg-red-100 text-red-700',
                btn: 'bg-red-600 hover:bg-red-700 text-white',
                dismiss: 'text-red-400 hover:text-red-600',
              }
            : isOrange
            ? {
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                icon: 'bg-amber-100 text-amber-600',
                title: 'text-amber-800',
                body: 'text-amber-700',
                badge: 'bg-amber-100 text-amber-700',
                btn: 'bg-amber-600 hover:bg-amber-700 text-white',
                dismiss: 'text-amber-400 hover:text-amber-600',
              }
            : {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                icon: 'bg-blue-100 text-blue-600',
                title: 'text-blue-800',
                body: 'text-blue-600',
                badge: 'bg-blue-100 text-blue-700',
                btn: 'bg-blue-600 hover:bg-blue-700 text-white',
                dismiss: 'text-blue-400 hover:text-blue-600',
              };

          return (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25 }}
              className={`relative rounded-2xl border p-4 ${colors.bg} ${colors.border}`}
            >
              {/* Dismiss */}
              <button
                onClick={() => setDismissed((prev) => [...prev, business.id])}
                className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${colors.dismiss}`}
              >
                <X size={14} />
              </button>

              <div className="flex items-start gap-3 pr-6">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                  {isRed ? <AlertTriangle size={17} /> : <Clock size={17} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${colors.title}`}>
                      {business.name}
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {daysLeft === 0 ? 'Deleting today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${colors.body}`}>
                    Activity logs will be deleted in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
                    Download your report to keep a permanent copy.
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {business.lastReportGeneratedAt ? (
                      <button
                        onClick={() => handleDownload(business)}
                        disabled={downloading === business.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${colors.btn} disabled:opacity-60`}
                      >
                        {downloading === business.id ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download size={12} />
                        )}
                        Download Latest Report
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateAndDownload(business)}
                        disabled={generating === business.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${colors.btn} disabled:opacity-60`}
                      >
                        {generating === business.id ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FileText size={12} />
                        )}
                        Generate & Download Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
