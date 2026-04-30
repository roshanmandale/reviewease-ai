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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
      type="button"
      onClick={onSelect}
      className="w-full text-left p-4 rounded-2xl border transition-all duration-150 active:scale-[0.99]"
      style={
        selected
          ? {
              borderColor: brandColor,
              borderWidth: '2px',
              backgroundColor: `${brandColor}0d`,
              boxShadow: `0 2px 12px ${brandColor}20`,
            }
          : {
              borderColor: '#f3f4f6',
              borderWidth: '1px',
              backgroundColor: '#f9fafb',
            }
      }
    >
      <div className="flex items-start gap-3">
        {/* Radio */}
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150"
          style={
            selected
              ? { borderColor: brandColor, backgroundColor: brandColor }
              : { borderColor: '#d1d5db', backgroundColor: 'white' }
          }
        >
          {selected && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>

        <p
          className="text-sm leading-relaxed"
          style={{ color: selected ? '#111827' : '#4b5563' }}
        >
          {text}
        </p>
      </div>
    </motion.button>
  );
}
