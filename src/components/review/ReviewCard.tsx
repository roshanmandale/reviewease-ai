'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
  index: number;
}

export function ReviewCard({ text, selected, onSelect, index }: ReviewCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-2xl border-2 transition-all duration-200',
        selected
          ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100'
          : 'border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
            selected ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
          )}
        >
          {selected && <Check size={11} className="text-white" />}
        </div>
        <p className={cn('text-sm leading-relaxed', selected ? 'text-violet-900' : 'text-gray-700')}>
          {text}
        </p>
      </div>
    </motion.button>
  );
}
