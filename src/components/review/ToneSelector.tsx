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
  { value: 'Hinglish',     label: 'Hinglish',      sublabel: 'Hindi + English',     emoji: '🤙' },
  { value: 'Short',        label: 'Short & Crisp', sublabel: 'Under 10 words',      emoji: '⚡' },
];

interface ToneSelectorProps {
  value: ReviewTone;
  onChange: (tone: ReviewTone) => void;
  brandColor?: string;
}

export function ToneSelector({ value, onChange, brandColor = '#7c3aed' }: ToneSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TONES.map((tone, i) => {
        const selected = value === tone.value;
        const isLast = i === TONES.length - 1 && TONES.length % 2 !== 0;

        return (
          <button
            key={tone.value}
            type="button"
            onClick={() => onChange(tone.value)}
            style={{
              WebkitTapHighlightColor: 'transparent',
              ...(isLast ? {} : {}),
              ...(selected
                ? {
                    borderColor: brandColor,
                    backgroundColor: `${brandColor}10`,
                    boxShadow: `0 0 0 2px ${brandColor}`,
                  }
                : {
                    borderColor: '#e5e7eb',
                    backgroundColor: '#fafafa',
                  }),
            }}
            className={`
              relative rounded-2xl p-3.5 text-left
              border-2 transition-all duration-150
              active:scale-[0.97] touch-manipulation
              ${isLast ? 'col-span-2' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Emoji bubble */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  backgroundColor: selected ? `${brandColor}18` : '#f3f4f6',
                }}
              >
                {tone.emoji}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-bold leading-tight"
                  style={{ color: selected ? brandColor : '#1f2937' }}
                >
                  {tone.label}
                </p>
                <p className="text-xs mt-0.5 text-gray-400 leading-tight">{tone.sublabel}</p>
              </div>

              {/* Check */}
              {selected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
