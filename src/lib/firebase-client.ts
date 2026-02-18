import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyClyYBe-mKyR0lRyjg70JHlcbJMbLLUvp4',
  authDomain: 'propcheck-6fa7c.firebaseapp.com',
  databaseURL: 'https://propcheck-6fa7c-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'propcheck-6fa7c',
  storageBucket: 'propcheck-6fa7c.firebasestorage.app',
  messagingSenderId: '351070379528',
  appId: '1:351070379528:web:9c7812955bb1be59d5fbbd',
  measurementId: 'G-ZJ5Y00GRF7',
};

// Initialize Firebase App (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Realtime Database
export const db: Database = getDatabase(app);

// Storage
export const storage: FirebaseStorage = getStorage(app);

// Analytics — only in browser (not during SSR)
let analyticsInstance: Analytics | null = null;

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();
  if (!supported) return null;
  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

export { app };
