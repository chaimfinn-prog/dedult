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
  'https://es.govmap.gov.il/TldSearch/api/DetailsByQuery';

const MAPI_PARCEL_URL =
  'https://ags.govmap.gov.il/Gis/ArcGIS/rest/services/Parcels/MapServer/0/query';

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
  try {
    const response = await fetch(MAPI_GEOCODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        QueryType: 'ToponymSearch',
        Query: address,
        ResultType: 'Parcel',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.ResultLyr?.length) return null;

    const result = data.ResultLyr[0];
    return {
      x: result.X,
      y: result.Y,
      address: result.ResultLbl || address,
      municipality: result.Setl || '',
    };
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
  try {
    const params = new URLSearchParams({
      f: 'json',
      geometry: JSON.stringify({ x, y, spatialReference: { wkid: 2039 } }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'GUSH_NUM,PARCEL,SUB_PARCEL,SHETACH_RASHUM,SHAPE_Area,SHAPE_Length',
      returnGeometry: 'false',
    });

    const response = await fetch(`${MAPI_PARCEL_URL}?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.features?.length) return null;

    const attr = data.features[0].attributes;
    return {
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
    const response = await fetch(`${IPLAN_API_URL}?${searchParams}`);
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

const RISHUI_BASE_URL = 'https://www.rishuizamin.co.il';

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
    const response = await fetch(
      `${RISHUI_BASE_URL}/api/permits/search?gush=${block}&helka=${parcel}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) return null;

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
