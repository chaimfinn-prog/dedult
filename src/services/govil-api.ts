/**
 * Israel Government GIS Services Integration
 *
 * Connects to real Israeli government ArcGIS REST APIs:
 * 1. MAPI (מפ"י) - Parcel boundaries and areas
 * 2. iplan (מבא"ת) - Zoning plans (תב"עות)
 * 3. Rishui Zamin (רישוי זמין) - Building permits
 */

// ============================================================
// 1. MAPI - Survey of Israel (מפ"י)
//    Parcel identification: address → block/parcel + area
// ============================================================

const MAPI_GEOCODE_URL =
  process.env.MAPI_GEOCODE_URL ??
  'https://es.govmap.gov.il/TldSearch/api/DetailsByQuery';

const MAPI_PARCEL_URL =
  process.env.MAPI_PARCEL_URL ??
  'https://ags.govmap.gov.il/Gis/ArcGIS/rest/services/Parcels/MapServer/0/query';

const GOVMAP_API_TOKEN = process.env.GOVMAP_API_TOKEN;

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_ENTRIES = 500;

type CacheEntry<T> = { value: T; expiresAt: number };
const geocodeCache = new Map<string, CacheEntry<{ x: number; y: number; address: string; municipality: string }>>();
const parcelCache = new Map<string, CacheEntry<ParcelResult>>();

function getCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export interface ParcelResult {
  block: string;       // גוש
  parcel: string;      // חלקה
  subParcel?: string;  // תת-חלקה
  area: number;        // שטח רשום (מ"ר)
  perimeter: number;   // היקף
  x: number;           // ITM X
  y: number;           // ITM Y
  address: string;
  municipality: string;
  source: 'mapi_gis' | 'local_db';
}

/**
 * Step 1: Geocode address to coordinates using GovMap
 */
export async function geocodeAddress(address: string): Promise<{
  x: number;
  y: number;
  address: string;
  municipality: string;
} | null> {
  const cached = getCache(geocodeCache, address);
  if (cached) return cached;
  try {
    const response = await fetchWithRetry(MAPI_GEOCODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        QueryType: 'ToponymSearch',
        Query: address,
        ResultType: 'Parcel',
        ...(GOVMAP_API_TOKEN ? { Token: GOVMAP_API_TOKEN } : {}),
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.ResultLyr?.length) return null;

    const result = data.ResultLyr[0];
    const resultPayload = {
      x: result.X,
      y: result.Y,
      address: result.ResultLbl || address,
      municipality: result.Setl || '',
    };
    setCache(geocodeCache, address, resultPayload);
    return resultPayload;
  } catch {
    console.error('[MAPI] Geocode failed for:', address);
    return null;
  }
}

/**
 * Step 2: Query MAPI parcel layer by coordinates
 * Uses ArcGIS spatial query with esriSpatialRelIntersects
 */
export async function getParcelByCoordinates(
  x: number,
  y: number
): Promise<ParcelResult | null> {
  const cacheKey = `${x}:${y}`;
  const cached = getCache(parcelCache, cacheKey);
  if (cached) return cached;
  try {
    const params = new URLSearchParams({
      f: 'json',
      geometry: JSON.stringify({ x, y, spatialReference: { wkid: 2039 } }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'GUSH_NUM,PARCEL,SUB_PARCEL,SHETACH_RASHUM,SHAPE_Area,SHAPE_Length',
      returnGeometry: 'false',
    });
    if (GOVMAP_API_TOKEN) {
      params.set('token', GOVMAP_API_TOKEN);
    }

    const response = await fetchWithRetry(`${MAPI_PARCEL_URL}?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.features?.length) return null;

    const attr = data.features[0].attributes;
    const parcelResult: ParcelResult = {
      block: String(attr.GUSH_NUM),
      parcel: String(attr.PARCEL),
      subParcel: attr.SUB_PARCEL ? String(attr.SUB_PARCEL) : undefined,
      area: attr.SHETACH_RASHUM || Math.round(attr.SHAPE_Area),
      perimeter: Math.round(attr.SHAPE_Length || 0),
      x,
      y,
      address: '',
      municipality: '',
      source: 'mapi_gis',
    };
    setCache(parcelCache, cacheKey, parcelResult);
    return parcelResult;
  } catch {
    console.error('[MAPI] Parcel query failed');
    return null;
  }
}

/**
 * Combined: Address → Parcel data
 */
export async function getParcelByAddress(
  address: string
): Promise<ParcelResult | null> {
  const geo = await geocodeAddress(address);
  if (!geo) return null;

  const parcel = await getParcelByCoordinates(geo.x, geo.y);
  if (!parcel) return null;

  return {
    ...parcel,
    address: geo.address,
    municipality: geo.municipality,
  };
}

// ============================================================
// 2. iplan - National Planning Administration (מבא"ת)
//    Find approved detailed plans (תב"עות מפורטות)
// ============================================================

const IPLAN_API_URL =
  process.env.IPLAN_API_URL ??
  'https://ags.iplan.gov.il/arcgisiplan/rest/services/PlanningPublic/Tachtioth/MapServer/0/query';

export interface PlanDocument {
  planId: string;
  planNumber: string;        // מספר תכנית
  planName: string;          // שם תכנית
  planType: string;          // סוג תכנית (מפורטת/מתאר)
  status: string;            // סטטוס (מאושרת/מופקדת)
  approvalDate: string;      // תאריך אישור
  landUse: string;           // ייעוד קרקע
  mainBuildingPercent: number;
  serviceBuildingPercent: number;
  maxFloors: number;
  maxHeight: number;
  documentUrl?: string;      // קישור ל-PDF תקנון
  municipality: string;
  source: 'iplan_api' | 'local_db';
}

/**
 * Query iplan for approved detailed plans (תוכניות מפורטות מאושרות)
 * on a specific parcel
 */
export async function getApprovedPlans(
  block: string,
  parcel: string,
  x?: number,
  y?: number
): Promise<PlanDocument[]> {
  try {
    // Query by spatial intersection if coordinates available
    const params: Record<string, string> = {
      f: 'json',
      outFields: 'PLAN_COUNTY_NAME,PL_NUMBER,PL_NAME,PLAN_CHARACTOR_NAME,STATION_DESC,PL_DATE_STATUS,PL_LANDUSE_STRING,PL_URL,ENTITY_SUBTYPE_DESC',
      returnGeometry: 'false',
      where: "STATION_DESC = 'אושרה' AND ENTITY_SUBTYPE_DESC = 'תכנית מפורטת'",
    };

    if (x && y) {
      params.geometry = JSON.stringify({
        x,
        y,
        spatialReference: { wkid: 2039 },
      });
      params.geometryType = 'esriGeometryPoint';
      params.spatialRel = 'esriSpatialRelIntersects';
    }

    const searchParams = new URLSearchParams(params);
    const response = await fetchWithRetry(`${IPLAN_API_URL}?${searchParams}`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data?.features?.length) return [];

    return data.features
      .map((f: { attributes: Record<string, string | number> }) => {
        const a = f.attributes;
        return {
          planId: String(a.PL_NUMBER || ''),
          planNumber: String(a.PL_NUMBER || ''),
          planName: String(a.PL_NAME || ''),
          planType: String(a.ENTITY_SUBTYPE_DESC || ''),
          status: String(a.STATION_DESC || ''),
          approvalDate: String(a.PL_DATE_STATUS || ''),
          landUse: String(a.PL_LANDUSE_STRING || ''),
          mainBuildingPercent: 0,   // Extracted from PDF by AI
          serviceBuildingPercent: 0, // Extracted from PDF by AI
          maxFloors: 0,             // Extracted from PDF by AI
          maxHeight: 0,             // Extracted from PDF by AI
          documentUrl: String(a.PL_URL || ''),
          municipality: String(a.PLAN_COUNTY_NAME || ''),
          source: 'iplan_api' as const,
        };
      })
      .filter((p: PlanDocument) => p.planNumber); // Filter out empty
  } catch {
    console.error('[IPLAN] Plans query failed');
    return [];
  }
}

// ============================================================
// 3. Rishui Zamin (רישוי זמין) - Building permits
//    Current built state from last approved permit
// ============================================================

const RISHUI_BASE_URL = process.env.RISHUI_BASE_URL ?? 'https://www.rishuizamin.co.il';

export interface PermitData {
  permitNumber: string;
  permitDate: string;
  totalBuiltArea: number;  // שטח בנוי כולל
  floors: number;          // מספר קומות
  units: number;           // מספר יח"ד
  status: string;
  source: 'rishui_zamin' | 'local_db';
}

/**
 * Query Rishui Zamin for existing building permits
 * Note: This service may require authentication in production
 */
export async function getExistingPermits(
  block: string,
  parcel: string
): Promise<PermitData | null> {
  try {
    // Rishui Zamin API - search by block/parcel
    const response = await fetchWithRetry(
      `${RISHUI_BASE_URL}/api/permits/search?gush=${block}&helka=${parcel}`,
      { headers: { Accept: 'application/json' } }
    );

    const data = await response.json();
    if (!data?.permits?.length) return null;

    // Get the latest approved permit
    const latest = data.permits
      .filter((p: { status: string }) => p.status === 'מאושר')
      .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))[0];

    if (!latest) return null;

    return {
      permitNumber: latest.permitNumber,
      permitDate: latest.date,
      totalBuiltArea: latest.totalArea || 0,
      floors: latest.floors || 0,
      units: latest.units || 0,
      status: latest.status,
      source: 'rishui_zamin',
    };
  } catch {
    console.error('[RISHUI] Permit query failed');
    return null;
  }
}

// ============================================================
// 4. Validation Engine - Cross-reference data integrity
// ============================================================

export interface ValidationResult {
  field: string;
  citedValue: string;
  calculatedValue: string;
  match: boolean;
  source: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation Engine: compares cited values against calculated values
 * Catches discrepancies between AI extraction and computation
 */
export function validateAnalysis(
  citedBuildingPercent: number,
  calculatedBuildingPercent: number,
  citedMaxFloors: number,
  calculatedMaxFloors: number,
  citedPlotArea: number,
  measuredPlotArea: number
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Validate building percentage
  if (Math.abs(citedBuildingPercent - calculatedBuildingPercent) > 1) {
    results.push({
      field: 'אחוזי בנייה',
      citedValue: `${citedBuildingPercent}%`,
      calculatedValue: `${calculatedBuildingPercent}%`,
      match: false,
      source: 'תקנון תב"ע',
      severity: 'error',
    });
  } else {
    results.push({
      field: 'אחוזי בנייה',
      citedValue: `${citedBuildingPercent}%`,
      calculatedValue: `${calculatedBuildingPercent}%`,
      match: true,
      source: 'תקנון תב"ע',
      severity: 'info',
    });
  }

  // Validate floors
  if (citedMaxFloors !== calculatedMaxFloors) {
    results.push({
      field: 'קומות מרביות',
      citedValue: String(citedMaxFloors),
      calculatedValue: String(calculatedMaxFloors),
      match: false,
      source: 'תקנון תב"ע',
      severity: 'warning',
    });
  }

  // Validate plot area (allow 5% tolerance for surveying differences)
  const areaDiff = Math.abs(citedPlotArea - measuredPlotArea) / measuredPlotArea;
  if (areaDiff > 0.05) {
    results.push({
      field: 'שטח מגרש',
      citedValue: `${citedPlotArea} מ"ר`,
      calculatedValue: `${measuredPlotArea} מ"ר (מדידה)`,
      match: false,
      source: 'מפ"י GIS',
      severity: 'warning',
    });
  }

  return results;
}
