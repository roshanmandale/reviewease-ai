'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Building2, Grid3X3, List, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useBusinesses } from '@/hooks/useBusinesses';
import { Business } from '@/types';
import { BusinessCard } from '@/components/business/BusinessCard';
import { QRModal } from '@/components/business/QRModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function BusinessesPage() {
  const { user } = useAuth();
  const { businesses, loading, error, refetch, deleteBusiness } = useBusinesses(user?.uid);

  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [qrBusiness, setQrBusiness] = useState<Business | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBusiness(deleteTarget);
      toast.success('Business deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete business. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading
              ? 'Loading...'
              : `${businesses.length} business${businesses.length !== 1 ? 'es' : ''} · ${
                  businesses.filter((b) => b.active).length
                } active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <Link href="/dashboard/businesses/new">
            <Button>
              <Plus size={16} />
              Add Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refetch} className="text-red-700 font-medium hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${
              view === 'grid'
                ? 'bg-white shadow-sm text-violet-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-colors ${
              view === 'list'
                ? 'bg-white shadow-sm text-violet-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className={`grid gap-5 ${
            view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Building2 size={48} className="text-gray-200 mx-auto mb-4" />
          {search ? (
            <>
              <p className="text-gray-600 font-medium">
                No businesses match &ldquo;{search}&rdquo;
              </p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </>
          ) : (
            <>
              <p className="text-gray-600 font-medium">No businesses yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Add your first business to generate a QR code
              </p>
              <Link href="/dashboard/businesses/new" className="mt-5 inline-block">
                <Button>
                  <Plus size={15} /> Add Your First Business
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className={`grid gap-5 ${
            view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {filtered.map((biz, i) => (
            <motion.div
              key={biz.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <BusinessCard
                business={biz}
                onViewQR={setQrBusiness}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* QR Modal */}
      <QRModal business={qrBusiness} open={!!qrBusiness} onClose={() => setQrBusiness(null)} />

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Business"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete this business? This will remove it from Firestore. QR
            codes pointing to it will show &ldquo;not found&rdquo;. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" loading={deleting} onClick={handleDelete} className="flex-1">
              Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
