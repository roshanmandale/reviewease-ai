'use client';

import React, { useState, useEffect } from 'react';
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

const ratingConfig = [
  { label: '', emoji: '', desc: '', color: '' },
  { label: 'Poor',     emoji: '😞', desc: "We're sorry to hear that.",    color: '#ef4444' },
  { label: 'Fair',     emoji: '😐', desc: 'Thanks for your feedback.',    color: '#f97316' },
  { label: 'Good',     emoji: '🙂', desc: 'Glad you had a good time!',    color: '#eab308' },
  { label: 'Great',    emoji: '😄', desc: "That's wonderful to hear!",    color: '#22c55e' },
  { label: 'Amazing!', emoji: '🤩', desc: 'You made our day! 🎉',         color: '#8b5cf6' },
];

const slide = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
};

export default function ReviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>('rating');
  const [dir, setDir] = useState(1);
  const [rating, setRating] = useState(0);
  const [tone, setTone] = useState<ReviewTone>('Friendly');
  const [reviews, setReviews] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const goTo = (next: Step) => {
    setDir(STEP_INDEX[next] > STEP_INDEX[step] ? 1 : -1);
    setStep(next);
  };

  useEffect(() => {
    if (!slug) return;
    getBusinessBySlug(slug).then((biz) => {
      if (!biz) { setNotFound(true); return; }
      setBusiness(biz);
      const ua = navigator.userAgent;
      logScan({ businessId: biz.id, slug: biz.slug, deviceType: getDeviceType(ua), userAgent: ua, timestamp: new Date().toISOString() }).catch(() => {});
    }).catch(() => setNotFound(true));
  }, [slug]);

  const generate = async () => {
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
    } catch { toast.error('Failed to generate. Please try again.'); goTo('tone'); }
    finally { setGenerating(false); }
  };

  const copyAndRedirect = async () => {
    if (!selected || !business) return;
    await copyToClipboard(selected);
    setCopied(true);
    toast.success('Copied! Opening Google… 🎉');
    logReviewClick({ businessId: business.id, rating, tone, reviewText: selected, redirected: true, timestamp: new Date().toISOString() }).catch(() => {});
    setTimeout(() => { window.open(getGoogleReviewUrl(business.placeId), '_blank'); goTo('done'); }, 900);
  };

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center"><div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900">Page Not Found</h1>
        <p className="text-gray-400 mt-2 text-sm">This review page doesn&apos;t exist or is inactive.</p>
      </div>
    </div>
  );

  if (!business) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const bc = business.brandColor;
  const pct = step === 'rating' ? 25 : step === 'tone' ? 50 : step === 'reviews' ? 75 : 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #fafafa 0%, #f4f4f8 100%)',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
      }}
    >
      {/* ─── HERO HEADER ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(145deg, ${bc} 0%, ${bc}dd 60%, ${bc}99 100%)`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/8 pointer-events-none" />
        <div className="absolute top-4 right-20 w-6 h-6 rounded-full bg-white/15 pointer-events-none" />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/10">
          <motion.div
            className="h-full rounded-full bg-white/70"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          />
        </div>

        {/* Business info */}
        <div className="relative z-10 flex items-center gap-4 px-5 pt-6 pb-7">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name}
                className="w-16 h-16 rounded-2xl object-cover"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
              >
                {getInitials(business.name)}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-xl font-black text-white leading-tight truncate tracking-tight">
              {business.name}
            </h1>
            <p className="text-sm text-white/65 mt-0.5 truncate">
              {business.category} &nbsp;·&nbsp; {business.city}
            </p>
          </motion.div>
        </div>

        {/* Step indicator dots */}
        <div className="relative z-10 flex items-center justify-center gap-2 pb-4">
          {(['rating', 'tone', 'reviews', 'done'] as Step[]).map((s, i) => {
            const done = STEP_INDEX[step] > i;
            const active = step === s;
            return (
              <div
                key={s}
                className="rounded-full transition-all duration-300"
                style={{
                  width: active ? 20 : 6,
                  height: 6,
                  backgroundColor: active || done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ─── CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 py-7">
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── STEP 1: Rating ── */}
            {step === 'rating' && (
              <motion.div key="rating" custom={dir} variants={slide}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">How was your visit?</h2>
                  <p className="text-gray-400 mt-2 text-sm">Tap a star to rate your experience</p>
                </div>

                {/* Stars */}
                <div className="flex justify-center">
                  <StarRating value={rating} onChange={setRating} size={54} color={bc} />
                </div>

                {/* Rating feedback */}
                <div className="h-20 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {rating > 0 && (
                      <motion.div key={rating}
                        initial={{ opacity: 0, scale: 0.5, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -12 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                        className="text-center"
                      >
                        <div className="text-5xl mb-1.5">{ratingConfig[rating].emoji}</div>
                        <p className="text-lg font-black tracking-tight" style={{ color: ratingConfig[rating].color }}>
                          {ratingConfig[rating].label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{ratingConfig[rating].desc}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={() => { if (rating === 0) { toast.error('Please select a rating first'); return; } goTo('tone'); }}
                  whileTap={{ scale: 0.96 }}
                  disabled={rating === 0}
                  className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 disabled:opacity-20 transition-all duration-200"
                  style={{
                    background: rating > 0 ? `linear-gradient(135deg, ${bc} 0%, ${bc}bb 100%)` : '#d1d5db',
                    boxShadow: rating > 0 ? `0 8px 28px ${bc}50` : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Continue <ChevronRight size={18} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 2: Tone ── */}
            {step === 'tone' && (
              <motion.div key="tone" custom={dir} variants={slide}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                className="space-y-5"
              >
                <div className="text-center">
                  {/* Stars recap */}
                  <div className="flex justify-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={20}
                        style={{ color: i < rating ? bc : '#e5e7eb', fill: i < rating ? bc : '#e5e7eb' }}
                      />
                    ))}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Choose Your Style</h2>
                  <p className="text-gray-400 mt-1.5 text-sm">How should your review sound?</p>
                </div>

                <ToneSelector value={tone} onChange={setTone} brandColor={bc} />

                <motion.button
                  onClick={generate}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${bc} 0%, ${bc}bb 100%)`,
                    boxShadow: `0 8px 28px ${bc}50`,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Sparkles size={18} strokeWidth={2} />
                  Generate My Reviews
                </motion.button>

                <button onClick={() => goTo('rating')}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 py-2"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </motion.div>
            )}

            {/* ── STEP 3: Reviews ── */}
            {step === 'reviews' && (
              <motion.div key="reviews" custom={dir} variants={slide}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pick Your Review</h2>
                  <p className="text-gray-400 mt-1.5 text-sm">Select one and tap the button below</p>
                </div>

                {generating ? (
                  <div className="space-y-3 pt-1">
                    {[80, 64, 72].map((h, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden" style={{ height: h }}>
                        <motion.div
                          className="w-full h-full"
                          style={{
                            background: 'linear-gradient(90deg, #f0f0f0 0%, #e4e4e4 50%, #f0f0f0 100%)',
                            backgroundSize: '300% 100%',
                          }}
                          animate={{ backgroundPosition: ['100% 0%', '-100% 0%'] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', delay: i * 0.12 }}
                        />
                      </div>
                    ))}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles size={13} className="text-violet-400" />
                      </motion.div>
                      <p className="text-xs text-gray-400">Writing personalised reviews…</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review, i) => (
                      <ReviewCard key={i} text={review} selected={selected === review}
                        onSelect={() => setSelected(review)} index={i} brandColor={bc}
                      />
                    ))}
                  </div>
                )}

                {!generating && (
                  <>
                    <motion.button
                      onClick={copyAndRedirect}
                      disabled={!selected}
                      whileTap={{ scale: 0.96 }}
                      className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 disabled:opacity-20 transition-all duration-200 mt-1"
                      style={{
                        background: selected ? `linear-gradient(135deg, ${bc} 0%, ${bc}bb 100%)` : '#d1d5db',
                        boxShadow: selected ? `0 8px 28px ${bc}50` : 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {copied ? <Check size={18} strokeWidth={2.5} /> : <Copy size={18} strokeWidth={2} />}
                      {copied ? 'Copied! Opening Google…' : 'Copy & Post on Google'}
                      {!copied && <ExternalLink size={15} strokeWidth={2} />}
                    </motion.button>

                    <button
                      onClick={() => { setReviews([]); setSelected(null); generate(); }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 py-2"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <RefreshCw size={12} /> Try different options
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* ── STEP 4: Done ── */}
            {step === 'done' && (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="text-center space-y-6 pt-2"
              >
                {/* Animated success icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                  className="flex justify-center"
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                    style={{
                      background: `linear-gradient(135deg, ${bc}20, ${bc}10)`,
                      border: `3px solid ${bc}30`,
                    }}
                  >
                    🎉
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Thank You!</h2>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                    Your review is copied. Open Google, paste it, and tap Submit — done in 5 seconds!
                  </p>
                </motion.div>

                {/* Review preview */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl p-4 text-left"
                  style={{ background: `${bc}0a`, border: `1.5px solid ${bc}25` }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: bc }}>
                    Your Review
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    &ldquo;{selected}&rdquo;
                  </p>
                </motion.div>

                <motion.a
                  href={getGoogleReviewUrl(business.placeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="block"
                >
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${bc} 0%, ${bc}bb 100%)`,
                      boxShadow: `0 8px 28px ${bc}50`,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <ExternalLink size={18} strokeWidth={2} />
                    Open Google Reviews
                  </motion.button>
                </motion.a>

                <p className="text-xs text-gray-400">Paste the review and tap Submit on Google</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-1.5 py-3 bg-white/60 border-t border-gray-100"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        <Sparkles size={10} className="text-violet-400" />
        <span className="text-xs text-gray-400">Powered by</span>
        <span className="text-xs font-bold text-violet-500">ReviewKaro</span>
      </div>
    </div>
  );
}
