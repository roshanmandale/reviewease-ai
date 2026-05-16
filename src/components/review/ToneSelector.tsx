'use client';

import React, { memo, useCallback } from 'react';
import { ReviewTone } from '@/types';

const TONES = [
  { value: 'Friendly'     as ReviewTone, label: 'Friendly',      sublabel: 'Warm & casual',     emoji: '😊', accent: '#f97316' },
  { value: 'Professional' as ReviewTone, label: 'Professional',  sublabel: 'Formal & polished', emoji: '💼', accent: '#3b82f6' },
  { value: 'Hindi'        as ReviewTone, label: 'हिंदी',          sublabel: 'Pure Hindi',        emoji: '🇮🇳', accent: '#22c55e' },
  { value: 'Hinglish'     as ReviewTone, label: 'Hinglish',      sublabel: 'Hindi + English',   emoji: '🤙', accent: '#8b5cf6' },
  { value: 'Short'        as ReviewTone, label: 'Short & Crisp', sublabel: 'Under 10 words',    emoji: '⚡', accent: '#eab308' },
] as const;

interface ToneSelectorProps {
  value: ReviewTone;
  onChange: (tone: ReviewTone) => void;
  brandColor?: string;
}

const ToneCard = memo(({ tone, selected, brandColor, onSelect }: {
  tone: typeof TONES[number];
  selected: boolean;
  brandColor: string;
  onSelect: (v: ReviewTone) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(tone.value)}
    className="flex-shrink-0 relative rounded-2xl text-left transition-all duration-150 active:scale-[0.95] touch-manipulation"
    style={{
      width: 120,
      padding: '14px 14px 12px',
      WebkitTapHighlightColor: 'transparent',
      background: selected
        ? `linear-gradient(145deg, ${brandColor}18 0%, ${brandColor}08 100%)`
        : 'white',
      border: selected ? `2px solid ${brandColor}55` : '2px solid #f0f0f0',
      boxShadow: selected
        ? `0 4px 16px ${brandColor}22`
        : '0 1px 4px rgba(0,0,0,0.06)',
    }}
  >
    {/* Emoji */}
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] mb-3"
      style={{ background: selected ? `${brandColor}18` : `${tone.accent}12` }}
    >
      {tone.emoji}
    </div>

    {/* Label */}
    <p className="text-[13px] font-bold leading-tight" style={{ color: selected ? brandColor : '#1f2937' }}>
      {tone.label}
    </p>
    <p className="text-[11px] mt-0.5 leading-tight" style={{ color: '#9ca3af' }}>
      {tone.sublabel}
    </p>

    {/* Check badge */}
    {selected && (
      <div
        className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: brandColor }}
      >
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.2 5.7L8 1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )}
  </button>
));
ToneCard.displayName = 'ToneCard';

export const ToneSelector = memo(({ value, onChange, brandColor = '#7c3aed' }: ToneSelectorProps) => {
  const handleSelect = useCallback((v: ReviewTone) => onChange(v), [onChange]);

  return (
    <div>
      {/* Horizontal scroll row — no cramped grid */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        {TONES.map((tone) => (
          <ToneCard
            key={tone.value}
            tone={tone}
            selected={value === tone.value}
            brandColor={brandColor}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Selected tone description */}
      <div className="mt-3 px-1">
        {TONES.filter((t) => t.value === value).map((t) => (
          <p key={t.value} className="text-[13px] text-gray-500 text-center">
            <span className="font-semibold text-gray-700">{t.label}</span> — {t.sublabel}
          </p>
        ))}
      </div>
    </div>
  );
});
ToneSelector.displayName = 'ToneSelector';
