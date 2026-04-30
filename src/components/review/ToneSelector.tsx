'use client';

import React from 'react';
import { ReviewTone } from '@/types';

interface Tone {
  value: ReviewTone;
  label: string;
  sublabel: string;
  emoji: string;
  accent: string;
}

const TONES: Tone[] = [
  { value: 'Friendly',     label: 'Friendly',      sublabel: 'Warm & casual',       emoji: '😊', accent: '#f97316' },
  { value: 'Professional', label: 'Professional',  sublabel: 'Formal & polished',   emoji: '💼', accent: '#3b82f6' },
  { value: 'Hindi',        label: 'हिंदी',          sublabel: 'Pure Hindi',          emoji: '🇮🇳', accent: '#22c55e' },
  { value: 'Hinglish',     label: 'Hinglish',      sublabel: 'Hindi + English',     emoji: '🤙', accent: '#8b5cf6' },
  { value: 'Short',        label: 'Short & Crisp', sublabel: 'Under 10 words',      emoji: '⚡', accent: '#eab308' },
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
        const accentColor = selected ? brandColor : tone.accent;

        return (
          <button
            key={tone.value}
            type="button"
            onClick={() => onChange(tone.value)}
            className={`relative rounded-2xl p-4 text-left transition-all duration-150 active:scale-[0.96] touch-manipulation ${isLast ? 'col-span-2' : ''}`}
            style={{
              WebkitTapHighlightColor: 'transparent',
              background: selected
                ? `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}08 100%)`
                : 'white',
              border: selected
                ? `2px solid ${brandColor}60`
                : '2px solid #f0f0f0',
              boxShadow: selected
                ? `0 4px 20px ${brandColor}20`
                : '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* Emoji bubble */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3"
              style={{
                background: selected
                  ? `${brandColor}18`
                  : `${tone.accent}12`,
              }}
            >
              {tone.emoji}
            </div>

            {/* Labels */}
            <p
              className="text-sm font-bold leading-tight"
              style={{ color: selected ? brandColor : '#1f2937' }}
            >
              {tone.label}
            </p>
            <p className="text-xs mt-0.5 text-gray-400 leading-tight">{tone.sublabel}</p>

            {/* Selected checkmark */}
            {selected && (
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
