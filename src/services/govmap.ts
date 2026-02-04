export interface GovmapAddressResult {
  id: string;
  label: string;
  city?: string;
  street?: string;
  houseNumber?: string;
  x?: number;
  y?: number;
  block?: string;
  parcel?: string;
  areaSqm?: number;
}

export interface GovmapParcelResult {
  block?: string;
  parcel?: string;
  areaSqm?: number;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
}

const GOVMAP_BASE_URL = 'https://api.govmap.gov.il/';

function getGovmapApiKey(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return process.env.NEXT_PUBLIC_GOVMAP_API_KEY;
}

async function govmapRequest<T>(functionName: string, params: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(functionName, GOVMAP_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const headers: HeadersInit = { Accept: 'application/json' };
  const apiKey = getGovmapApiKey();
  if (apiKey) headers['X-API-KEY'] = apiKey;

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`GovMap error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

function parseAddressPayload(payload: Record<string, unknown>, fallbackId: string): GovmapAddressResult {
  const label = normalizeString(payload.label)
    || normalizeString(payload.display_name)
    || normalizeString(payload.address)
    || normalizeString(payload.NAME)
    || normalizeString(payload.name)
    || fallbackId;

  return {
    id: normalizeString(payload.id) || fallbackId,
    label,
    city: normalizeString(payload.city) || normalizeString(payload.יישוב) || normalizeString(payload.SETTLEMENT_NAME),
    street: normalizeString(payload.street) || normalizeString(payload.רחוב),
    houseNumber: normalizeString(payload.houseNumber) || normalizeString(payload['מספר בית']),
    x: typeof payload.x === 'number' ? payload.x : undefined,
    y: typeof payload.y === 'number' ? payload.y : undefined,
    block: normalizeString(payload.block) || normalizeString(payload['גוש']),
    parcel: normalizeString(payload.parcel) || normalizeString(payload['חלקה']),
    areaSqm: typeof payload.areaSqm === 'number' ? payload.areaSqm : undefined,
  };
}

export async function searchGovmapAddress(query: string, city = 'רעננה'): Promise<GovmapAddressResult[]> {
  if (!query.trim()) return [];

  const response = await govmapRequest<Record<string, unknown>>('SearchLocation', {
    query,
    limit: 8,
    includeGeometry: false,
    city,
  });

  const rawResults = (response.results as unknown[]) || (response.data as unknown[]) || [];
  return rawResults.map((item, index) => parseAddressPayload(item as Record<string, unknown>, `${query}-${index}`));
}

export async function fetchParcelByPoint(x: number, y: number): Promise<GovmapParcelResult | null> {
  const response = await govmapRequest<Record<string, unknown>>('GetParcelByPoint', {
    x,
    y,
  });

  const result = (response.result as Record<string, unknown>) || response;
  if (!result) return null;

  return {
    block: normalizeString(result.block) || normalizeString(result['גוש']),
    parcel: normalizeString(result.parcel) || normalizeString(result['חלקה']),
    areaSqm: typeof result.areaSqm === 'number' ? result.areaSqm : undefined,
    geometry: typeof result.geometry === 'object' ? (result.geometry as GovmapParcelResult['geometry']) : undefined,
  };
}

export async function fetchParcelByBlockParcel(block: string, parcel: string): Promise<GovmapParcelResult | null> {
  const response = await govmapRequest<Record<string, unknown>>('GetParcelByBlockParcel', {
    block,
    parcel,
  });

  const result = (response.result as Record<string, unknown>) || response;
  if (!result) return null;

  return {
    block: normalizeString(result.block) || block,
    parcel: normalizeString(result.parcel) || parcel,
    areaSqm: typeof result.areaSqm === 'number' ? result.areaSqm : undefined,
    geometry: typeof result.geometry === 'object' ? (result.geometry as GovmapParcelResult['geometry']) : undefined,
  };
}
