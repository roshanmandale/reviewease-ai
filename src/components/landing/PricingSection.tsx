'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { PRICING_PLANS } from '@/data/mock';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-violet-600 uppercase tracking-wider"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-4xl font-extrabold text-gray-900"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-500 max-w-xl mx-auto"
          >
            Start free. Upgrade when you need more. Cancel anytime.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'relative rounded-2xl p-7 flex flex-col',
                plan.highlighted
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-2xl shadow-violet-500/30 scale-105'
                  : 'bg-white border border-gray-200 shadow-sm'
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap size={10} /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={cn('font-bold text-lg', plan.highlighted ? 'text-white' : 'text-gray-900')}>
                  {plan.name}
                </h3>
                <p className={cn('text-sm mt-1', plan.highlighted ? 'text-violet-200' : 'text-gray-500')}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className={cn('text-4xl font-extrabold', plan.highlighted ? 'text-white' : 'text-gray-900')}>
                    {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && (
                    <span className={cn('text-sm mb-1', plan.highlighted ? 'text-violet-200' : 'text-gray-500')}>
                      /mo
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        plan.highlighted ? 'bg-white/20' : 'bg-violet-100'
                      )}
                    >
                      <Check size={10} className={plan.highlighted ? 'text-white' : 'text-violet-600'} />
                    </div>
                    <span className={cn('text-sm', plan.highlighted ? 'text-violet-100' : 'text-gray-600')}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <Button
                  variant={plan.highlighted ? 'secondary' : 'primary'}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
