'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Star, Sparkles, ExternalLink } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: QrCode,
    title: 'Place QR Code',
    description:
      'Add your business, get a unique QR code, and place it at your counter, table, or anywhere customers can see it.',
    color: 'from-violet-500 to-indigo-500',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    step: '02',
    icon: Star,
    title: 'Customer Scans & Rates',
    description:
      'Customer scans the QR code, lands on your branded review page, and selects their star rating and preferred review style.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'AI Generates Reviews',
    description:
      'Our AI instantly generates 3 genuine, natural-sounding review options in the chosen style — Professional, Friendly, Hindi, or Hinglish.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    step: '04',
    icon: ExternalLink,
    title: 'One Click to Google',
    description:
      'Customer selects a review, it copies to clipboard, and they are redirected directly to your Google review page to paste and submit.',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-violet-600 uppercase tracking-wider"
          >
            How it Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-4xl font-extrabold text-gray-900"
          >
            From scan to review in 5 seconds
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
          >
            We removed every friction point that stops customers from leaving reviews.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
              )}

              <div className="relative z-10 flex flex-col items-start">
                <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mb-5`}>
                  <step.icon size={24} className={step.iconColor} />
                </div>
                <span className="text-xs font-bold text-gray-300 mb-2">{step.step}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
