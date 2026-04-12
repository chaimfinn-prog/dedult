import { NextRequest, NextResponse } from 'next/server';
import { analyzeDeals, estimateDimensionsFromWkt, type DealRecord } from '@/lib/geo/parcel-analysis';

const AUTOCOMPLETE_URL = 'https://www.govmap.gov.il/api/search-service/autocomplete';
const ENTITIES_URL = 'https://www.govmap.gov.il/api/layers-catalog/entitiesByPoint';
const DEALS_URL = 'https://www.govmap.gov.il/api/real-estate/deals';
const STREET_DEALS_URL = 'https://www.govmap.gov.il/api/real-estate/street-deals';

const FETCH_TIMEOUT = 10000;
const DEALS_RADIUS = 200;
const MAX_DEALS = 50;
const USER_AGENT = 'Mozilla/5.0';

// ── Fetch helper ────────────────────────────────────────────

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const headers = { 'User-Agent': USER_AGENT, ...options.headers } as Record<string, string>;
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Step 1: Autocomplete — validate parcel, get coordinates ─

interface AutocompleteResult {
  id: string;
  text: string;
  type: string;
  shape: string;
}

async function findParcel(gush: number, helka: number): Promise<{ x: number; y: number } | null> {
  const data = await fetchJson<{ results: AutocompleteResult[] }>(AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchText: `גוש ${gush} חלקה ${helka}`,
      language: 'he',
      isAccurate: false,
      maxResults: 50,
    }),
  });

  if (!data?.results) return null;
  const exactText = `גוש ${gush} חלקה ${helka}`;
  const match = data.results.find(r => r.type === 'parcel' && r.text === exactText);
  if (!match) return null;

  const m = match.shape.match(/POINT\(([0-9.]+)\s+([0-9.]+)\)/);
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

// ── Step 2: Entities by point — parcel area + zoning ────────

interface LayerEntity {
  objectId: number;
  geom?: string;
  fields: { fieldName: string; fieldValue: unknown }[];
}

interface LayerResult {
  layerId: string;
  caption: string;
  entities: LayerEntity[];
}

function getField(entity: LayerEntity, name: string): unknown {
  return entity.fields.find(f => f.fieldName === name)?.fieldValue ?? null;
}

async function queryLayers(x: number, y: number) {
  const data = await fetchJson<{ data: LayerResult[] }>(ENTITIES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      point: [x, y],
      layers: [
        { layerId: '15' },           // parcel_all — area + geometry
        { layerId: '6' },            // ownership
        { layerId: 'retzefMigrashim' }, // zoning/planning
      ],
      tolerance: 10,
    }),
  });

  if (!data?.data) return null;

  const result: Record<string, unknown> = {};

  // Layer 15 — parcel area + geometry
  const parcelLayer = data.data.find(l => l.layerId === '15');
  if (parcelLayer?.entities?.[0]) {
    const ent = parcelLayer.entities[0];
    const legalArea = getField(ent, 'שטח רשום (מ"ר)');
    if (typeof legalArea === 'number' && legalArea > 0) {
      result.areaSqm = legalArea;
    }

    // Width/depth from polygon bounding box
    if (ent.geom) {
      const dims = estimateDimensionsFromWkt(ent.geom);
      if (dims) {
        result.estimatedWidth = dims.width;
        result.estimatedDepth = dims.depth;
      }
    }
  }

  // Layer 6 — ownership
  const ownerLayer = data.data.find(l => l.layerId === '6');
  if (ownerLayer?.entities?.[0]) {
    const ownership = getField(ownerLayer.entities[0], 'סוג בעלות');
    if (ownership) result.ownership = ownership;
  }

  // retzefMigrashim — zoning
  const zoningLayer = data.data.find(l => l.layerId === 'retzefMigrashim');
  if (zoningLayer?.entities) {
    // Find residential zoning record (ydiur > 0) or first record
    const residential = zoningLayer.entities.find(e => {
      const units = getField(e, 'יחידות דיור');
      return typeof units === 'number' && units > 0;
    });
    const zoning = residential ?? zoningLayer.entities[0];
    if (zoning) {
      const planNumber = getField(zoning, 'תוכנית');
      const designation = getField(zoning, 'יעוד');
      const designationTranslation = getField(zoning, 'תרגום יעוד');
      const allowedUnits = getField(zoning, 'יחידות דיור');
      const allowedSqm = getField(zoning, 'מר מגורים');
      const plotNumber = getField(zoning, 'מגרש');

      if (planNumber) result.planNumber = planNumber;
      if (designation) result.zoning = designation;
      if (designationTranslation) result.zoningTranslation = designationTranslation;
      if (typeof allowedUnits === 'number' && allowedUnits > 0) result.allowedUnits = allowedUnits;
      if (typeof allowedSqm === 'number' && allowedSqm > 0) result.allowedResidentialSqm = allowedSqm;
      if (plotNumber) result.plotNumber = plotNumber;
    }
  }

  return result;
}

// ── Step 3: Deals — building info ───────────────────────────

interface DealsNearby {
  polygon_id: string;
  settlementNameHeb: string;
  streetNameHeb: string | null;
  houseNum: number | null;
}

async function queryDeals(x: number, y: number, gush: number, helka: number) {
  const nearby = await fetchJson<DealsNearby[]>(`${DEALS_URL}/${x},${y}/${DEALS_RADIUS}`);
  if (!Array.isArray(nearby) || nearby.length === 0) return null;

  // Find matching polygon
  const exact = nearby.find(d => d.polygon_id === `${gush}-${helka}`);
  const sameGush = nearby.find(d => d.polygon_id.startsWith(`${gush}-`));
  const match = exact ?? sameGush;
  if (!match) return { city: nearby[0].settlementNameHeb };

  const result: Record<string, unknown> = {
    city: match.settlementNameHeb,
  };

  if (match.streetNameHeb) {
    result.address = match.houseNum
      ? `${match.streetNameHeb} ${match.houseNum}`
      : match.streetNameHeb;
  }

  // Only fetch deal details for exact parcel match
  if (!exact) return result;

  const dealsData = await fetchJson<{ data: Record<string, unknown>[]; totalCount: string }>(
    `${STREET_DEALS_URL}/${exact.polygon_id}?limit=${MAX_DEALS}&dealType=2`,
  );

  if (dealsData?.data && Array.isArray(dealsData.data) && dealsData.data.length > 0) {
    const deals: DealRecord[] = dealsData.data.map(d => ({
      floorNo: (d.floorNo as string) ?? null,
      assetArea: typeof d.assetArea === 'number' ? d.assetArea : null,
      assetRoomNum: typeof d.assetRoomNum === 'number' ? d.assetRoomNum : null,
      subParcelNum: typeof d.subParcelNum === 'number' ? d.subParcelNum : null,
      propertyTypeDescription: (d.propertyTypeDescription as string) ?? null,
    }));

    const analysis = analyzeDeals(deals);
    if (analysis.existingFloors !== null) result.existingFloors = analysis.existingFloors;
    if (analysis.existingUnits !== null) result.existingUnits = analysis.existingUnits;
    if (analysis.avgUnitSize !== null) result.avgUnitSize = analysis.avgUnitSize;
    if (analysis.estimatedBuiltArea !== null) result.estimatedBuiltArea = analysis.estimatedBuiltArea;
  }

  return result;
}

// ── Route handler ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  const gushStr = req.nextUrl.searchParams.get('gush');
  const helkaStr = req.nextUrl.searchParams.get('helka');

  if (!gushStr || !helkaStr) {
    return NextResponse.json({ error: 'Missing gush or helka parameter' }, { status: 400 });
  }

  const gush = parseInt(gushStr);
  const helka = parseInt(helkaStr);

  if (isNaN(gush) || isNaN(helka) || gush <= 0 || helka <= 0) {
    return NextResponse.json({ error: 'Invalid gush or helka' }, { status: 400 });
  }

  try {
    // Step 1: Validate parcel + get coordinates
    const point = await findParcel(gush, helka);
    if (!point) {
      return NextResponse.json({ found: false, gush, helka, error: 'חלקה לא נמצאה' });
    }

    // Step 2: Layer data (area, ownership, zoning) — runs in parallel with Step 3
    const [layerData, dealsData] = await Promise.all([
      queryLayers(point.x, point.y),
      queryDeals(point.x, point.y, gush, helka),
    ]);

    return NextResponse.json({
      found: true,
      gush,
      helka,
      ...layerData,
      ...dealsData,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to lookup parcel', detail: String(err) },
      { status: 500 },
    );
  }
}
