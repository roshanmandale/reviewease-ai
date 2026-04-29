'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useBusinesses } from '@/hooks/useBusinesses';
import { BusinessForm } from '@/components/business/BusinessForm';
import { Business } from '@/types';
import toast from 'react-hot-toast';

export default function NewBusinessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addBusiness } = useBusinesses(user?.uid);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const biz = await addBusiness(data);
      toast.success(`"${biz.name}" created successfully! 🎉`);
      router.push('/dashboard/businesses');
    } catch (err) {
      console.error('Create business error:', err);
      toast.error('Failed to create business. Please try again.');
    } finally {
      setLoading(false);
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
            Fill in the details to generate your review QR code
          </p>
        </div>
      </div>

      {/* Info banner */}
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

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
      >
        <BusinessForm onSubmit={handleSubmit} loading={loading} />
      </motion.div>
    </div>
  );
}
