'use client';

import React, { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  color?: string;
}

// Memoized individual star — only re-renders when its own active state changes
const StarButton = memo(({
  star, isActive, color, onTap, onHover, onLeave,
}: {
  star: number;
  isActive: boolean;
  color: string;
  onTap: (s: number) => void;
  onHover: (s: number) => void;
  onLeave: () => void;
}) => (
  <motion.button
    type="button"
    onClick={() => onTap(star)}
    onMouseEnter={() => onHover(star)}
    onMouseLeave={onLeave}
    whileTap={{ scale: 0.72 }}
    animate={{ scale: isActive ? 1.08 : 0.9 }}
    transition={{ type: 'spring', stiffness: 520, damping: 24 }}
    className="focus:outline-none touch-manipulation"
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    <svg width={52} height={52} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={isActive ? color : '#e5e7eb'}
        stroke={isActive ? color : '#d1d5db'}
        strokeWidth="0.5"
        style={{
          filter: isActive ? `drop-shadow(0 0 5px ${color}70)` : 'none',
          transition: 'fill 0.12s ease, filter 0.12s ease',
        }}
      />
    </svg>
  </motion.button>
));
StarButton.displayName = 'StarButton';

export const StarRating = memo(({ value, onChange, size = 52, color = '#f59e0b' }: StarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  const handleTap   = useCallback((s: number) => onChange(s), [onChange]);
  const handleHover = useCallback((s: number) => setHovered(s), []);
  const handleLeave = useCallback(() => setHovered(0), []);

  return (
    <div className="flex items-center gap-2.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarButton
          key={star}
          star={star}
          isActive={star <= active}
          color={color}
          onTap={handleTap}
          onHover={handleHover}
          onLeave={handleLeave}
        />
      ))}
    </div>
  );
});
StarRating.displayName = 'StarRating';
