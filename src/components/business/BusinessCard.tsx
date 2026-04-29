'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  QrCode,
  BarChart3,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Business } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, getInitials } from '@/lib/utils';

interface BusinessCardProps {
  business: Business;
  onEdit?: (business: Business) => void;
  onDelete?: (id: string) => void;
  onViewQR?: (business: Business) => void;
}

export function BusinessCard({ business, onEdit, onDelete, onViewQR }: BusinessCardProps) {
  const [copied, setCopied] = useState(false);

  const reviewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/b/${business.slug}`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: business.brandColor }} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Logo / Initials */}
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: business.brandColor }}
              >
                {getInitials(business.name)}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">{business.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{business.category} · {business.city}</p>
            </div>
          </div>

          <Badge variant={business.active ? 'success' : 'warning'}>
            {business.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* URL */}
        <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-500 truncate flex-1">/b/{business.slug}</span>
          <button
            onClick={handleCopyUrl}
            className="text-gray-400 hover:text-violet-600 transition-colors flex-shrink-0"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-600"
            onClick={() => onViewQR?.(business)}
          >
            <QrCode size={15} />
            QR Code
          </Button>
          <Link href={`/dashboard/analytics?business=${business.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-gray-600">
              <BarChart3 size={15} />
              Analytics
            </Button>
          </Link>
          <button
            onClick={() => onEdit?.(business)}
            className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => onDelete?.(business.id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
