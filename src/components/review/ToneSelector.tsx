'use client';

import React from 'react';
import { ReviewTone } from '@/types';

interface Tone {
  value: ReviewTone;
  label: string;
  sublabel: string;
  emoji: string;
}

const TONES: Tone[] = [
  { value: 'Friendly',     label: 'Friendly',      sublabel: 'Warm & casual',       emoji: '😊' },
  { value: 'Professional', label: 'Professional',  sublabel: 'Formal & polished',   emoji: '💼' },
  { value: 'Hindi',        label: 'हिंदी',          sublabel: 'Pure Hindi',          emoji: '🇮🇳' },
  { value: 'Hinglish',     label: 'Hinglish',      sublabel: 'Hindi + English mix', emoji: '🤙' },
  { value: 'Short',        label: 'Short & Crisp', sublabel: 'Under 10 words',      emoji: '⚡' },
];

interface ToneSelectorProps {
  value: ReviewTone;
  onChange: (tone: ReviewTone) => void;
  brandColor?: string;
}

export function ToneSelector({ value, onChange, brandColor = '#7c3aed' }: ToneSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TONES.map((tone, i) => {
        const selected = value === tone.value;
        const isLast = i === TONES.length - 1 && TONES.length % 2 !== 0;

        return (
          <button
            key={tone.value}
            type="button"
            onClick={() => onChange(tone.value)}
            className={`
              relative rounded-2xl p-3.5 text-left transition-all duration-150 active:scale-[0.98]
              ${isLast ? 'col-span-2' : ''}
              ${selected
                ? 'border-2 shadow-sm'
                : 'border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
              }
            `}
            style={
              selected
                ? {
                    borderColor: brandColor,
                    backgroundColor: `${brandColor}0d`,
                    boxShadow: `0 2px 12px ${brandColor}20`,
                  }
                : {}
            }
          >
            <div className="flex items-center gap-2.5">
              {/* Emoji */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={
                  selected
                    ? { backgroundColor: `${brandColor}18` }
                    : { backgroundColor: 'rgba(0,0,0,0.04)' }
                }
              >
                {tone.emoji}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-tight truncate"
                  style={{ color: selected ? brandColor : '#374151' }}
                >
                  {tone.label}
                </p>
                <p className="text-xs mt-0.5 text-gray-400 truncate">{tone.sublabel}</p>
              </div>

              {/* Selected dot */}
              {selected && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
