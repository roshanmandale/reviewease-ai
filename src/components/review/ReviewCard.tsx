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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.22, ease: 'easeOut' }}
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-2xl transition-all duration-150 active:scale-[0.985] touch-manipulation"
      style={{
        WebkitTapHighlightColor: 'transparent',
        padding: '14px 16px',
        border: selected ? `2px solid ${brandColor}` : '2px solid #f0f0f0',
        backgroundColor: selected ? `${brandColor}08` : '#fafafa',
        boxShadow: selected ? `0 4px 16px ${brandColor}22` : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Radio circle */}
        <div
          className="flex-shrink-0 mt-0.5 transition-all duration-150"
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: selected ? `2px solid ${brandColor}` : '2px solid #d1d5db',
            backgroundColor: selected ? brandColor : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && (
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: 'white',
              }}
            />
          )}
        </div>

        {/* Review text */}
        <p
          className="text-sm leading-relaxed flex-1"
          style={{
            color: selected ? '#111827' : '#374151',
            fontWeight: selected ? 500 : 400,
          }}
        >
          {text}
        </p>
      </div>
    </motion.button>
  );
}
