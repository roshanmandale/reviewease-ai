'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Tag, Palette, Link as LinkIcon, Upload } from 'lucide-react';
import { Business, BusinessCategory } from '@/types';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { generateSlug } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const CATEGORIES: BusinessCategory[] = [
  'Restaurant', 'Cafe', 'Salon', 'Gym', 'Clinic', 'Dentist',
  'Hotel', 'Repair Shop', 'Makeup Artist', 'Bakery', 'Pharmacy',
  'Retail Store', 'Other',
];

const BRAND_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981',
  '#3b82f6', '#f59e0b', '#ef4444', '#14b8a6', '#84cc16',
];

interface BusinessFormProps {
  initial?: Partial<Business>;
  onSubmit: (data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  loading?: boolean;
}

export function BusinessForm({ initial, onSubmit, loading }: BusinessFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    category: initial?.category || 'Restaurant' as BusinessCategory,
    placeId: initial?.placeId || '',
    phone: initial?.phone || '',
    city: initial?.city || '',
    address: initial?.address || '',
    brandColor: initial?.brandColor || '#6366f1',
    logoUrl: initial?.logoUrl || '',
    active: initial?.active ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (!slugManual && form.name) {
      setForm((prev) => ({ ...prev, slug: generateSlug(form.name) }));
    }
  }, [form.name, slugManual]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Business name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    if (!form.city.trim()) e.city = 'City is required';

    // Place ID validation
    if (!form.placeId.trim()) {
      e.placeId = 'Google Place ID is required';
    } else if (form.placeId.trim().startsWith('http')) {
      e.placeId = 'This looks like a URL, not a Place ID. A Place ID looks like: ChIJN1t_tDeuEmsRUsoyG83frY4';
    } else if (form.placeId.trim().length < 10) {
      e.placeId = 'Place ID is too short. It should be a long alphanumeric string.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...form,
      ownerUid: user?.uid || '',
    });
  };

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 size={15} /> Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Business Name *"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="The Spice Garden"
            error={errors.name}
          />
          <div>
            <Input
              label="URL Slug *"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                set('slug', generateSlug(e.target.value));
              }}
              placeholder="the-spice-garden"
              hint={`Review URL: /b/${form.slug || 'your-slug'}`}
              error={errors.slug}
              leftIcon={<span className="text-xs">/b/</span>}
            />
          </div>
          <Select
            label="Category *"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Google Place ID *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <LinkIcon size={14} />
              </div>
              <input
                value={form.placeId}
                onChange={(e) => set('placeId', e.target.value)}
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 ${errors.placeId ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 hover:border-gray-300'}`}
              />
            </div>
            {errors.placeId ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.placeId}</p>
            ) : (
              <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">⚠️ Do NOT paste a Google Maps link here</p>
                <p>A Place ID looks like: <span className="font-mono bg-amber-100 px-1 rounded">ChIJN1t_tDeuEmsRUsoyG83frY4</span></p>
                <p>
                  Get yours →{' '}
                  <a
                    href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium text-amber-900"
                  >
                    Google Place ID Finder ↗
                  </a>
                  {' '}— search your business name and copy the ID shown.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact & Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin size={15} /> Location & Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 98765 43210"
            leftIcon={<Phone size={14} />}
          />
          <Input
            label="City *"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Mumbai"
            error={errors.city}
          />
          <div className="sm:col-span-2">
            <Input
              label="Full Address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="12, MG Road, Andheri West, Mumbai"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Palette size={15} /> Branding
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
            <div className="flex items-center gap-3 flex-wrap">
              {BRAND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set('brandColor', color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: form.brandColor === color ? '#1e1b4b' : 'transparent',
                    transform: form.brandColor === color ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => set('brandColor', e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border border-gray-200"
                title="Custom color"
              />
            </div>
          </div>
          <Input
            label="Logo URL (optional)"
            value={form.logoUrl}
            onChange={(e) => set('logoUrl', e.target.value)}
            placeholder="https://example.com/logo.png"
            leftIcon={<Upload size={14} />}
            hint="Paste a public image URL or upload to Firebase Storage"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-900 text-sm">Active Status</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Inactive businesses won&apos;t show the review page
          </p>
        </div>
        <Toggle checked={form.active} onChange={(v) => set('active', v)} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={loading} size="lg">
          {initial?.id ? 'Save Changes' : 'Create Business'}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
