'use client';

import { useEffect } from 'react';
import { getFirebaseAnalytics } from '@/lib/firebase-client';

export default function FirebaseAnalytics() {
  useEffect(() => {
    getFirebaseAnalytics();
  }, []);

  return null;
}
