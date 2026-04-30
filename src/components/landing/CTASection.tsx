'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8"
        >
          <Sparkles size={14} className="text-white" />
          <span className="text-sm text-white font-medium">Start collecting reviews today</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-extrabold text-white leading-tight"
        >
          Ready to grow your Google rating?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-xl text-violet-200 max-w-2xl mx-auto"
        >
          Contact us to get your business set up on ReviewEase AI and start turning
          happy customers into 5-star Google reviews.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/login">
            <Button
              size="lg"
              className="bg-white text-violet-700 hover:bg-gray-50 shadow-xl group border-0"
            >
              Sign In to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-sm text-violet-300"
        >
          Accounts are managed by admin · Contact us to get started
        </motion.p>
      </div>
    </section>
  );
}
