'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Star,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  MapPin,
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
  { label: '', emoji: '', desc: '' },
  { label: 'Poor',     emoji: '😞', desc: "We're sorry to hear that." },
  { label: 'Fair',     emoji: '😐', desc: 'Thanks for your feedback.' },
  { label: 'Good',     emoji: '🙂', desc: 'Glad you had a good time!' },
  { label: 'Great',    emoji: '😄', desc: "That's wonderful to hear!" },
  { label: 'Amazing!', emoji: '🤩', desc: 'You made our day! 🎉' },
];

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
};

export default function ReviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>('rating');
  const [direction, setDirection] = useState(1);
  const [rating, setRating] = useState(0);
  const [tone, setTone] = useState<ReviewTone>('Friendly');
  const [reviews, setReviews] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const goTo = (next: Step) => {
    setDirection(STEP_INDEX[next] > STEP_INDEX[step] ? 1 : -1);
    setStep(next);
  };

  useEffect(() => {
    if (!slug) return;
    async function load() {
      try {
        const biz = await getBusinessBySlug(slug);
        if (!biz) { setNotFound(true); return; }
        setBusiness(biz);
        const ua = navigator.userAgent;
        logScan({ businessId: biz.id, slug: biz.slug, deviceType: getDeviceType(ua), userAgent: ua, timestamp: new Date().toISOString() }).catch(() => {});
      } catch { setNotFound(true); }
    }
    load();
  }, [slug]);

  const handleContinueToTone = () => {
    if (rating === 0) { toast.error('Please select a star rating first'); return; }
    goTo('tone');
  };

  const handleGenerateReviews = async () => {
    if (!business) return;
    setGenerating(true);
    goTo('reviews');
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: business.name, category: business.category, city: business.city, about: business.about || '', speciality: business.speciality || '', rating, tone }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const raw: Array<{ text: string } | string> = data.reviews || [];
      setReviews(raw.map((r) => (typeof r === 'string' ? r : r.text)).filter(Boolean));
    } catch {
      toast.error('Failed to generate reviews. Please try again.');
      goTo('tone');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAndRedirect = async () => {
    if (!selectedReview || !business) return;
    try {
      await copyToClipboard(selectedReview);
      setCopied(true);
      toast.success('Review copied! 🎉');
      logReviewClick({ businessId: business.id, rating, tone, reviewText: selectedReview, redirected: true, timestamp: new Date().toISOString() }).catch(() => {});
      setTimeout(() => { window.open(getGoogleReviewUrl(business.placeId), '_blank'); goTo('done'); }, 900);
    } catch {
      toast.error('Could not copy. Please try again.');
    }
  };

  // ── Not found ──
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-gray-400 mt-2 text-sm">This review page doesn&apos;t exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (!business) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progressPct = step === 'rating' ? 25 : step === 'tone' ? 50 : step === 'reviews' ? 75 : 100;
  const bc = business.brandColor;

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>

      {/* ── Top brand strip ── */}
      <div
        className="w-full flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${bc} 0%, ${bc}cc 100%)`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/20">
          <motion.div
            className="h-full bg-white/80 rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Business info */}
        <div className="flex items-center gap-4 px-5 py-5">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="flex-shrink-0"
          >
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-14 h-14 rounded-2xl object-cover"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
              >
                {getInitials(business.name)}
              </div>
            )}
          </motion.div>

          {/* Name + location */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-lg font-bold text-white leading-tight truncate">{business.name}</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-white/60 flex-shrink-0" />
              <p className="text-sm text-white/70 truncate">{business.category} · {business.city}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Step content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-5 py-6">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ── Step 1: Rating ── */}
            {step === 'rating' && (
              <motion.div
                key="rating"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="space-y-8"
              >
                <div className="text-center pt-2">
                  <h2 className="text-2xl font-bold text-gray-900">How was your visit?</h2>
                  <p className="text-gray-400 mt-2 text-sm">Tap a star to share your experience</p>
                </div>

                {/* Stars */}
                <div className="flex justify-center py-2">
                  <StarRating value={rating} onChange={setRating} size={52} color={bc} />
                </div>

                {/* Rating label */}
                <div className="h-16 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    {rating > 0 && (
                      <motion.div
                        key={rating}
                        initial={{ opacity: 0, scale: 0.6, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, y: -10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        className="text-center"
                      >
                        <div className="text-4xl mb-1">{ratingConfig[rating].emoji}</div>
                        <p className="text-base font-bold" style={{ color: bc }}>
                          {ratingConfig[rating].label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{ratingConfig[rating].desc}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA */}
                <motion.button
                  onClick={handleContinueToTone}
                  disabled={rating === 0}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-25"
                  style={{
                    background: rating > 0 ? `linear-gradient(135deg, ${bc}, ${bc}cc)` : '#e5e7eb',
                    boxShadow: rating > 0 ? `0 6px 24px ${bc}40` : 'none',
                    color: rating > 0 ? 'white' : '#9ca3af',
                  }}
                >
                  Continue
                  <ChevronRight size={18} />
                </motion.button>
              </motion.div>
            )}

            {/* ── Step 2: Tone ── */}
            {step === 'tone' && (
              <motion.div
                key="tone"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="space-y-5"
              >
                <div className="text-center pt-2">
                  {/* Stars recap */}
                  <div className="flex justify-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        style={{
                          color: i < rating ? bc : '#e5e7eb',
                          fill: i < rating ? bc : '#e5e7eb',
                        }}
                      />
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Style</h2>
                  <p className="text-gray-400 mt-1.5 text-sm">How would you like your review to sound?</p>
                </div>

                <ToneSelector value={tone} onChange={setTone} brandColor={bc} />

                <motion.button
                  onClick={handleGenerateReviews}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${bc}, ${bc}cc)`,
                    boxShadow: `0 6px 24px ${bc}40`,
                  }}
                >
                  <Sparkles size={18} />
                  Generate My Reviews
                </motion.button>

                <button
                  onClick={() => goTo('rating')}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 py-2 active:text-gray-600 transition-colors"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              </motion.div>
            )}

            {/* ── Step 3: Reviews ── */}
            {step === 'reviews' && (
              <motion.div
                key="reviews"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="space-y-4"
              >
                <div className="text-center pt-2">
                  <h2 className="text-2xl font-bold text-gray-900">Pick Your Review</h2>
                  <p className="text-gray-400 mt-1.5 text-sm">Select one, then tap the button below</p>
                </div>

                {/* Loading skeletons */}
                {generating ? (
                  <div className="space-y-3 pt-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-2xl overflow-hidden" style={{ height: 72 }}>
                        <motion.div
                          className="w-full h-full"
                          style={{ background: 'linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)', backgroundSize: '200% 100%' }}
                          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                        />
                      </div>
                    ))}
                    <p className="text-center text-xs text-gray-400 pt-1 flex items-center justify-center gap-1.5">
                      <Sparkles size={11} className="text-violet-400" />
                      Writing personalised reviews for you…
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review, i) => (
                      <ReviewCard
                        key={i}
                        text={review}
                        selected={selectedReview === review}
                        onSelect={() => setSelectedReview(review)}
                        index={i}
                        brandColor={bc}
                      />
                    ))}
                  </div>
                )}

                {!generating && (
                  <>
                    {/* Main CTA */}
                    <motion.button
                      onClick={handleCopyAndRedirect}
                      disabled={!selectedReview}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-25 mt-2"
                      style={{
                        background: selectedReview ? `linear-gradient(135deg, ${bc}, ${bc}cc)` : '#e5e7eb',
                        boxShadow: selectedReview ? `0 6px 24px ${bc}40` : 'none',
                        color: selectedReview ? 'white' : '#9ca3af',
                      }}
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      {copied ? 'Copied! Opening Google…' : 'Copy & Post on Google'}
                      {!copied && <ExternalLink size={15} />}
                    </motion.button>

                    {/* Regenerate */}
                    <button
                      onClick={() => { setReviews([]); setSelectedReview(null); handleGenerateReviews(); }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 py-2 active:text-gray-600 transition-colors"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <RefreshCw size={12} />
                      Try different options
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Step 4: Done ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="text-center space-y-6 pt-4"
              >
                {/* Confetti emoji */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                  className="text-7xl"
                >
                  🎉
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                    Your review has been copied. Open Google, paste it, and hit submit — it takes 5 seconds!
                  </p>
                </div>

                {/* Review preview */}
                <div
                  className="rounded-2xl p-4 text-left mx-auto"
                  style={{ backgroundColor: `${bc}08`, border: `1px solid ${bc}20` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: bc }}>
                    Your review
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    &ldquo;{selectedReview}&rdquo;
                  </p>
                </div>

                {/* Open Google button */}
                <a
                  href={getGoogleReviewUrl(business.placeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${bc}, ${bc}cc)`,
                      boxShadow: `0 6px 24px ${bc}40`,
                    }}
                  >
                    <ExternalLink size={18} />
                    Open Google Reviews
                  </motion.button>
                </a>

                <p className="text-xs text-gray-400">
                  Just paste the review and tap Submit on Google
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-1.5 py-3 border-t border-gray-100"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        <Sparkles size={10} className="text-violet-400" />
        <span className="text-xs text-gray-400">Powered by</span>
        <span className="text-xs font-semibold text-violet-500">ReviewKaro</span>
      </div>
    </div>
  );
}
