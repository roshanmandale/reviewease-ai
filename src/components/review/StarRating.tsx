'use client';

import React, { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  color?: string;
}

const StarBtn = memo(({ star, isActive, color, onTap, onHover, onLeave }: {
  star: number; isActive: boolean; color: string;
  onTap: (s: number) => void; onHover: (s: number) => void; onLeave: () => void;
}) => (
  <motion.button
    type="button"
    onClick={() => onTap(star)}
    onMouseEnter={() => onHover(star)}
    onMouseLeave={onLeave}
    whileTap={{ scale: 0.7 }}
    animate={{ scale: isActive ? 1.1 : 0.88, y: isActive ? -2 : 0 }}
    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    className="focus:outline-none touch-manipulation"
    style={{ WebkitTapHighlightColor: 'transparent', padding: 4 }}
  >
    <svg width={52} height={52} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={isActive ? color : '#e5e7eb'}
        stroke={isActive ? color : '#d1d5db'}
        strokeWidth="0.5"
        style={{
          filter: isActive ? `drop-shadow(0 0 7px ${color}75)` : 'none',
          transition: 'fill 0.12s ease, filter 0.12s ease',
        }}
      />
    </svg>
  </motion.button>
));
StarBtn.displayName = 'StarBtn';

export const StarRating = memo(({ value, onChange, size = 52, color = '#f59e0b' }: StarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const onTap   = useCallback((s: number) => onChange(s), [onChange]);
  const onHover = useCallback((s: number) => setHovered(s), []);
  const onLeave = useCallback(() => setHovered(0), []);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarBtn key={star} star={star} isActive={star <= active} color={color}
          onTap={onTap} onHover={onHover} onLeave={onLeave} />
      ))}
    </div>
  );
});
StarRating.displayName = 'StarRating';
