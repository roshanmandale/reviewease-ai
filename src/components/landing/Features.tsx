'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  Sparkles,
  BarChart3,
  Globe,
  Palette,
  Zap,
  Shield,
  Smartphone,
} from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Smart QR Codes',
    description: 'Generate branded QR codes for each business location. Print and place anywhere.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Sparkles,
    title: 'AI Review Generator',
    description: 'Generates 3 unique, natural reviews per request. Professional, Friendly, Hindi, Hinglish, Short.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track QR scans, review clicks, conversion rates, and top-performing locations.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Globe,
    title: 'Direct Google Redirect',
    description: 'One-click redirect to your exact Google review page using Place ID. Zero friction.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    description: 'Add your logo, brand colors, and business details for a fully branded experience.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Optimized for mobile. Customers scan and review without pinching or zooming.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Add your business, get your QR code, and start collecting reviews in under 2 minutes.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Shield,
    title: 'Google Policy Safe',
    description: 'Customers write and submit their own reviews. We just make it easier. 100% compliant.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-violet-600 uppercase tracking-wider"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-4xl font-extrabold text-gray-900"
          >
            Everything you need to get more reviews
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
          >
            Built specifically for local businesses in India. No tech knowledge required.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon size={20} className={feature.color} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
