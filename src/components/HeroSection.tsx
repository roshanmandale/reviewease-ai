'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Sparkles, Zap } from 'lucide-react';

// ─── Fade-up animation variant ───────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
  }),
};

// ─── Floating review card ─────────────────────────────────────────────────────
function FloatingCard({
  text,
  stars,
  name,
  delay,
  className,
}: {
  text: string;
  stars: number;
  name: string;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute backdrop-blur-md bg-white/8 border border-white/10 rounded-2xl p-4 shadow-2xl max-w-[220px] ${className}`}
    >
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-white/90 text-xs leading-relaxed">{text}</p>
      <p className="text-white/40 text-xs mt-2 font-medium">{name}</p>
    </motion.div>
  );
}

// ─── Main HeroSection ─────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black">

      {/* ── Background gradients ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f172a] to-black" />

      {/* Top glow */}
      <div
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] opacity-70 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(39,243,169,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Bottom-right glow */}
      <div
        className="absolute bottom-[-200px] right-1/3 w-[500px] h-[500px] opacity-60 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,200,255,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Floating review cards (decorative) ── */}
      <FloatingCard
        text="The biryani here is unreal 😍 Best in the city, no doubt!"
        stars={5}
        name="Priya S."
        delay={0.8}
        className="hidden lg:block top-[22%] left-[6%]"
      />
      <FloatingCard
        text="Yaar service ekdum mast thi! Staff super friendly. 5 stars easily!"
        stars={5}
        name="Rahul M."
        delay={1.0}
        className="hidden lg:block bottom-[28%] left-[4%]"
      />
      <FloatingCard
        text="Exceptional ambience and prompt service. Highly professional team."
        stars={5}
        name="Anita K."
        delay={0.9}
        className="hidden lg:block top-[20%] right-[5%]"
      />
      <FloatingCard
        text="बहुत अच्छा अनुभव रहा। खाना लाजवाब था! ⭐"
        stars={5}
        name="Suresh P."
        delay={1.1}
        className="hidden lg:block bottom-[26%] right-[4%]"
      />

      {/* ── Content container ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">

        {/* Glass card wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl px-8 py-12 sm:px-14 sm:py-16 shadow-2xl"
        >
          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 bg-[rgba(39,243,169,0.08)] border border-[rgba(39,243,169,0.2)] rounded-full px-4 py-1.5 mb-8"
          >
            <Zap size={13} className="text-[#27f3a9]" />
            <span className="text-sm text-[#27f3a9] font-medium">AI-Powered Review Generation</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={0.1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="leading-[1.1] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 6rem)', fontWeight: 300 }}
          >
            {/* Line 1 */}
            <span
              className="block"
              style={{
                background: 'linear-gradient(90deg, #666 0%, #d0d0d0 50%, #666 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Turn happy customers
            </span>

            {/* Line 2 */}
            <span
              className="block"
              style={{
                background: 'linear-gradient(90deg, #666 0%, #d0d0d0 50%, #666 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              into Google reviews
            </span>

            {/* Line 3 — "is human + AI" */}
            <span className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              <span className="text-white/40" style={{ fontSize: 'clamp(1.4rem, 4vw, 3.5rem)' }}>
                is
              </span>
              <span className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-1">
                <span className="text-2xl">👤</span>
                <span
                  className="font-light"
                  style={{
                    fontSize: 'clamp(1.4rem, 4vw, 3.5rem)',
                    background: 'linear-gradient(90deg, #27f3a9, #00c8ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  human
                </span>
              </span>
              <span className="text-white/30" style={{ fontSize: 'clamp(1.4rem, 4vw, 3.5rem)' }}>
                +
              </span>
              <span className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-1">
                <Sparkles size={20} className="text-violet-400" />
                <span
                  className="font-light"
                  style={{
                    fontSize: 'clamp(1.4rem, 4vw, 3.5rem)',
                    background: 'linear-gradient(90deg, #a78bfa, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AI
                </span>
              </span>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            custom={0.25}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-6 max-w-xl mx-auto text-center px-2"
            style={{
              fontSize: 'clamp(0.95rem, 2.2vw, 1.2rem)',
              color: '#ccc',
              lineHeight: 1.6,
            }}
          >
            We help businesses turn real customer experiences into high-quality Google reviews
            in seconds — with one QR scan.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            custom={0.35}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <motion.button
                whileHover={{
                  scale: 1.03,
                  boxShadow: '0px 6px 32px 8px rgba(39,243,169,0.22)',
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 font-semibold text-white group"
                style={{
                  padding: '12px 28px',
                  background: '#000',
                  boxShadow: '0px 6px 24px 6px rgba(39,243,169,0.15)',
                  borderRadius: '8px',
                  outline: '1px solid #30463C',
                  fontSize: '1rem',
                }}
              >
                Start Getting Reviews
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </motion.button>
            </Link>

            <Link href="/pricing">
              <button
                className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
              >
                View pricing →
              </button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            custom={0.45}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/30"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[#27f3a9]">✓</span> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#27f3a9]">✓</span> Setup in 2 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#27f3a9]">✓</span> Works on any device
            </span>
          </motion.div>
        </motion.div>

        {/* Stats row below card */}
        <motion.div
          custom={0.55}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-16"
        >
          {[
            { value: '10x', label: 'More reviews' },
            { value: '5 sec', label: 'Per review' },
            { value: '4.9★', label: 'Avg rating boost' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="font-bold"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                  background: 'linear-gradient(90deg, #27f3a9, #00c8ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </p>
              <p className="text-white/40 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
