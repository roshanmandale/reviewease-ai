import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

// Default business limit per plan
const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 10,
  agency: 999,
};

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = credential.user;
  await updateProfile(fbUser, { displayName: name });

  const newUser: User = {
    uid: fbUser.uid,
    name,
    email,
    plan: 'free',
    role: 'owner',
    businessLimit: PLAN_LIMITS['free'],
    disabled: false,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', fbUser.uid), {
    ...newUser,
    createdAt: serverTimestamp(),
  });

  return newUser;
}

export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(fbUser: FirebaseUser): Promise<User> {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    // Back-fill missing fields for existing accounts
    return {
      uid: fbUser.uid,
      name: data.name || fbUser.displayName || 'User',
      email: data.email || fbUser.email || '',
      plan: data.plan || 'free',
      role: data.role || 'owner',
      businessLimit: data.businessLimit ?? PLAN_LIMITS[data.plan || 'free'],
      disabled: data.disabled ?? false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
    } as User;
  }

  // Auto-create missing profile
  const fallback: User = {
    uid: fbUser.uid,
    name: fbUser.displayName || 'User',
    email: fbUser.email || '',
    plan: 'free',
    role: 'owner',
    businessLimit: PLAN_LIMITS['free'],
    disabled: false,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, { ...fallback, createdAt: serverTimestamp() });
  return fallback;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'plan'>>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), updates, { merge: true });
}

// ─── Admin-only functions ─────────────────────────────────────────────────────

/** Fetch all users — admin only */
export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name || '',
      email: data.email || '',
      plan: data.plan || 'free',
      role: data.role || 'owner',
      businessLimit: data.businessLimit ?? PLAN_LIMITS[data.plan || 'free'],
      disabled: data.disabled ?? false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
    } as User;
  });
}

/** Update a user's role, businessLimit, or disabled status — admin only */
export async function adminUpdateUser(
  uid: string,
  updates: Partial<Pick<User, 'role' | 'businessLimit' | 'disabled' | 'plan'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), updates);
}
