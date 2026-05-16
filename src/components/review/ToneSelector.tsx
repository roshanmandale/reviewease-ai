'use client';

import React, { memo, useCallback } from 'react';
import { ReviewTone } from '@/types';

// Static — defined once, never re-created
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

// Memoized single tone card
const ToneCard = memo(({
  tone, selected, brandColor, onSelect,
}: {
  tone: typeof TONES[number];
  selected: boolean;
  brandColor: string;
  onSelect: (v: ReviewTone) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(tone.value)}
    className="relative rounded-2xl p-4 text-left transition-all duration-150 active:scale-[0.96] touch-manipulation"
    style={{
      WebkitTapHighlightColor: 'transparent',
      background: selected
        ? `linear-gradient(135deg, ${brandColor}14 0%, ${brandColor}07 100%)`
        : 'white',
      border: selected ? `2px solid ${brandColor}55` : '2px solid #efefef',
      boxShadow: selected ? `0 4px 18px ${brandColor}1e` : '0 1px 3px rgba(0,0,0,0.05)',
    }}
  >
    {/* Emoji */}
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] mb-3"
      style={{ background: selected ? `${brandColor}18` : `${tone.accent}12` }}
    >
      {tone.emoji}
    </div>

    {/* Text */}
    <p className="text-[13px] font-bold leading-tight" style={{ color: selected ? brandColor : '#1f2937' }}>
      {tone.label}
    </p>
    <p className="text-[11px] mt-0.5 text-gray-400 leading-tight">{tone.sublabel}</p>

    {/* Checkmark */}
    {selected && (
      <div
        className="absolute top-3 right-3 w-[18px] h-[18px] rounded-full flex items-center justify-center"
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
    <div className="grid grid-cols-2 gap-2.5">
      {TONES.map((tone, i) => (
        <div key={tone.value} className={i === TONES.length - 1 && TONES.length % 2 !== 0 ? 'col-span-2' : ''}>
          <ToneCard
            tone={tone}
            selected={value === tone.value}
            brandColor={brandColor}
            onSelect={handleSelect}
          />
        </div>
      ))}
    </div>
  );
});
ToneSelector.displayName = 'ToneSelector';
