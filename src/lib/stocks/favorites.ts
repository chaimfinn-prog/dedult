'use client';

import { openDB, type IDBPDatabase } from 'idb';
import type { Favorite } from './types';

const DB_NAME = 'rc-stocks';
const DB_VERSION = 1;
const STORE = 'favorites';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'symbol' });
        }
      },
    });
  }
  return dbPromise;
}

export async function listFavorites(): Promise<Favorite[]> {
  const db = await getDb();
  const all = (await db.getAll(STORE)) as Favorite[];
  return all.sort((a, b) => b.addedAt - a.addedAt);
}

export async function addFavorite(fav: Favorite): Promise<void> {
  const db = await getDb();
  await db.put(STORE, fav);
}

export async function removeFavorite(symbol: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, symbol);
}

export async function isFavorite(symbol: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.get(STORE, symbol);
  return Boolean(row);
}
