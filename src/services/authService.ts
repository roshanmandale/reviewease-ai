import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

/**
 * Register a new user with Firebase Auth and create their Firestore profile.
 * The `users` collection and document are created automatically on first signup.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = credential.user;

  // Set display name on the Firebase Auth profile
  await updateProfile(fbUser, { displayName: name });

  const newUser: User = {
    uid: fbUser.uid,
    name,
    email,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };

  // Auto-create users/{uid} document in Firestore
  await setDoc(doc(db, 'users', fbUser.uid), {
    ...newUser,
    createdAt: serverTimestamp(),
  });

  return newUser;
}

/**
 * Sign in an existing user.
 */
export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetch the Firestore user profile for a given Firebase Auth user.
 * If the document doesn't exist (e.g. legacy account), create it automatically.
 */
export async function getUserProfile(fbUser: FirebaseUser): Promise<User> {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as User;
  }

  // Auto-create missing profile
  const fallback: User = {
    uid: fbUser.uid,
    name: fbUser.displayName || 'User',
    email: fbUser.email || '',
    plan: 'free',
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, { ...fallback, createdAt: serverTimestamp() });
  return fallback;
}

/**
 * Update the user's Firestore profile fields.
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'plan'>>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), updates, { merge: true });
}
