/**
 * IndexedDB Service via `idb` library
 *
 * The system database starts EMPTY. All data comes from user uploads.
 * Persists across page refreshes using IndexedDB.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { ZoningPlan } from '@/types';

// ── Database Schema ─────────────────────────────────────────

export interface StoredDocument {
  id: string;
  name: string;
  planNumber: string;
  type: 'takkanon' | 'tashrit' | 'plan_map' | 'appendix' | 'other';
  uploadDate: string;
  extractedData?: ExtractedPlanData;
}

export interface ExtractedPlanData {
  planNumber?: string;
  planName?: string;
  city?: string;
  neighborhood?: string;
  approvalDate?: string;
  zoningType?: string;
  mainBuildingPercent?: number;
  serviceBuildingPercent?: number;
  maxFloors?: number;
  maxHeight?: number;
  maxUnits?: number;
  unitsPerDunam?: number;
  frontSetback?: number;
  rearSetback?: number;
  sideSetback?: number;
  landCoveragePercent?: number;
  notes?: string;
}

const DB_NAME = 'zchut-ai';
const DB_VERSION = 1;

// Store names
const PLANS_STORE = 'plans';
const DOCUMENTS_STORE = 'documents';

// ── Database Initialization ─────────────────────────────────

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available on server'));
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Plans store - keyed by id
        if (!db.objectStoreNames.contains(PLANS_STORE)) {
          const planStore = db.createObjectStore(PLANS_STORE, { keyPath: 'id' });
          planStore.createIndex('by-city', 'city', { unique: false });
          planStore.createIndex('by-neighborhood', 'neighborhood', { unique: false });
          planStore.createIndex('by-planNumber', 'planNumber', { unique: false });
        }

        // Documents store - keyed by id
        if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
          db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
        }
      },
    });
  }

  return dbPromise;
}

// ── Plans CRUD ──────────────────────────────────────────────

export async function getAllPlans(): Promise<ZoningPlan[]> {
  const db = await getDB();
  return db.getAll(PLANS_STORE);
}

export async function getPlanById(id: string): Promise<ZoningPlan | undefined> {
  const db = await getDB();
  return db.get(PLANS_STORE, id);
}

export async function savePlan(plan: ZoningPlan): Promise<void> {
  const db = await getDB();
  await db.put(PLANS_STORE, plan);
}

export async function deletePlan(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(PLANS_STORE, id);
}

export async function getPlanCount(): Promise<number> {
  const db = await getDB();
  return db.count(PLANS_STORE);
}

/**
 * Find plans matching a city or neighborhood string.
 * Used by the calculation engine to locate relevant plans.
 */
export async function findPlansByLocation(query: string): Promise<ZoningPlan[]> {
  const allPlans = await getAllPlans();
  if (allPlans.length === 0) return [];

  const q = query.trim();
  const results: ZoningPlan[] = [];

  for (const plan of allPlans) {
    // Match by city
    if (plan.city && plan.city.length > 1 && q.includes(plan.city)) {
      results.push(plan);
      continue;
    }
    // Match by neighborhood
    if (plan.neighborhood && plan.neighborhood.length > 1 && q.includes(plan.neighborhood)) {
      results.push(plan);
      continue;
    }
    // Match by plan number
    if (plan.planNumber && q.includes(plan.planNumber)) {
      results.push(plan);
    }
  }

  return results;
}

// ── Documents CRUD ──────────────────────────────────────────

export async function getAllDocuments(): Promise<StoredDocument[]> {
  const db = await getDB();
  return db.getAll(DOCUMENTS_STORE);
}

export async function saveDocument(doc: StoredDocument): Promise<void> {
  const db = await getDB();
  await db.put(DOCUMENTS_STORE, doc);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(DOCUMENTS_STORE, id);
}

// ── Helpers ─────────────────────────────────────────────────

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Build a full ZoningPlan from extracted document data.
 * This is the core "learning" function - it structures extracted data
 * into the plan schema that the calculation engine uses.
 */
export function buildPlanFromExtraction(
  data: ExtractedPlanData,
  docId: string
): ZoningPlan {
  const mainPct = data.mainBuildingPercent || 0;
  const servicePct = data.serviceBuildingPercent || 0;

  return {
    id: generateId('plan'),
    planNumber: data.planNumber || '',
    name: data.planName || '',
    city: data.city || '',
    neighborhood: data.neighborhood || '',
    approvalDate: data.approvalDate || new Date().toISOString().split('T')[0],
    status: 'active',
    zoningType: (data.zoningType as ZoningPlan['zoningType']) || 'residential_a',
    sourceDocument: {
      name: `Uploaded Document #${docId}`,
      url: '',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    buildingRights: {
      mainBuildingPercent: mainPct,
      serviceBuildingPercent: servicePct,
      totalBuildingPercent: mainPct + servicePct,
      maxFloors: data.maxFloors || 0,
      maxHeight: data.maxHeight || 0,
      maxUnits: data.maxUnits || 0,
      basementAllowed: true,
      basementPercent: 0,
      rooftopPercent: 0,
      landCoveragePercent: data.landCoveragePercent || 0,
      floorAllocations: [],
      citations: [],
    },
    restrictions: {
      frontSetback: data.frontSetback || 0,
      rearSetback: data.rearSetback || 0,
      sideSetback: data.sideSetback || 0,
      minParkingSpaces: 1.5,
      minGreenAreaPercent: 30,
      maxLandCoverage: data.landCoveragePercent || 0,
    },
  };
}

// ── Admin Auth (session-only, no persistence needed) ────────

const ADMIN_PASSWORD = 'zchut2024';

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('zchut-admin-auth') === 'true';
}

export function setAdminAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    sessionStorage.setItem('zchut-admin-auth', 'true');
  } else {
    sessionStorage.removeItem('zchut-admin-auth');
  }
}
