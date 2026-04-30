'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ReviewCardProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
  index: number;
}

export function ReviewCard({ text, selected, onSelect, index }: ReviewCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden
        ${selected
          ? 'border-white/30 bg-white/15 shadow-lg shadow-black/20'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
        }
      `}
    >
      {/* Selected glow */}
      {selected && (
        <motion.div
          layoutId="reviewSelected"
          className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      <div className="relative z-10 flex items-start gap-3">
        {/* Radio indicator */}
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200
            ${selected ? 'border-white bg-white' : 'border-white/30'}
          `}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="w-2 h-2 rounded-full bg-violet-600"
            />
          )}
        </div>

        <p className={`text-sm leading-relaxed ${selected ? 'text-white' : 'text-white/70'}`}>
          {text}
        </p>
      </div>
    </motion.button>
  );
}
