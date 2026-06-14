import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin SDK — server-side only (API routes)
// Set these environment variables in .env.local:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY (the full PEM key, with \n escaped)
//   FIREBASE_STORAGE_BUCKET (optional, defaults to {projectId}.appspot.com)

function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });
}

export function getDb() {
  const app = getFirebaseAdmin();
  if (!app) return null;
  return getFirestore(app);
}

export function getBucket() {
  const app = getFirebaseAdmin();
  if (!app) return null;
  return getStorage(app).bucket();
}
