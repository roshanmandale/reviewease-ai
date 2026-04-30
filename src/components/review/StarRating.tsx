'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  color?: string;
}

export function StarRating({ value, onChange, size = 52, color = '#f59e0b' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-2.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= active;
        return (
          <motion.button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            whileTap={{ scale: 0.75 }}
            whileHover={{ scale: 1.18, y: -3 }}
            animate={{ scale: isActive ? 1.05 : 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="focus:outline-none touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
              {isActive && (
                <filter id={`star-glow-${star}`}>
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              )}
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={isActive ? color : '#e5e7eb'}
                stroke={isActive ? color : '#d1d5db'}
                strokeWidth="0.5"
                style={{
                  filter: isActive ? `drop-shadow(0 0 6px ${color}80)` : 'none',
                  transition: 'fill 0.15s ease, filter 0.15s ease',
                }}
              />
            </svg>
          </motion.button>
        );
      })}
    </div>
  );
}
