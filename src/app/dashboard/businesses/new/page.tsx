'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useBusinesses } from '@/hooks/useBusinesses';
import { BusinessForm } from '@/components/business/BusinessForm';
import { Business } from '@/types';
import toast from 'react-hot-toast';

export default function NewBusinessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { businesses, loading: bizLoading, addBusiness } = useBusinesses(user?.uid);
  const [saving, setSaving] = useState(false);

  const limit = user?.businessLimit ?? 1;
  const atLimit = !bizLoading && businesses.length >= limit;

  const handleSubmit = async (data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Re-check limit before submitting
    if (businesses.length >= limit) {
      toast.error(`Business limit reached (${limit}). Upgrade your plan to add more.`);
      return;
    }
    setSaving(true);
    try {
      const biz = await addBusiness(data);
      toast.success(`"${biz.name}" created successfully! 🎉`);
      router.push('/dashboard/businesses');
    } catch (err) {
      console.error('Create business error:', err);
      toast.error('Failed to create business. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/businesses">
          <button className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Business</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {bizLoading ? 'Loading...' : `${businesses.length} / ${limit} businesses used`}
          </p>
        </div>
      </div>

      {/* Limit reached banner */}
      {atLimit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4"
        >
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800">Business limit reached</p>
            <p className="text-sm text-red-600 mt-1">
              You have used all {limit} business slot{limit !== 1 ? 's' : ''} on your{' '}
              <span className="font-semibold capitalize">{user?.plan}</span> plan.
              Contact your admin or upgrade your plan to add more businesses.
            </p>
            <Link href="/dashboard/settings">
              <button className="mt-3 text-sm font-semibold text-red-700 underline hover:text-red-900">
                View Billing & Plans →
              </button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Place ID info banner */}
      {!atLimit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-violet-900">How to find your Google Place ID</p>
            <p className="text-xs text-violet-700 mt-0.5">
              Go to{' '}
              <a
                href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google Place ID Finder
              </a>
              , search your business, and copy the Place ID shown below the map.
            </p>
          </div>
        </motion.div>
      )}

      {/* Form — disabled when at limit */}
      {!atLimit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
        >
          <BusinessForm onSubmit={handleSubmit} loading={saving} />
        </motion.div>
      )}
    </div>
  );
}
