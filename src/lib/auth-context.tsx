'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { User } from '@/types';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
} from '@/services/authService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
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

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser);
          setUser(profile);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          // Fallback so the app doesn't break
          setUser({
            uid: fbUser.uid,
            name: fbUser.displayName || 'User',
            email: fbUser.email || '',
            plan: 'free',
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
    // onAuthStateChanged will fire and load the profile automatically
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

  return (
    <AuthContext.Provider
      value={{ firebaseUser, user, loading, login, register, logout, refreshUser }}
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
