'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Sparkles, Zap, Shield, Clock } from 'lucide-react';

// ─── Review card shown below hero ────────────────────────────────────────────
function ReviewPill({
  text,
  name,
  stars,
  delay,
}: {
  text: string;
  name: string;
  stars: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left min-w-[220px] max-w-[260px]"
    >
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-white/80 text-xs leading-relaxed">{text}</p>
      <p className="text-white/30 text-xs mt-2">{name}</p>
    </motion.div>
  );
}

// ─── Main HeroSection ─────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-[#050510]">

      {/* ── Background ── */}
      {/* Top center glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.35) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)',
        }}
      />
      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(39,243,169,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center pt-28 pb-16">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border"
          style={{
            background: 'rgba(124,58,237,0.12)',
            borderColor: 'rgba(124,58,237,0.35)',
          }}
        >
          <Zap size={13} className="text-violet-400" />
          <span className="text-sm text-violet-300 font-medium tracking-wide">
            AI-Powered Review Generation
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
          className="font-bold text-white leading-[1.08] tracking-tight"
          style={{ fontSize: 'clamp(2.6rem, 6.5vw, 5.5rem)' }}
        >
          Turn Happy Customers Into{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Google Reviews
          </span>
          <br />
          in Seconds
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          QR-powered AI review generation for local businesses. One scan, one tap,
          one 5-star review — in under 5 seconds.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white text-base group"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
              }}
            >
              Sign In to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6"
        >
          {[
            { icon: Shield, text: 'Admin-managed accounts' },
            { icon: Clock, text: 'Setup in 2 minutes' },
            { icon: Sparkles, text: 'AI-powered reviews' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-sm text-white/35">
              <Icon size={13} className="text-violet-400" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 w-full grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { value: '10x', label: 'More reviews' },
            { value: '5 sec', label: 'Per review' },
            { value: '4.9★', label: 'Avg rating boost' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center py-5 rounded-2xl border border-white/8"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span
                className="font-bold text-2xl sm:text-3xl"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </span>
              <span className="text-xs text-white/35 mt-1">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Review pills ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 w-full"
        >
          <p className="text-xs text-white/25 mb-4 uppercase tracking-widest">
            Real reviews generated by customers
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 justify-start sm:justify-center scrollbar-hide">
            {[
              { text: 'The biryani here is unreal 😍 Best in the city, no doubt!', name: 'Priya S.', stars: 5, delay: 0.65 },
              { text: 'Yaar service ekdum mast thi! Staff super friendly. 5 stars easily!', name: 'Rahul M.', stars: 5, delay: 0.7 },
              { text: 'Exceptional ambience and prompt service. Highly professional team.', name: 'Anita K.', stars: 5, delay: 0.75 },
              { text: 'बहुत अच्छा अनुभव रहा। खाना लाजवाब था! ⭐', name: 'Suresh P.', stars: 5, delay: 0.8 },
              { text: 'Loved the vibe! Quick service and amazing food. Coming back soon 🙌', name: 'Meera T.', stars: 5, delay: 0.85 },
            ].map((r) => (
              <ReviewPill key={r.name} {...r} />
            ))}
          </div>
        </motion.div>

        {/* ── How it works — 3 steps ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-16 w-full grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              step: '01',
              emoji: '📱',
              title: 'Customer Scans QR',
              desc: 'Place the QR code at your counter. Customer scans with their phone.',
            },
            {
              step: '02',
              emoji: '✨',
              title: 'AI Writes the Review',
              desc: 'Customer picks a star rating and tone. AI generates 3 ready-made reviews.',
            },
            {
              step: '03',
              emoji: '🌟',
              title: 'Posted on Google',
              desc: 'One tap copies the review and opens Google. Customer pastes and submits.',
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="relative rounded-2xl p-6 text-left border border-white/8 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="absolute top-4 right-4 text-4xl font-black text-white/5 select-none">
                {item.step}
              </div>
              <div className="text-3xl mb-4">{item.emoji}</div>
              <h3 className="font-semibold text-white text-sm mb-1.5">{item.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
