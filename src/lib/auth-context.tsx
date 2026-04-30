'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { browserLocalPersistence, setPersistence } from 'firebase/auth';
import { auth } from './firebase';
import { User } from '@/types';
import { registerUser, loginUser, logoutUser, getUserProfile } from '@/services/authService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure persistent login across app restarts
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser);
          setUser(profile);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setUser({
            uid: fbUser.uid,
            name: fbUser.displayName || 'User',
            email: fbUser.email || '',
            plan: 'free',
            role: 'owner',
            businessLimit: 1,
            disabled: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await loginUser(email, password);
  };

  const register = async (name: string, email: string, password: string) => {
    const newUser = await registerUser(name, email, password);
    setUser(newUser);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser);
    setUser(profile);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ firebaseUser, user, loading, isAdmin, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
