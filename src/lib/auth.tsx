'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { ref, set, push, get, Database } from 'firebase/database';
import { app, db } from './firebase-client';

// ── Auth singleton ──
let authInstance: Auth | null = null;
function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

// ── Context ──
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveSearchHistory: (data: SearchHistoryEntry) => Promise<void>;
  getSearchHistory: () => Promise<SearchHistoryEntry[]>;
}

export interface SearchHistoryEntry {
  type: 'rights-calc' | 'economic-feasibility' | 'developer-check' | 'checkup';
  timestamp: number;
  address?: string;
  city?: string;
  plotArea?: number;
  existingFloors?: number;
  results?: Record<string, unknown>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  saveSearchHistory: async () => {},
  getSearchHistory: async () => [],
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Provider ──
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    const auth = getAuthInstance();
    await firebaseSignOut(auth);
  };

  const saveSearchHistory = async (data: SearchHistoryEntry) => {
    if (!user) return;
    const historyRef = ref(db, `users/${user.uid}/searchHistory`);
    const newEntryRef = push(historyRef);
    await set(newEntryRef, {
      ...data,
      timestamp: Date.now(),
    });
  };

  const getSearchHistory = async (): Promise<SearchHistoryEntry[]> => {
    if (!user) return [];
    const historyRef = ref(db, `users/${user.uid}/searchHistory`);
    const snapshot = await get(historyRef);
    if (!snapshot.exists()) return [];
    const entries: SearchHistoryEntry[] = [];
    snapshot.forEach((child) => {
      entries.push(child.val() as SearchHistoryEntry);
    });
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, saveSearchHistory, getSearchHistory }}>
      {children}
    </AuthContext.Provider>
  );
}
