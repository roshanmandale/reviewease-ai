'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ReviewTone } from '@/types';

interface Tone {
  value: ReviewTone;
  label: string;
  sublabel: string;
  emoji: string;
  gradient: string;
}

const TONES: Tone[] = [
  {
    value: 'Friendly',
    label: 'Friendly',
    sublabel: 'Warm & casual',
    emoji: '😊',
    gradient: 'from-orange-400 to-pink-400',
  },
  {
    value: 'Professional',
    label: 'Professional',
    sublabel: 'Formal & polished',
    emoji: '💼',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    value: 'Hindi',
    label: 'हिंदी',
    sublabel: 'Pure Hindi',
    emoji: '🇮🇳',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    value: 'Hinglish',
    label: 'Hinglish',
    sublabel: 'Hindi + English mix',
    emoji: '🤙',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    value: 'Short',
    label: 'Short & Crisp',
    sublabel: 'Under 10 words',
    emoji: '⚡',
    gradient: 'from-amber-400 to-yellow-400',
  },
];

interface ToneSelectorProps {
  value: ReviewTone;
  onChange: (tone: ReviewTone) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TONES.map((tone, i) => {
        const selected = value === tone.value;
        // Last item spans full width if odd count
        const isLast = i === TONES.length - 1 && TONES.length % 2 !== 0;

        return (
          <motion.button
            key={tone.value}
            type="button"
            onClick={() => onChange(tone.value)}
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`
              relative overflow-hidden rounded-2xl p-3.5 text-left transition-all duration-200
              ${isLast ? 'col-span-2' : ''}
              ${selected
                ? 'ring-2 ring-white/80 shadow-lg'
                : 'bg-white/8 hover:bg-white/12 ring-1 ring-white/10'
              }
            `}
            style={
              selected
                ? {
                    background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                  }
                : {}
            }
          >
            {/* Gradient background when selected */}
            {selected && (
              <motion.div
                layoutId="toneSelected"
                className={`absolute inset-0 bg-gradient-to-br ${tone.gradient} opacity-90`}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            <div className="relative z-10 flex items-center gap-2.5">
              {/* Emoji bubble */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  selected ? 'bg-white/20' : 'bg-white/10'
                }`}
              >
                {tone.emoji}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold leading-tight ${
                    selected ? 'text-white' : 'text-white/80'
                  }`}
                >
                  {tone.label}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    selected ? 'text-white/80' : 'text-white/40'
                  }`}
                >
                  {tone.sublabel}
                </p>
              </div>
              {/* Selected checkmark */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
