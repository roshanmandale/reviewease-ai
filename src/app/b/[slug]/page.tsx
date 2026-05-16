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

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'rating' | 'tone' | 'reviews' | 'done';
const STEP_INDEX: Record<Step, number> = { rating: 0, tone: 1, reviews: 2, done: 3 };

// ─── Static data (defined outside component — never re-created) ───────────────
const RATING_CONFIG = [
  { label: '',         emoji: '',   desc: '',                           color: '' },
  { label: 'Poor',     emoji: '😞', desc: "We're sorry to hear that.",  color: '#ef4444' },
  { label: 'Fair',     emoji: '😐', desc: 'Thanks for your feedback.',  color: '#f97316' },
  { label: 'Good',     emoji: '🙂', desc: 'Glad you had a good time!',  color: '#eab308' },
  { label: 'Great',    emoji: '😄', desc: "That's wonderful to hear!",  color: '#22c55e' },
  { label: 'Amazing!', emoji: '🤩', desc: 'You made our day! 🎉',       color: '#8b5cf6' },
];

const SLIDE = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
};

const SPRING = { type: 'spring' as const, stiffness: 360, damping: 34 };

// ─── In-memory business cache (shared across all instances on same device) ────
// Prevents re-fetching Firestore on every page visit for the same slug
const bizCache = new Map<string, Business>();

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Shimmer = memo(({ h }: { h: number }) => (
  <div className="rounded-2xl overflow-hidden" style={{ height: h }}>
    <motion.div
      className="w-full h-full"
      style={{ background: 'linear-gradient(90deg, #f5f5f5 0%, #ebebeb 50%, #f5f5f5 100%)', backgroundSize: '300% 100%' }}
      animate={{ backgroundPosition: ['100% 0%', '-100% 0%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
));
Shimmer.displayName = 'Shimmer';

// ─── Main page ────────────────────────────────────────────────────────────────
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

  // ── Navigation helper ──
  const goTo = useCallback((next: Step) => {
    setDir(STEP_INDEX[next] > STEP_INDEX[step] ? 1 : -1);
    setStep(next);
  }, [step]);

  // ── Load business (with cache) ──
  useEffect(() => {
    if (!slug) return;
    if (bizCache.has(slug)) {
      setBusiness(bizCache.get(slug)!);
      return;
    }
    getBusinessBySlug(slug)
      .then((biz) => {
        if (!biz) { setNotFound(true); return; }
        bizCache.set(slug, biz);
        setBusiness(biz);
        // Fire-and-forget scan log — never blocks UI
        const ua = navigator.userAgent;
        logScan({ businessId: biz.id, slug: biz.slug, deviceType: getDeviceType(ua), userAgent: ua, timestamp: new Date().toISOString() }).catch(() => {});
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  // ── Generate reviews ──
  const generate = useCallback(async () => {
    if (!business) return;
    setGenerating(true);
    goTo('reviews');
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // AbortController not needed — fetch is short-lived
        body: JSON.stringify({
          businessName: business.name,
          category: business.category,
          city: business.city,
          about: business.about || '',
          speciality: business.speciality || '',
          rating,
          tone,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const raw: Array<{ text: string } | string> = data.reviews || [];
      setReviews(raw.map((r) => (typeof r === 'string' ? r : r.text)).filter(Boolean));
    } catch {
      toast.error('Could not generate reviews. Please try again.');
      goTo('tone');
    } finally {
      setGenerating(false);
    }
  }, [business, rating, tone, goTo]);

  // ── Copy & redirect ──
  const copyAndRedirect = useCallback(async () => {
    if (!selected || !business) return;
    try {
      await copyToClipboard(selected);
      setCopied(true);
      toast.success('Copied! Opening Google… 🎉');
      // Fire-and-forget — never blocks the user
      logReviewClick({ businessId: business.id, rating, tone, reviewText: selected, redirected: true, timestamp: new Date().toISOString() }).catch(() => {});
      setTimeout(() => { window.open(getGoogleReviewUrl(business.placeId), '_blank'); goTo('done'); }, 800);
    } catch {
      toast.error('Could not copy. Please try again.');
    }
  }, [selected, business, rating, tone, goTo]);

  // ── Not found ──
  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900">Page Not Found</h1>
        <p className="text-gray-400 mt-2 text-sm">This review page doesn&apos;t exist or is inactive.</p>
      </div>
    </div>
  );

  // ── Loading ──
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
      className="min-h-[100dvh] flex flex-col select-none"
      style={{ background: '#f8f8fa', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}
    >

      {/* ═══ HEADER ═══════════════════════════════════════════════ */}
      <header
        className="relative overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(150deg, ${bc} 0%, ${bc}e0 55%, ${bc}b0 100%)`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute top-6 right-24 w-5 h-5 rounded-full bg-white/20 pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-3 h-3 rounded-full bg-white/15 pointer-events-none" />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/10">
          <motion.div
            className="h-full bg-white/75 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Business row */}
        <div className="relative z-10 flex items-center gap-4 px-5 pt-7 pb-5">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-[60px] h-[60px] rounded-[18px] object-cover"
                style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.28)' }}
              />
            ) : (
              <div
                className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center text-white text-2xl font-black"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', boxShadow: '0 6px 20px rgba(0,0,0,0.22)' }}
              >
                {getInitials(business.name)}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-[18px] font-black text-white leading-tight tracking-tight truncate">
              {business.name}
            </h1>
            <p className="text-[13px] text-white/60 mt-0.5 truncate">
              {business.category} · {business.city}
            </p>
          </motion.div>
        </div>

        {/* Step dots */}
        <div className="relative z-10 flex items-center justify-center gap-[7px] pb-5">
          {(['rating', 'tone', 'reviews', 'done'] as Step[]).map((s, i) => {
            const isActive = step === s;
            const isDone = STEP_INDEX[step] > i;
            return (
              <motion.div
                key={s}
                animate={{ width: isActive ? 22 : 6, opacity: isActive || isDone ? 1 : 0.35 }}
                transition={{ duration: 0.25 }}
                className="h-[6px] rounded-full bg-white"
              />
            );
          })}
        </div>
      </header>

      {/* ═══ CONTENT ══════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-md mx-auto px-5 py-7 pb-4">
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── Step 1: Rating ── */}
            {step === 'rating' && (
              <motion.div
                key="rating" custom={dir} variants={SLIDE}
                initial="enter" animate="center" exit="exit"
                transition={SPRING}
                className="space-y-7"
              >
                <div className="text-center">
                  <h2 className="text-[22px] font-black text-gray-900 tracking-tight">How was your visit?</h2>
                  <p className="text-gray-400 mt-2 text-[14px]">Tap a star to rate your experience</p>
                </div>

                <div className="flex justify-center py-1">
                  <StarRating value={rating} onChange={setRating} size={52} color={bc} />
                </div>

                {/* Feedback label */}
                <div className="h-[76px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {rating > 0 && (
                      <motion.div
                        key={rating}
                        initial={{ opacity: 0, scale: 0.55, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.55, y: -10 }}
                        transition={{ type: 'spring', stiffness: 440, damping: 24 }}
                        className="text-center"
                      >
                        <div className="text-[44px] leading-none mb-1">{RATING_CONFIG[rating].emoji}</div>
                        <p className="text-[17px] font-black tracking-tight" style={{ color: RATING_CONFIG[rating].color }}>
                          {RATING_CONFIG[rating].label}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-0.5">{RATING_CONFIG[rating].desc}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <PrimaryButton
                  onClick={() => { if (!rating) { toast.error('Please select a rating first'); return; } goTo('tone'); }}
                  disabled={!rating}
                  color={bc}
                >
                  Continue <ChevronRight size={18} strokeWidth={2.5} />
                </PrimaryButton>
              </motion.div>
            )}

            {/* ── Step 2: Tone ── */}
            {step === 'tone' && (
              <motion.div
                key="tone" custom={dir} variants={SLIDE}
                initial="enter" animate="center" exit="exit"
                transition={SPRING}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="flex justify-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18}
                        style={{ color: i < rating ? bc : '#e5e7eb', fill: i < rating ? bc : '#e5e7eb' }}
                      />
                    ))}
                  </div>
                  <h2 className="text-[22px] font-black text-gray-900 tracking-tight">Choose Your Style</h2>
                  <p className="text-gray-400 mt-1.5 text-[14px]">How should your review sound?</p>
                </div>

                <ToneSelector value={tone} onChange={setTone} brandColor={bc} />

                <PrimaryButton onClick={generate} color={bc}>
                  <Sparkles size={17} strokeWidth={2} />
                  Generate My Reviews
                </PrimaryButton>

                <GhostButton onClick={() => goTo('rating')}>
                  <ArrowLeft size={14} /> Back
                </GhostButton>
              </motion.div>
            )}

            {/* ── Step 3: Reviews ── */}
            {step === 'reviews' && (
              <motion.div
                key="reviews" custom={dir} variants={SLIDE}
                initial="enter" animate="center" exit="exit"
                transition={SPRING}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-[22px] font-black text-gray-900 tracking-tight">Pick Your Review</h2>
                  <p className="text-gray-400 mt-1.5 text-[14px]">Select one, then tap the button below</p>
                </div>

                {generating ? (
                  <div className="space-y-3 pt-1">
                    <Shimmer h={76} />
                    <Shimmer h={64} />
                    <Shimmer h={72} />
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles size={12} className="text-violet-400" />
                      </motion.div>
                      <p className="text-[12px] text-gray-400">Writing personalised reviews…</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review, i) => (
                      <ReviewCard
                        key={i} text={review}
                        selected={selected === review}
                        onSelect={() => setSelected(review)}
                        index={i} brandColor={bc}
                      />
                    ))}
                  </div>
                )}

                {!generating && (
                  <>
                    <PrimaryButton
                      onClick={copyAndRedirect}
                      disabled={!selected}
                      color={bc}
                      className="mt-1"
                    >
                      {copied ? <Check size={18} strokeWidth={2.5} /> : <Copy size={17} strokeWidth={2} />}
                      {copied ? 'Copied! Opening Google…' : 'Copy & Post on Google'}
                      {!copied && <ExternalLink size={14} strokeWidth={2} />}
                    </PrimaryButton>

                    <GhostButton onClick={() => { setReviews([]); setSelected(null); generate(); }}>
                      <RefreshCw size={12} /> Try different options
                    </GhostButton>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Step 4: Done ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="text-center space-y-6 pt-2"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.08 }}
                  className="flex justify-center"
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-[52px]"
                    style={{ background: `${bc}15`, border: `3px solid ${bc}30` }}
                  >
                    🎉
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                  <h2 className="text-[22px] font-black text-gray-900 tracking-tight">Thank You!</h2>
                  <p className="text-gray-500 mt-2 text-[14px] leading-relaxed max-w-[260px] mx-auto">
                    Your review is copied. Open Google, paste it, and tap Submit — done in 5 seconds!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 }}
                  className="rounded-2xl p-4 text-left"
                  style={{ background: `${bc}0a`, border: `1.5px solid ${bc}28` }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: bc }}>
                    Your Review
                  </p>
                  <p className="text-[13px] text-gray-700 leading-relaxed italic">
                    &ldquo;{selected}&rdquo;
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
                  <a href={getGoogleReviewUrl(business.placeId)} target="_blank" rel="noopener noreferrer">
                    <PrimaryButton color={bc}>
                      <ExternalLink size={17} strokeWidth={2} />
                      Open Google Reviews
                    </PrimaryButton>
                  </a>
                </motion.div>

                <p className="text-[12px] text-gray-400">Paste the review and tap Submit on Google</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════ */}
      <footer
        className="flex-shrink-0 flex items-center justify-center gap-1.5 py-3 bg-white/70 border-t border-gray-100/80 backdrop-blur-sm"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        <Sparkles size={10} className="text-violet-400" />
        <span className="text-[11px] text-gray-400">Powered by</span>
        <span className="text-[11px] font-bold text-violet-500">ReviewKaro</span>
      </footer>
    </div>
  );
}

// ─── Reusable button components (memoized, never re-created) ──────────────────

interface BtnProps {
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  children: React.ReactNode;
  className?: string;
}

const PrimaryButton = memo(({ onClick, disabled, color = '#7c3aed', children, className = '' }: BtnProps) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled}
    whileTap={{ scale: disabled ? 1 : 0.96 }}
    className={`w-full py-[15px] rounded-2xl font-black text-white text-[15px] flex items-center justify-center gap-2 transition-colors duration-150 touch-manipulation ${className}`}
    style={{
      background: disabled ? '#d1d5db' : `linear-gradient(135deg, ${color} 0%, ${color}c0 100%)`,
      boxShadow: disabled ? 'none' : `0 6px 24px ${color}45`,
      opacity: disabled ? 0.4 : 1,
      WebkitTapHighlightColor: 'transparent',
    }}
  >
    {children}
  </motion.button>
));
PrimaryButton.displayName = 'PrimaryButton';

const GhostButton = memo(({ onClick, children }: BtnProps) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-1.5 text-[13px] text-gray-400 py-2 touch-manipulation active:text-gray-600 transition-colors"
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    {children}
  </button>
));
GhostButton.displayName = 'GhostButton';
