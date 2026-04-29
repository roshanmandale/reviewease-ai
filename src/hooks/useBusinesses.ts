'use client';

import { useState, useEffect, useCallback } from 'react';
import { Business } from '@/types';
import {
  getBusinessesByOwner,
  createBusiness,
  updateBusiness as updateBusinessService,
  deleteBusiness as deleteBusinessService,
  getBusinessBySlug as getBusinessBySlugService,
} from '@/services/businessService';

export function useBusinesses(ownerUid?: string) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    if (!ownerUid) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getBusinessesByOwner(ownerUid);
      setBusinesses(data);
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
      setError('Failed to load businesses. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [ownerUid]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const addBusiness = async (
    data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Business> => {
    const newBusiness = await createBusiness(data);
    setBusinesses((prev) => [newBusiness, ...prev]);
    return newBusiness;
  };

  const updateBusiness = async (id: string, updates: Partial<Business>): Promise<void> => {
    await updateBusinessService(id, updates);
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      )
    );
  };

  const deleteBusiness = async (id: string): Promise<void> => {
    await deleteBusinessService(id);
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
  };

  const getBusinessBySlug = async (slug: string): Promise<Business | null> => {
    return getBusinessBySlugService(slug);
  };

  return {
    businesses,
    loading,
    error,
    refetch: fetchBusinesses,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    getBusinessBySlug,
  };
}
