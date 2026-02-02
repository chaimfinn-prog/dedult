/**
 * Admin Storage Service
 * Manages custom plans, addresses, and documents via localStorage
 * Merges user-added data with hardcoded defaults for the analysis engine
 */

import { ZoningPlan } from '@/types';
import { AddressMapping, zoningPlans, addressMappings } from '@/data/zoning-plans';

const STORAGE_KEYS = {
  plans: 'zchut-admin-plans',
  addresses: 'zchut-admin-addresses',
  documents: 'zchut-admin-documents',
  auth: 'zchut-admin-auth',
} as const;

// Document metadata (PDFs stored as base64 or external URLs)
export interface DocumentEntry {
  id: string;
  name: string;            // שם המסמך
  planNumber: string;      // מספר תכנית
  type: 'takkanon' | 'tashrit' | 'plan_map' | 'appendix' | 'other';
  description: string;
  uploadDate: string;
  fileSize?: number;       // bytes
  pageCount?: number;
  dataUrl?: string;        // base64 data URL for small files
  externalUrl?: string;    // URL for external files
  extractedData?: ExtractedPlanData;
}

// Structured data extracted from uploaded documents
export interface ExtractedPlanData {
  planNumber?: string;
  planName?: string;
  city?: string;
  neighborhood?: string;
  approvalDate?: string;
  mainBuildingPercent?: number;
  serviceBuildingPercent?: number;
  maxFloors?: number;
  maxHeight?: number;
  maxUnits?: number;
  frontSetback?: number;
  rearSetback?: number;
  sideSetback?: number;
  landCoveragePercent?: number;
  notes?: string;
}

export const documentTypeLabels: Record<DocumentEntry['type'], string> = {
  takkanon: 'תקנון',
  tashrit: 'תשריט',
  plan_map: 'תשריט תכנית',
  appendix: 'נספח',
  other: 'אחר',
};

// ── Storage helpers ──────────────────────────────────────────

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[AdminStorage] Failed to save:', e);
  }
}

// ── Plans Management ─────────────────────────────────────────

export function getCustomPlans(): ZoningPlan[] {
  return getFromStorage<ZoningPlan[]>(STORAGE_KEYS.plans, []);
}

export function saveCustomPlan(plan: ZoningPlan): void {
  const plans = getCustomPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  setToStorage(STORAGE_KEYS.plans, plans);
}

export function deleteCustomPlan(planId: string): void {
  const plans = getCustomPlans().filter(p => p.id !== planId);
  setToStorage(STORAGE_KEYS.plans, plans);
}

/** Get all plans: hardcoded + custom (custom override if same ID) */
export function getAllPlans(): ZoningPlan[] {
  const custom = getCustomPlans();
  const customIds = new Set(custom.map(p => p.id));
  const base = zoningPlans.filter(p => !customIds.has(p.id));
  return [...base, ...custom];
}

// ── Address Mappings Management ──────────────────────────────

export function getCustomAddresses(): AddressMapping[] {
  return getFromStorage<AddressMapping[]>(STORAGE_KEYS.addresses, []);
}

export function saveCustomAddress(addr: AddressMapping): void {
  const addresses = getCustomAddresses();
  const idx = addresses.findIndex(a => a.address === addr.address);
  if (idx >= 0) {
    addresses[idx] = addr;
  } else {
    addresses.push(addr);
  }
  setToStorage(STORAGE_KEYS.addresses, addresses);
}

export function deleteCustomAddress(address: string): void {
  const addresses = getCustomAddresses().filter(a => a.address !== address);
  setToStorage(STORAGE_KEYS.addresses, addresses);
}

/** Get all addresses: hardcoded + custom (custom override if same address) */
export function getAllAddresses(): AddressMapping[] {
  const custom = getCustomAddresses();
  const customAddrs = new Set(custom.map(a => a.address));
  const base = addressMappings.filter(a => !customAddrs.has(a.address));
  return [...base, ...custom];
}

// ── Documents Management ─────────────────────────────────────

export function getDocuments(): DocumentEntry[] {
  return getFromStorage<DocumentEntry[]>(STORAGE_KEYS.documents, []);
}

export function saveDocument(doc: DocumentEntry): void {
  const docs = getDocuments();
  const idx = docs.findIndex(d => d.id === doc.id);
  if (idx >= 0) {
    docs[idx] = doc;
  } else {
    docs.push(doc);
  }
  setToStorage(STORAGE_KEYS.documents, docs);
}

export function deleteDocument(docId: string): void {
  const docs = getDocuments().filter(d => d.id !== docId);
  setToStorage(STORAGE_KEYS.documents, docs);
}

// ── Auth ─────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'zchut2024';

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEYS.auth) === 'true';
}

export function setAdminAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    sessionStorage.setItem(STORAGE_KEYS.auth, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.auth);
  }
}

// ── Generate ID ──────────────────────────────────────────────

export function generateId(prefix: string = 'custom'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ── File to Base64 ───────────────────────────────────────────

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Create plan from extracted document data ─────────────────

export function createPlanFromExtractedData(
  data: ExtractedPlanData,
  docId: string
): Partial<ZoningPlan> {
  return {
    id: generateId('plan'),
    planNumber: data.planNumber || '',
    name: data.planName || '',
    city: data.city || 'רעננה',
    neighborhood: data.neighborhood || '',
    approvalDate: data.approvalDate || new Date().toISOString().split('T')[0],
    status: 'active',
    zoningType: 'residential_a',
    sourceDocument: {
      name: `מסמך מערכת #${docId}`,
      url: '',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    buildingRights: {
      mainBuildingPercent: data.mainBuildingPercent || 0,
      serviceBuildingPercent: data.serviceBuildingPercent || 0,
      totalBuildingPercent: (data.mainBuildingPercent || 0) + (data.serviceBuildingPercent || 0),
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
