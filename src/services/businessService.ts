import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Business } from '@/types';

const COLLECTION = 'businesses';

/** Convert Firestore doc data → Business, handling Timestamp fields */
function docToBusiness(id: string, data: Record<string, unknown>): Business {
  return {
    id,
    ownerUid: data.ownerUid as string,
    name: data.name as string,
    slug: data.slug as string,
    category: data.category as Business['category'],
    placeId: data.placeId as string,
    phone: (data.phone as string) || '',
    city: (data.city as string) || '',
    address: (data.address as string) || '',
    about: (data.about as string) || '',
    speciality: (data.speciality as string) || '',
    logoUrl: (data.logoUrl as string) || '',
    brandColor: (data.brandColor as string) || '#6366f1',
    active: Boolean(data.active),
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string) || new Date().toISOString(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string) || new Date().toISOString(),
  };
}

/**
 * Fetch all businesses owned by a specific user.
 * Uses only a single-field where() so no composite index is required.
 * Results are sorted client-side by createdAt descending.
 */
export async function getBusinessesByOwner(ownerUid: string): Promise<Business[]> {
  const q = query(
    collection(db, COLLECTION),
    where('ownerUid', '==', ownerUid)
  );
  const snap = await getDocs(q);
  const businesses = snap.docs.map((d) =>
    docToBusiness(d.id, d.data() as Record<string, unknown>)
  );
  // Sort newest first client-side — no composite index needed
  return businesses.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Fetch a single business by its slug (used on the public /b/[slug] page).
 * Single-field where() — no index required.
 */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const q = query(
    collection(db, COLLECTION),
    where('slug', '==', slug)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const biz = docToBusiness(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);
  // Respect active flag client-side
  return biz.active ? biz : null;
}

/**
 * Fetch a single business by its Firestore document ID.
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return docToBusiness(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Create a new business document.
 * Firestore auto-creates the collection on first write.
 */
export async function createBusiness(
  data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Business> {
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return {
    ...data,
    id: ref.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update specific fields of an existing business document.
 */
export async function updateBusiness(
  id: string,
  updates: Partial<Omit<Business, 'id' | 'ownerUid' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a business document by ID.
 */
export async function deleteBusiness(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
