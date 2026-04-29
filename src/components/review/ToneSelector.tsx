'use client';

import React from 'react';
import { ReviewTone } from '@/types';
import { cn } from '@/lib/utils';

const TONES: { value: ReviewTone; label: string; emoji: string }[] = [
  { value: 'Professional', label: 'Professional', emoji: '💼' },
  { value: 'Friendly', label: 'Friendly', emoji: '😊' },
  { value: 'Hindi', label: 'हिंदी', emoji: '🇮🇳' },
  { value: 'Hinglish', label: 'Hinglish', emoji: '✨' },
  { value: 'Short', label: 'Short', emoji: '⚡' },
];

interface ToneSelectorProps {
  value: ReviewTone;
  onChange: (tone: ReviewTone) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {TONES.map((tone) => (
        <button
          key={tone.value}
          type="button"
          onClick={() => onChange(tone.value)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150',
            value === tone.value
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <span>{tone.emoji}</span>
          {tone.label}
        </button>
      ))}
    </div>
  );
}
