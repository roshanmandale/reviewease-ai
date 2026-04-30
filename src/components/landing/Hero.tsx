'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Star, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 pt-16">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-8"
        >
          <Zap size={14} className="text-violet-400" />
          <span className="text-sm text-violet-300 font-medium">AI-Powered Review Generation</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight"
        >
          Turn Happy Customers Into
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Google Reviews
          </span>{' '}
          in Seconds
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          QR-powered AI review generation for local businesses. One scan, one click, one 5-star review.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/register">
            <Button size="lg" className="group">
              Start Free Trial
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <button className="flex items-center gap-2.5 text-gray-300 hover:text-white transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Play size={14} className="text-white ml-0.5" />
            </div>
            <span className="text-sm font-medium">Watch Demo</span>
          </button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
        >
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-amber-400" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-violet-400" />
            <span>Setup in 2 minutes</span>
          </div>
        </motion.div>

        {/* Hero mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" style={{ top: '60%' }} />
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-2 shadow-2xl">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-md px-3 py-1 text-xs text-gray-500 text-center">
                    reviewkaro.app/b/the-spice-garden
                  </div>
                </div>
                {/* Mock review page */}
                <div className="p-8 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-2xl">
                    🍛
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold text-xl">The Spice Garden</h3>
                    <p className="text-gray-400 text-sm mt-1">How was your experience?</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={32} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                    {['Professional', 'Friendly', 'Hindi'].map((tone, i) => (
                      <div
                        key={tone}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-center ${
                          i === 0
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                      >
                        {tone}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    {[
                      'Amazing food and incredibly quick service. Highly recommend!',
                      'Loved the warm atmosphere and friendly staff. Will visit again!',
                    ].map((review, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-xs text-left ${
                          i === 0
                            ? 'bg-violet-600/20 border border-violet-500/30 text-violet-200'
                            : 'bg-white/5 border border-white/10 text-gray-400'
                        }`}
                      >
                        {review}
                      </div>
                    ))}
                  </div>
                  <div className="w-full max-w-sm bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl py-3 text-white text-sm font-semibold text-center">
                    Copy & Review on Google ↗
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
