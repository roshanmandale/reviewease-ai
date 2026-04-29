'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BusinessForm } from '@/components/business/BusinessForm';
import { getBusinessById, updateBusiness } from '@/services/businessService';
import { Business } from '@/types';
import toast from 'react-hot-toast';

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load existing business data
  useEffect(() => {
    if (!id) return;
    setFetching(true);
    getBusinessById(id)
      .then((biz) => {
        if (!biz) {
          setNotFound(true);
          return;
        }
        // Security: only owner can edit
        if (user && biz.ownerUid !== user.uid) {
          setNotFound(true);
          return;
        }
        setBusiness(biz);
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [id, user]);

  const handleSubmit = async (data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true);
    try {
      await updateBusiness(id, {
        name: data.name,
        slug: data.slug,
        category: data.category,
        placeId: data.placeId,
        phone: data.phone,
        city: data.city,
        address: data.address,
        brandColor: data.brandColor,
        logoUrl: data.logoUrl,
        active: data.active,
      });
      toast.success('Business updated successfully! ✅');
      router.push('/dashboard/businesses');
    } catch (err) {
      console.error('Update business error:', err);
      toast.error('Failed to update business. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Not found / unauthorized
  if (notFound || !business) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900">Business not found</h1>
        <p className="text-gray-500 mt-2 text-sm">
          This business doesn&apos;t exist or you don&apos;t have permission to edit it.
        </p>
        <Link
          href="/dashboard/businesses"
          className="mt-6 inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium text-sm"
        >
          <ArrowLeft size={16} /> Back to Businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/businesses">
          <button className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div className="flex items-center gap-3">
          {/* Business color avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: business.brandColor }}
          >
            {business.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Business</h1>
            <p className="text-gray-500 text-sm mt-0.5">{business.name}</p>
          </div>
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
          <p className="text-sm font-medium text-violet-900">Updating Place ID?</p>
          <p className="text-xs text-violet-700 mt-0.5">
            Make sure it starts with <span className="font-mono font-bold">ChIJ</span> — not a Google Maps URL.
            Get it from{' '}
            <a
              href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Place ID Finder ↗
            </a>
          </p>
        </div>
      </motion.div>

      {/* Form pre-filled with existing data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
      >
        <BusinessForm
          initial={business}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </motion.div>
    </div>
  );
}
