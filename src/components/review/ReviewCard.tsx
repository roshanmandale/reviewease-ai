'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ReviewCardProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
  index: number;
  brandColor?: string;
}

export function ReviewCard({ text, selected, onSelect, index, brandColor = '#7c3aed' }: ReviewCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25, ease: 'easeOut' }}
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-2xl transition-all duration-150 active:scale-[0.98] touch-manipulation"
      style={{
        WebkitTapHighlightColor: 'transparent',
        padding: '16px',
        background: selected
          ? `linear-gradient(135deg, ${brandColor}12 0%, ${brandColor}06 100%)`
          : 'white',
        border: selected ? `2px solid ${brandColor}55` : '2px solid #f0f0f0',
        boxShadow: selected
          ? `0 4px 20px ${brandColor}20`
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-start gap-3.5">
        {/* Radio */}
        <div
          className="flex-shrink-0 mt-0.5 transition-all duration-150"
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: selected ? `2.5px solid ${brandColor}` : '2px solid #d1d5db',
            backgroundColor: selected ? brandColor : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: selected ? `0 2px 8px ${brandColor}40` : 'none',
          }}
        >
          {selected && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white' }} />
          )}
        </div>

        {/* Text */}
        <p
          className="text-sm leading-relaxed flex-1"
          style={{
            color: selected ? '#111827' : '#4b5563',
            fontWeight: selected ? 500 : 400,
          }}
        >
          {text}
        </p>
      </div>
    </motion.button>
  );
}
