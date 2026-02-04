/**
 * IndexedDB Service via `idb` library
 *
 * The system database starts EMPTY. All data comes from user uploads.
 * Persists across page refreshes using IndexedDB.
 * Plans now store formula-based ZoningRules extracted from documents.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { ZoningPlan, ZoningRule, DocumentType } from '@/types';

// ── Database Schema ─────────────────────────────────────────

export interface StoredDocument {
  id: string;
  name: string;
  planNumber: string;
  type: DocumentType;
  uploadDate: string;
  pageCount: number;
  extractedRules?: ZoningRule[];
}

export interface ExtractedPlanData {
  planNumber?: string;
  planName?: string;
  city?: string;
  neighborhood?: string;
  approvalDate?: string;
  zoningType?: string;
  planKind?: 'detailed' | 'outline';
  rules: ZoningRule[];
  documents: UploadedDocRef[];
}

export interface UploadedDocRef {
  type: DocumentType;
  name: string;
  uploadDate: string;
  pageCount: number;
}

const DB_NAME = 'zchut-ai';
const DB_VERSION = 1;

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
        if (!db.objectStoreNames.contains(PLANS_STORE)) {
          const planStore = db.createObjectStore(PLANS_STORE, { keyPath: 'id' });
          planStore.createIndex('by-city', 'city', { unique: false });
          planStore.createIndex('by-neighborhood', 'neighborhood', { unique: false });
          planStore.createIndex('by-planNumber', 'planNumber', { unique: false });
        }

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
  const plans = await db.getAll(PLANS_STORE);
  // Ensure backward compat: old plans without rules get empty array
  return plans.map((p: ZoningPlan) => ({ ...p, rules: p.rules || [], planKind: p.planKind || 'detailed' }));
}

export async function getPlanById(id: string): Promise<ZoningPlan | undefined> {
  const db = await getDB();
  const plan = await db.get(PLANS_STORE, id);
  if (plan) {
    plan.rules = plan.rules || [];
    plan.planKind = plan.planKind || 'detailed';
  }
  return plan;
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

export async function findPlansByLocation(query: string): Promise<ZoningPlan[]> {
  const allPlans = await getAllPlans();
  if (allPlans.length === 0) return [];

  const q = query.trim();
  const results: ZoningPlan[] = [];

  for (const plan of allPlans) {
    if (plan.city && plan.city.length > 1 && q.includes(plan.city)) {
      results.push(plan);
      continue;
    }
    if (plan.neighborhood && plan.neighborhood.length > 1 && q.includes(plan.neighborhood)) {
      results.push(plan);
      continue;
    }
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
 * Get a rule value from the rules array by category.
 * Returns the rawNumber of the first matching confirmed rule, or fallback.
 */
function getRuleValue(rules: ZoningRule[], category: string, fallback: number = 0): number {
  const rule = rules.find(r => r.category === category && r.confirmed);
  return rule?.rawNumber ?? fallback;
}

/**
 * Build a full ZoningPlan from extracted data + rules.
 * Populates both the legacy flat fields and the rules array.
 */
export function buildPlanFromExtraction(
  data: ExtractedPlanData,
  docNames: string[]
): ZoningPlan {
  const rules = data.rules || [];

  const mainPct = getRuleValue(rules, 'main_rights');
  const servicePct = getRuleValue(rules, 'service_area');

  return {
    id: generateId('plan'),
    planNumber: data.planNumber || '',
    name: data.planName || '',
    city: data.city || '',
    neighborhood: data.neighborhood || '',
    approvalDate: data.approvalDate || new Date().toISOString().split('T')[0],
    status: 'active',
    planKind: data.planKind || 'detailed',
    zoningType: (data.zoningType as ZoningPlan['zoningType']) || 'residential_a',
    sourceDocument: {
      name: docNames.join(', ') || 'Uploaded Documents',
      url: '',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    rules,
    buildingRights: {
      mainBuildingPercent: mainPct,
      serviceBuildingPercent: servicePct,
      totalBuildingPercent: mainPct + servicePct,
      maxFloors: getRuleValue(rules, 'max_floors'),
      maxHeight: getRuleValue(rules, 'max_height'),
      maxUnits: getRuleValue(rules, 'max_units'),
      basementAllowed: rules.some(r => r.category === 'basement'),
      basementPercent: getRuleValue(rules, 'basement'),
      rooftopPercent: getRuleValue(rules, 'rooftop'),
      landCoveragePercent: getRuleValue(rules, 'coverage'),
      floorAllocations: [],
      citations: [],
    },
    restrictions: {
      frontSetback: getRuleValue(rules, 'front_setback'),
      rearSetback: getRuleValue(rules, 'rear_setback'),
      sideSetback: getRuleValue(rules, 'side_setback'),
      minParkingSpaces: getRuleValue(rules, 'parking', 1.5),
      minGreenAreaPercent: 30,
      maxLandCoverage: getRuleValue(rules, 'coverage'),
    },
  };
}

// ── Formula Evaluator ───────────────────────────────────────

/**
 * Safely evaluate a formula string with variable substitution.
 * Only allows basic math: numbers, +, -, *, /, (), and decimal points.
 */
export function evaluateFormula(
  formula: string,
  vars: Record<string, number>
): number {
  let expr = formula;
  // Sort variable names by length (longest first) to avoid partial replacements
  const sortedVars = Object.entries(vars).sort((a, b) => b[0].length - a[0].length);
  for (const [name, value] of sortedVars) {
    expr = expr.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
  }

  // Safety: only allow numbers, math operators, parentheses, decimals, spaces
  if (!/^[\d\s+\-*/().]+$/.test(expr)) {
    console.warn('Invalid formula expression:', expr, 'from', formula);
    return 0;
  }

  try {
    const result = new Function(`return (${expr})`)() as number;
    return isNaN(result) || !isFinite(result) ? 0 : Math.round(result * 100) / 100;
  } catch {
    console.warn('Formula evaluation error:', formula);
    return 0;
  }
}
