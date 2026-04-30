'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, Copy, Check, Star, RefreshCw, ChevronRight } from 'lucide-react';
import { Business, ReviewTone } from '@/types';
import { getBusinessBySlug } from '@/services/businessService';
import { logScan, logReviewClick } from '@/services/logService';
import { StarRating } from '@/components/review/StarRating';
import { ToneSelector } from '@/components/review/ToneSelector';
import { ReviewCard } from '@/components/review/ReviewCard';
import { Button } from '@/components/ui/Button';
import { getGoogleReviewUrl, copyToClipboard, getInitials, getDeviceType } from '@/lib/utils';
import toast from 'react-hot-toast';

type Step = 'rating' | 'tone' | 'reviews' | 'done';

export default function ReviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>('rating');
  const [rating, setRating] = useState(0);
  const [tone, setTone] = useState<ReviewTone>('Friendly');
  const [reviews, setReviews] = useState<string[]>([]);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch business from Firestore and log the scan
  useEffect(() => {
    if (!slug) return;

    async function load() {
      try {
        const biz = await getBusinessBySlug(slug);
        if (!biz) {
          setNotFound(true);
          return;
        }
        setBusiness(biz);

        // Auto-create scan_logs document — fires and forgets
        const ua = navigator.userAgent;
        logScan({
          businessId: biz.id,
          slug: biz.slug,
          deviceType: getDeviceType(ua),
          userAgent: ua,
          timestamp: new Date().toISOString(),
        }).catch((err) => console.error('logScan failed:', err));
      } catch (err) {
        console.error('Failed to load business:', err);
        setNotFound(true);
      }
    }

    load();
  }, [slug]);

  const handleContinueToTone = () => {
    if (rating === 0) {
      toast.error('Please select a star rating first');
      return;
    }
    setStep('tone');
  };

  const handleGenerateReviews = async () => {
    if (!business) return;
    setGenerating(true);
    setStep('reviews');
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
      // API returns [{ text: "..." }, ...] — extract text strings
      const raw: Array<{ text: string } | string> = data.reviews || [];
      setReviews(
        raw.map((r) => (typeof r === 'string' ? r : r.text)).filter(Boolean)
      );
    } catch {
      toast.error('Failed to generate reviews. Please try again.');
      setStep('tone');
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

      // Auto-create review_clicks document in Firestore
      logReviewClick({
        businessId: business.id,
        rating,
        tone,
        reviewText: selectedReview,
        redirected: true,
        timestamp: new Date().toISOString(),
      }).catch((err) => console.error('logReviewClick failed:', err));

      setTimeout(() => {
        window.open(getGoogleReviewUrl(business.placeId), '_blank');
        setStep('done');
      }, 1200);
    } catch {
      toast.error('Could not copy. Please copy manually.');
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing!'];

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900">Business not found</h1>
          <p className="text-gray-500 mt-2">This review page doesn&apos;t exist or is inactive.</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Business Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex justify-center mb-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: business.brandColor }}
              >
                {getInitials(business.name)}
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {business.category} · {business.city}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-1" style={{ backgroundColor: business.brandColor + '20' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: business.brandColor }}
              initial={{ width: '0%' }}
              animate={{
                width:
                  step === 'rating'
                    ? '25%'
                    : step === 'tone'
                    ? '50%'
                    : step === 'reviews'
                    ? '75%'
                    : '100%',
              }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Rating */}
              {step === 'rating' && (
                <motion.div
                  key="rating"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">How was your experience?</h2>
                    <p className="text-sm text-gray-500 mt-1">Tap a star to rate</p>
                  </div>
                  <div className="flex justify-center">
                    <StarRating value={rating} onChange={setRating} size={44} />
                  </div>
                  {rating > 0 && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center text-lg font-semibold"
                      style={{ color: business.brandColor }}
                    >
                      {ratingLabels[rating]}
                    </motion.p>
                  )}
                  <Button
                    onClick={handleContinueToTone}
                    className="w-full"
                    style={
                      rating > 0
                        ? {
                            background: `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}dd)`,
                          }
                        : {}
                    }
                    disabled={rating === 0}
                  >
                    Continue
                    <ChevronRight size={16} />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Tone */}
              {step === 'tone' && (
                <motion.div
                  key="tone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="flex justify-center gap-1 mb-3">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Choose review style</h2>
                    <p className="text-sm text-gray-500 mt-1">Pick the tone that feels right</p>
                  </div>
                  <ToneSelector value={tone} onChange={setTone} />
                  <Button
                    onClick={handleGenerateReviews}
                    className="w-full"
                    style={{
                      background: `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}dd)`,
                    }}
                  >
                    <Sparkles size={16} />
                    Generate Reviews
                  </Button>
                  <button
                    onClick={() => setStep('rating')}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                </motion.div>
              )}

              {/* Step 3: Reviews */}
              {step === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Pick your review</h2>
                    <p className="text-sm text-gray-500 mt-1">Select one to copy and post</p>
                  </div>

                  {generating ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                      ))}
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
                        />
                      ))}
                    </div>
                  )}

                  {!generating && (
                    <>
                      <Button
                        onClick={handleCopyAndRedirect}
                        disabled={!selectedReview}
                        className="w-full"
                        style={
                          selectedReview
                            ? {
                                background: `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}dd)`,
                              }
                            : {}
                        }
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy & Review on Google'}
                        <ExternalLink size={14} />
                      </Button>
                      <button
                        onClick={() => {
                          setReviews([]);
                          handleGenerateReviews();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <RefreshCw size={13} />
                        Generate new options
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 4: Done */}
              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="text-6xl"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-xl font-bold text-gray-900">Thank you!</h2>
                  <p className="text-sm text-gray-500">
                    Your review has been copied. Paste it on Google and hit submit!
                  </p>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 text-left">
                    <p className="font-medium text-gray-700 mb-1">Your review:</p>
                    <p className="italic">&ldquo;{selectedReview}&rdquo;</p>
                  </div>
                  <a
                    href={getGoogleReviewUrl(business.placeId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      className="w-full"
                      style={{
                        background: `linear-gradient(135deg, ${business.brandColor}, ${business.brandColor}dd)`,
                      }}
                    >
                      <ExternalLink size={16} />
                      Open Google Reviews
                    </Button>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Powered by */}
        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
          Powered by <Sparkles size={11} className="text-violet-400" />
          <span className="text-violet-500 font-medium">ReviewEase AI</span>
        </p>
      </div>
    </div>
  );
}
