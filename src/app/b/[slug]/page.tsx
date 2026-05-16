'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ExternalLink, Copy, Check,
  Star, RefreshCw, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { Business, ReviewTone } from '@/types';
import { getBusinessBySlug } from '@/services/businessService';
import { logScan, logReviewClick } from '@/services/logService';
import { StarRating } from '@/components/review/StarRating';
import { ToneSelector } from '@/components/review/ToneSelector';
import { ReviewCard } from '@/components/review/ReviewCard';
import { getGoogleReviewUrl, copyToClipboard, getInitials, getDeviceType } from '@/lib/utils';
import toast from 'react-hot-toast';

type Step = 'rating' | 'tone' | 'reviews' | 'done';
const STEP_INDEX: Record<Step, number> = { rating: 0, tone: 1, reviews: 2, done: 3 };

const RATING_CONFIG = [
  { label: '',         emoji: '',   desc: '',                           color: '' },
  { label: 'Poor',     emoji: '😞', desc: "We're sorry to hear that.",  color: '#ef4444' },
  { label: 'Fair',     emoji: '😐', desc: 'Thanks for your feedback.',  color: '#f97316' },
  { label: 'Good',     emoji: '🙂', desc: 'Glad you had a good time!',  color: '#eab308' },
  { label: 'Great',    emoji: '😄', desc: "That's wonderful to hear!",  color: '#22c55e' },
  { label: 'Amazing!', emoji: '🤩', desc: 'You made our day! 🎉',       color: '#8b5cf6' },
];

const SLIDE = {
  enter: (d: number) => ({ opacity: 0, y: d > 0 ? 24 : -24 }),
  center: { opacity: 1, y: 0 },
  exit:  (d: number) => ({ opacity: 0, y: d > 0 ? -24 : 24 }),
};

const bizCache = new Map<string, Business>();

const Shimmer = memo(({ h }: { h: number }) => (
  <div className="rounded-2xl overflow-hidden" style={{ height: h }}>
    <motion.div
      className="w-full h-full"
      style={{ background: 'linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%)', backgroundSize: '300% 100%' }}
      animate={{ backgroundPosition: ['100% 0%', '-100% 0%'] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
    />
  </div>
));
Shimmer.displayName = 'Shimmer';

export default function ReviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(() => bizCache.get(slug) ?? null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>('rating');
  const [dir, setDir] = useState(1);
  const [rating, setRating] = useState(0);
  const [tone, setTone] = useState<ReviewTone>('Friendly');
  const [reviews, setReviews] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const goTo = useCallback((next: Step) => {
    setDir(STEP_INDEX[next] > STEP_INDEX[step] ? 1 : -1);
    setStep(next);
  }, [step]);

  useEffect(() => {
    if (!slug) return;
    if (bizCache.has(slug)) { setBusiness(bizCache.get(slug)!); return; }
    getBusinessBySlug(slug).then((biz) => {
      if (!biz) { setNotFound(true); return; }
      bizCache.set(slug, biz);
      setBusiness(biz);
      const ua = navigator.userAgent;
      logScan({ businessId: biz.id, slug: biz.slug, deviceType: getDeviceType(ua), userAgent: ua, timestamp: new Date().toISOString() }).catch(() => {});
    }).catch(() => setNotFound(true));
  }, [slug]);

  const generate = useCallback(async () => {
    if (!business) return;
    setGenerating(true);
    goTo('reviews');
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: business.name, category: business.category, city: business.city, about: business.about || '', speciality: business.speciality || '', rating, tone }),
      });
      const data = await res.json();
      const raw: Array<{ text: string } | string> = data.reviews || [];
      setReviews(raw.map((r) => (typeof r === 'string' ? r : r.text)).filter(Boolean));
    } catch { toast.error('Could not generate reviews. Please try again.'); goTo('tone'); }
    finally { setGenerating(false); }
  }, [business, rating, tone, goTo]);

  const copyAndRedirect = useCallback(async () => {
    if (!selected || !business) return;
    try {
      await copyToClipboard(selected);
      setCopied(true);
      toast.success('Copied! Opening Google… 🎉');
      logReviewClick({ businessId: business.id, rating, tone, reviewText: selected, redirected: true, timestamp: new Date().toISOString() }).catch(() => {});
      setTimeout(() => { window.open(getGoogleReviewUrl(business.placeId), '_blank'); goTo('done'); }, 800);
    } catch { toast.error('Could not copy. Please try again.'); }
  }, [selected, business, rating, tone, goTo]);

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900">Page Not Found</h1>
        <p className="text-gray-400 mt-2 text-sm">This review page doesn&apos;t exist or is inactive.</p>
      </div>
    </div>
  );

  if (!business) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  );

  const bc = business.brandColor;
  const pct = STEP_INDEX[step] * 25 + 25;

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: '#ffffff', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}
    >
      {/* ═══ HEADER ═══════════════════════════════════════════════ */}
      <header
        className="relative overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(150deg, ${bc} 0%, ${bc}e8 100%)`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-2 right-10 w-8 h-8 rounded-full bg-white/15 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-black/5 pointer-events-none" />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/10">
          <motion.div
            className="h-full bg-white/80 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Business info */}
        <div className="relative z-10 flex items-center gap-4 px-5 pt-7 pb-4">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name}
                className="w-[58px] h-[58px] rounded-[16px] object-cover"
                style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}
              />
            ) : (
              <div
                className="w-[58px] h-[58px] rounded-[16px] flex items-center justify-center text-white text-xl font-black"
                style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}
              >
                {getInitials(business.name)}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className="flex-1 min-w-0">
            <h1 className="text-[17px] font-black text-white leading-tight tracking-tight truncate">{business.name}</h1>
            <p className="text-[12px] text-white/60 mt-0.5 truncate">{business.category} · {business.city}</p>
          </motion.div>
        </div>

        {/* Step dots */}
        <div className="relative z-10 flex items-center justify-center gap-[6px] pb-4">
          {(['rating', 'tone', 'reviews', 'done'] as Step[]).map((s, i) => {
            const isActive = step === s;
            const isDone = STEP_INDEX[step] > i;
            return (
              <motion.div key={s}
                animate={{ width: isActive ? 20 : 6, opacity: isActive || isDone ? 1 : 0.3 }}
                transition={{ duration: 0.25 }}
                className="h-[5px] rounded-full bg-white"
              />
            );
          })}
        </div>
      </header>

      {/* ═══ CONTENT ══════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-md mx-auto px-5 pt-8 pb-6">
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── Step 1: Rating ── */}
            {step === 'rating' && (
              <motion.div key="rating" custom={dir} variants={SLIDE}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              >
                {/* Title */}
                <div className="text-center mb-8">
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">How was your visit?</h2>
                  <p className="text-gray-400 mt-2 text-[14px]">Tap a star to rate your experience</p>
                </div>

                {/* Stars — large, centered */}
                <div className="flex justify-center mb-6">
                  <StarRating value={rating} onChange={setRating} size={56} color={bc} />
                </div>

                {/* Feedback pill */}
                <div className="flex justify-center mb-8" style={{ minHeight: 72 }}>
                  <AnimatePresence mode="wait">
                    {rating > 0 && (
                      <motion.div key={rating}
                        initial={{ opacity: 0, scale: 0.6, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, y: -8 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                        className="flex flex-col items-center"
                      >
                        {/* Emoji in colored circle */}
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-[36px] mb-2"
                          style={{ background: `${RATING_CONFIG[rating].color}15`, border: `2px solid ${RATING_CONFIG[rating].color}30` }}
                        >
                          {RATING_CONFIG[rating].emoji}
                        </div>
                        <p className="text-[16px] font-black tracking-tight" style={{ color: RATING_CONFIG[rating].color }}>
                          {RATING_CONFIG[rating].label}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-0.5">{RATING_CONFIG[rating].desc}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Btn onClick={() => { if (!rating) { toast.error('Please select a rating first'); return; } goTo('tone'); }} disabled={!rating} color={bc}>
                  Continue <ChevronRight size={18} strokeWidth={2.5} />
                </Btn>
              </motion.div>
            )}

            {/* ── Step 2: Tone ── */}
            {step === 'tone' && (
              <motion.div key="tone" custom={dir} variants={SLIDE}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              >
                <div className="text-center mb-6">
                  {/* Stars recap */}
                  <div className="flex justify-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} style={{ color: i < rating ? bc : '#e5e7eb', fill: i < rating ? bc : '#e5e7eb' }} />
                    ))}
                  </div>
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Choose Your Style</h2>
                  <p className="text-gray-400 mt-1.5 text-[14px]">How should your review sound?</p>
                </div>

                <ToneSelector value={tone} onChange={setTone} brandColor={bc} />

                <div className="mt-5">
                  <Btn onClick={generate} color={bc}>
                    <Sparkles size={17} strokeWidth={2} />
                    Generate My Reviews
                  </Btn>
                </div>

                <Ghost onClick={() => goTo('rating')}>
                  <ArrowLeft size={14} /> Back
                </Ghost>
              </motion.div>
            )}

            {/* ── Step 3: Reviews ── */}
            {step === 'reviews' && (
              <motion.div key="reviews" custom={dir} variants={SLIDE}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Pick Your Review</h2>
                  <p className="text-gray-400 mt-1.5 text-[14px]">Select one, then tap the button below</p>
                </div>

                {generating ? (
                  <div className="space-y-3">
                    <Shimmer h={78} /><Shimmer h={66} /><Shimmer h={74} />
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles size={12} className="text-violet-400" />
                      </motion.div>
                      <p className="text-[12px] text-gray-400">Writing personalised reviews…</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review, i) => (
                      <ReviewCard key={i} text={review} selected={selected === review}
                        onSelect={() => setSelected(review)} index={i} brandColor={bc} />
                    ))}
                  </div>
                )}

                {!generating && (
                  <div className="mt-5 space-y-1">
                    <Btn onClick={copyAndRedirect} disabled={!selected} color={bc}>
                      {copied ? <Check size={18} strokeWidth={2.5} /> : <Copy size={17} strokeWidth={2} />}
                      {copied ? 'Copied! Opening Google…' : 'Copy & Post on Google'}
                      {!copied && <ExternalLink size={14} strokeWidth={2} />}
                    </Btn>
                    <Ghost onClick={() => { setReviews([]); setSelected(null); generate(); }}>
                      <RefreshCw size={12} /> Try different options
                    </Ghost>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 4: Done ── */}
            {step === 'done' && (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="text-center"
              >
                {/* Success ring */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.08 }}
                  className="flex justify-center mb-6"
                >
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center text-[56px]"
                    style={{ background: `${bc}12`, border: `3px solid ${bc}28` }}
                  >
                    🎉
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mb-5">
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Thank You!</h2>
                  <p className="text-gray-500 mt-2 text-[14px] leading-relaxed max-w-[260px] mx-auto">
                    Your review is copied. Open Google, paste it, and tap Submit — done in 5 seconds!
                  </p>
                </motion.div>

                {/* Review preview */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                  className="rounded-2xl p-4 text-left mb-5"
                  style={{ background: `${bc}09`, border: `1.5px solid ${bc}25` }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: bc }}>Your Review</p>
                  <p className="text-[13px] text-gray-700 leading-relaxed italic">&ldquo;{selected}&rdquo;</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                  <a href={getGoogleReviewUrl(business.placeId)} target="_blank" rel="noopener noreferrer">
                    <Btn color={bc}>
                      <ExternalLink size={17} strokeWidth={2} />
                      Open Google Reviews
                    </Btn>
                  </a>
                  <p className="text-[12px] text-gray-400 mt-3">Paste the review and tap Submit on Google</p>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════ */}
      <footer
        className="flex-shrink-0 flex items-center justify-center gap-1.5 py-3 border-t border-gray-100"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
      >
        <Sparkles size={10} className="text-violet-400" />
        <span className="text-[11px] text-gray-400">Powered by</span>
        <span className="text-[11px] font-bold text-violet-500">ReviewKaro</span>
      </footer>
    </div>
  );
}

// ─── Shared button components ─────────────────────────────────────────────────

const Btn = memo(({ onClick, disabled, color = '#7c3aed', children, className = '' }: {
  onClick?: () => void; disabled?: boolean; color?: string; children: React.ReactNode; className?: string;
}) => (
  <motion.button type="button" onClick={onClick} disabled={disabled} whileTap={{ scale: disabled ? 1 : 0.96 }}
    className={`w-full py-[15px] rounded-2xl font-black text-white text-[15px] flex items-center justify-center gap-2 touch-manipulation ${className}`}
    style={{
      background: disabled ? '#e5e7eb' : `linear-gradient(135deg, ${color} 0%, ${color}c0 100%)`,
      boxShadow: disabled ? 'none' : `0 6px 22px ${color}42`,
      color: disabled ? '#9ca3af' : 'white',
      WebkitTapHighlightColor: 'transparent',
    }}
  >{children}</motion.button>
));
Btn.displayName = 'Btn';

const Ghost = memo(({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className="w-full flex items-center justify-center gap-1.5 text-[13px] text-gray-400 py-2.5 touch-manipulation active:text-gray-600 transition-colors"
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >{children}</button>
));
Ghost.displayName = 'Ghost';
