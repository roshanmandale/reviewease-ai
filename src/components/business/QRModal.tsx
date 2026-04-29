'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, ExternalLink, Copy } from 'lucide-react';
import { Business } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface QRModalProps {
  business: Business | null;
  open: boolean;
  onClose: () => void;
}

export function QRModal({ business, open, onClose }: QRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!business) return null;

  const reviewUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://reviewease.ai'}/b/${business.slug}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${business.slug}-qr.png`;
      a.click();
    };
    img.src = url;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reviewUrl);
  };

  return (
    <Modal open={open} onClose={onClose} title={`QR Code — ${business.name}`} size="sm">
      <div className="flex flex-col items-center gap-6">
        {/* QR Code */}
        <div
          ref={qrRef}
          className="p-5 bg-white rounded-2xl border-2 border-gray-100 shadow-sm"
        >
          <QRCodeSVG
            value={reviewUrl}
            size={200}
            fgColor="#1e1b4b"
            bgColor="#ffffff"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Business info */}
        <div className="text-center">
          <p className="font-semibold text-gray-900">{business.name}</p>
          <p className="text-xs text-gray-500 mt-1 break-all">{reviewUrl}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          <Button onClick={handleDownload} className="w-full">
            <Download size={16} />
            Download QR Code
          </Button>
          <Button variant="secondary" onClick={handleCopy} className="w-full">
            <Copy size={16} />
            Copy Review URL
          </Button>
          <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" className="w-full">
              <ExternalLink size={16} />
              Preview Review Page
            </Button>
          </a>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Print this QR code and place it at your counter, table, or entrance.
        </p>
      </div>
    </Modal>
  );
}
