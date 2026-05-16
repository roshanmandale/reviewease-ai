'use client';

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ReviewCardProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
  index: number;
  brandColor?: string;
}

export const ReviewCard = memo(({ text, selected, onSelect, index, brandColor = '#7c3aed' }: ReviewCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.22, ease: 'easeOut' }}
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-2xl transition-all duration-150 active:scale-[0.98] touch-manipulation"
      style={{
        WebkitTapHighlightColor: 'transparent',
        padding: '15px 16px',
        background: selected
          ? `linear-gradient(135deg, ${brandColor}10 0%, ${brandColor}06 100%)`
          : 'white',
        border: selected ? `2px solid ${brandColor}50` : '2px solid #efefef',
        boxShadow: selected ? `0 4px 18px ${brandColor}1e` : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-start gap-3.5">
        {/* Radio dot */}
        <div
          className="flex-shrink-0 mt-[2px] transition-all duration-150"
          style={{
            width: 20, height: 20, borderRadius: '50%',
            border: selected ? `2.5px solid ${brandColor}` : '2px solid #d1d5db',
            backgroundColor: selected ? brandColor : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: selected ? `0 2px 8px ${brandColor}38` : 'none',
          }}
        >
          {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'white' }} />}
        </div>

        {/* Text */}
        <p
          className="text-[13.5px] leading-relaxed flex-1"
          style={{ color: selected ? '#111827' : '#4b5563', fontWeight: selected ? 500 : 400 }}
        >
          {text}
        </p>
      </div>
    </motion.button>
  );
});
ReviewCard.displayName = 'ReviewCard';
