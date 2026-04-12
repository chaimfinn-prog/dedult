import { NextRequest, NextResponse } from 'next/server';
import {
  canonicalCity,
  parseAddress,
  extractNeighborhood,
  mapPlanningRecord,
  NEIGHBORHOOD_PREFIXES,
} from '@/lib/planning/address';

// data.gov.il urban renewal declared complexes dataset
const RESOURCE_ID = 'f65a0daf-f737-49c5-9424-d378d52104f5';
const API_URL = 'https://data.gov.il/api/3/action/datastore_search';

async function fetchRecords(url: string): Promise<Record<string, string | number>[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.result?.records ?? [];
  } catch {
    return [];
  }
}

function addUnique(results: Record<string, string | number>[], newRecords: Record<string, string | number>[], seen: Set<number>) {
  for (const r of newRecords) {
    const id = r._id as number;
    if (!seen.has(id)) {
      seen.add(id);
      results.push(r);
    }
  }
}

function buildCityFilterUrl(city: string, searchTerm?: string, limit = 50): string {
  const filters = encodeURIComponent(JSON.stringify({ Yeshuv: city }));
  const base = `${API_URL}?resource_id=${RESOURCE_ID}&filters=${filters}&limit=${limit}`;
  return searchTerm ? `${base}&q=${encodeURIComponent(searchTerm)}` : base;
}

function buildSearchUrl(searchTerm: string, limit = 50): string {
  return `${API_URL}?resource_id=${RESOURCE_ID}&q=${encodeURIComponent(searchTerm)}&limit=${limit}`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const cityRaw = req.nextUrl.searchParams.get('city') ?? '';
  const street = req.nextUrl.searchParams.get('street') ?? '';

  const city = cityRaw ? canonicalCity(cityRaw) : '';

  if (!q && !city && !street) {
    return NextResponse.json({ error: 'Missing query parameter (q, city, or street)' }, { status: 400 });
  }

  try {
    const results: Record<string, string | number>[] = [];
    const seen = new Set<number>();

    // Strategy 1: If street + city provided as separate params
    if (street && city) {
      const cleanStreet = street.replace(/\d+/g, '').trim();
      if (cleanStreet) {
        addUnique(results, await fetchRecords(buildCityFilterUrl(city, cleanStreet)), seen);
      }

      if (results.length === 0) {
        const streetWords = cleanStreet.split(/\s+/).filter(w => w.length > 2);
        for (const word of streetWords) {
          addUnique(results, await fetchRecords(buildCityFilterUrl(city, word, 30)), seen);
          if (results.length > 0) break;
        }
      }

      if (results.length === 0) {
        addUnique(results, await fetchRecords(buildCityFilterUrl(city)), seen);
      }
    }

    // Strategy 2: Parse combined query string
    if (q) {
      const parsed = parseAddress(q);

      if (parsed.city && parsed.street) {
        addUnique(results, await fetchRecords(buildCityFilterUrl(parsed.city, parsed.street)), seen);
      }

      if (results.length === 0 && parsed.street) {
        const hood = extractNeighborhood(parsed.street);
        if (hood && parsed.city) {
          addUnique(results, await fetchRecords(buildCityFilterUrl(parsed.city, hood)), seen);
        }
      }

      if (results.length === 0 && parsed.city && parsed.words.length > 0) {
        for (const word of parsed.words) {
          if (word.length < 3) continue;
          addUnique(results, await fetchRecords(buildCityFilterUrl(parsed.city, word, 30)), seen);
          if (results.length > 0) break;
        }
      }

      if (parsed.city && results.length === 0) {
        addUnique(results, await fetchRecords(buildCityFilterUrl(parsed.city)), seen);
      }

      if (parsed.street && results.length === 0) {
        addUnique(results, await fetchRecords(buildSearchUrl(parsed.street)), seen);
      }

      if (results.length === 0 && parsed.words.length > 0) {
        for (const word of parsed.words) {
          if (word.length < 3) continue;
          addUnique(results, await fetchRecords(buildSearchUrl(word, 30)), seen);
          if (results.length > 0) break;
        }
      }

      if (results.length === 0) {
        const cleanQ = q.replace(/\d+/g, '').trim();
        if (cleanQ) {
          addUnique(results, await fetchRecords(buildSearchUrl(cleanQ)), seen);
        }
      }
    }

    // Strategy 3: City-only search
    if (city && results.length === 0) {
      addUnique(results, await fetchRecords(buildCityFilterUrl(city)), seen);
    }

    const mapped = results.map(mapPlanningRecord);
    return NextResponse.json({ records: mapped, total: mapped.length });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch planning data', detail: String(err) }, { status: 500 });
  }
}
