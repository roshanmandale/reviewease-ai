'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  color?: string;
}

export function StarRating({ value, onChange, size = 44, color = '#f59e0b' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= active;
        return (
          <motion.button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.15, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="focus:outline-none"
          >
            <motion.div
              animate={{
                scale: isActive ? 1 : 0.9,
                rotate: isActive && star === active ? [0, -8, 8, 0] : 0,
              }}
              transition={{ duration: 0.25 }}
            >
              <Star
                size={size}
                style={{
                  color: isActive ? color : '#e5e7eb',
                  fill: isActive ? color : '#e5e7eb',
                  filter: isActive ? `drop-shadow(0 2px 6px ${color}60)` : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}
