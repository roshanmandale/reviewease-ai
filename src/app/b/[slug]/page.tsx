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
  { label: '', emoji: '' },
  { label: 'Poor', emoji: '😞' },
  { label: 'Fair', emoji: '😐' },
  { label: 'Good', emoji: '🙂' },
  { label: 'Great', emoji: '😄' },
  { label: 'Amazing!', emoji: '🤩' },
];

// Page-level slide animation
const pageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
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
        logScan({
          businessId: biz.id,
          slug: biz.slug,
          deviceType: getDeviceType(ua),
          userAgent: ua,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
      } catch {
        setNotFound(true);
      }
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
      toast.success('Review copied! Paste it on Google. 🎉');
      logReviewClick({
        businessId: business.id,
        rating,
        tone,
        reviewText: selectedReview,
        redirected: true,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
      setTimeout(() => {
        window.open(getGoogleReviewUrl(business.placeId), '_blank');
        goTo('done');
      }, 1000);
    } catch {
      toast.error('Could not copy. Please try again.');
    }
  };

  // ── Not found ──
  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-5">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-gray-400 mt-2 text-sm">This review page doesn&apos;t exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progressPct = step === 'rating' ? 20 : step === 'tone' ? 50 : step === 'reviews' ? 80 : 100;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Very subtle top tint */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${business.brandColor}08 0%, transparent 100%)` }}
      />

      <div className="w-full max-w-sm relative z-10">

        {/* ── Business header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-7"
        >
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-2xl"
                  style={{ boxShadow: `0 8px 32px ${business.brandColor}40` }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}bb)`,
                    boxShadow: `0 8px 32px ${business.brandColor}40`,
                  }}
                >
                  {getInitials(business.name)}
                </div>
              )}
            </motion.div>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-gray-900"
          >
            {business.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-gray-400 mt-1"
          >
            {business.category} · {business.city}
          </motion.p>
        </motion.div>

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 24 }}
          className="bg-white rounded-3xl overflow-hidden border border-gray-100"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${business.brandColor}, ${business.brandColor}bb)` }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            />
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait" custom={direction}>

              {/* ── Step 1: Rating ── */}
              {step === 'rating' && (
                <motion.div
                  key="rating"
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="space-y-7"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">How was your experience?</h2>
                    <p className="text-sm text-gray-400 mt-1.5">Tap a star to rate your visit</p>
                  </div>

                  <div className="flex justify-center">
                    <StarRating value={rating} onChange={setRating} size={46} color={business.brandColor} />
                  </div>

                  <AnimatePresence>
                    {rating > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="text-center"
                      >
                        <span className="text-3xl">{ratingConfig[rating].emoji}</span>
                        <p
                          className="text-base font-semibold mt-1"
                          style={{ color: business.brandColor }}
                        >
                          {ratingConfig[rating].label}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={handleContinueToTone}
                    disabled={rating === 0}
                    whileTap={{ scale: 0.97 }}
                    whileHover={rating > 0 ? { scale: 1.02 } : {}}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: rating > 0
                        ? `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}cc)`
                        : 'rgba(255,255,255,0.1)',
                      boxShadow: rating > 0 ? `0 4px 20px ${business.brandColor}40` : 'none',
                    }}
                  >
                    Continue
                    <ChevronRight size={17} />
                  </motion.button>
                </motion.div>
              )}

              {/* ── Step 2: Tone ── */}
              {step === 'tone' && (
                <motion.div
                  key="tone"
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <div className="flex justify-center gap-1 mb-3">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} size={16} style={{ color: business.brandColor, fill: business.brandColor }} />
                      ))}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Choose Your Review Style</h2>
                    <p className="text-sm text-gray-400 mt-1.5">
                      Select the tone that best matches how you feel
                    </p>
                  </div>

                  <ToneSelector value={tone} onChange={setTone} brandColor={business.brandColor} />

                  <motion.button
                    onClick={handleGenerateReviews}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}cc)`,
                      boxShadow: `0 4px 20px ${business.brandColor}40`,
                    }}
                  >
                    <Sparkles size={16} />
                    Generate My Reviews
                  </motion.button>

                  <button
                    onClick={() => goTo('rating')}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                </motion.div>
              )}

              {/* ── Step 3: Reviews ── */}
              {step === 'reviews' && (
                <motion.div
                  key="reviews"
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Pick Your Review</h2>
                    <p className="text-sm text-gray-400 mt-1.5">
                      Select one, copy it, and paste it on Google
                    </p>
                  </div>

                  {generating ? (
                    <div className="space-y-3 py-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                          className="h-16 rounded-2xl bg-gray-100"
                        />
                      ))}
                      <p className="text-center text-xs text-gray-400 pt-1">
                        Crafting personalised reviews…
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {reviews.map((review, i) => (
                        <ReviewCard
                          key={i}
                          text={review}
                          selected={selectedReview === review}
                          onSelect={() => setSelectedReview(review)}
                          index={i}
                          brandColor={business.brandColor}
                        />
                      ))}
                    </div>
                  )}

                  {!generating && (
                    <>
                      <motion.button
                        onClick={handleCopyAndRedirect}
                        disabled={!selectedReview}
                        whileTap={{ scale: 0.97 }}
                        whileHover={selectedReview ? { scale: 1.02 } : {}}
                        className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30"
                        style={{
                          background: selectedReview
                            ? `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}cc)`
                            : 'rgba(255,255,255,0.1)',
                          boxShadow: selectedReview ? `0 4px 20px ${business.brandColor}40` : 'none',
                        }}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy & Post on Google'}
                        {!copied && <ExternalLink size={14} />}
                      </motion.button>

                      <button
                        onClick={() => { setReviews([]); setSelectedReview(null); handleGenerateReviews(); }}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                      >
                        <RefreshCw size={12} />
                        Generate different options
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Step 4: Done ── */}
              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="text-center space-y-5 py-3"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 }}
                    className="text-6xl"
                  >
                    🎉
                  </motion.div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Thank You!</h2>
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                      Your review has been copied to your clipboard. Open Google and paste it to complete your review.
                    </p>
                  </div>

                  <div
                    className="rounded-2xl p-4 text-left bg-gray-50 border border-gray-100"
                  >
                    <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Your review</p>
                    <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{selectedReview}&rdquo;</p>
                  </div>

                  <a href={getGoogleReviewUrl(business.placeId)} target="_blank" rel="noopener noreferrer">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}cc)`,
                        boxShadow: `0 4px 20px ${business.brandColor}40`,
                      }}
                    >
                      <ExternalLink size={16} />
                      Open Google Reviews
                    </motion.button>
                  </a>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        {/* Powered by */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-400 mt-5 flex items-center justify-center gap-1.5"
        >
          Powered by
          <Sparkles size={10} className="text-violet-500" />
          <span className="text-violet-500 font-medium">ReviewKaro</span>
        </motion.p>
      </div>
    </div>
  );
}
