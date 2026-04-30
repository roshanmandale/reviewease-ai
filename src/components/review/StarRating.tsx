'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  color?: string;
}

export function StarRating({ value, onChange, size = 48, color = '#f59e0b' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= active;
        const isJustActivated = star === active && hovered === 0 && value === star;

        return (
          <motion.button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            whileTap={{ scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="focus:outline-none touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <motion.svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              animate={{
                scale: isActive ? 1 : 0.88,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <defs>
                <filter id={`glow-${star}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={isActive ? color : '#e5e7eb'}
                stroke={isActive ? color : '#d1d5db'}
                strokeWidth="0.5"
                filter={isActive ? `url(#glow-${star})` : undefined}
                style={{ transition: 'fill 0.15s ease, filter 0.15s ease' }}
              />
            </motion.svg>
          </motion.button>
        );
      })}
    </div>
  );
}
