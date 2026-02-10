import { NextRequest, NextResponse } from 'next/server';

// data.gov.il urban renewal declared complexes dataset
const RESOURCE_ID = 'f65a0daf-f737-49c5-9424-d378d52104f5';
const API_URL = 'https://data.gov.il/api/3/action/datastore_search';

// Common Israeli city names for address parsing
const CITY_NAMES = [
  'תל אביב-יפו', 'תל אביב יפו', 'תל-אביב-יפו', 'תל אביב',
  'ירושלים', 'חיפה', 'באר שבע', 'ראשון לציון', 'פתח תקווה', 'פתח תקוה',
  'אשדוד', 'נתניה', 'חולון', 'בני ברק', 'רמת גן', 'בת ים', 'אשקלון',
  'הרצליה', 'כפר סבא', 'רעננה', 'הוד השרון', 'גבעתיים', 'ראש העין',
  'לוד', 'רמלה', 'נהריה', 'עכו', 'קריית אתא', 'קריית ים', 'קריית מוצקין',
  'קריית ביאליק', 'קריית גת', 'נצרת', 'עפולה', 'יבנה', 'אור יהודה',
  'רחובות', 'נס ציונה', 'מודיעין', 'רמת השרון', 'גבעת שמואל', 'יהוד',
  'טבריה', 'צפת', 'דימונה', 'ערד', 'אילת', 'עפולה', 'כרמיאל',
  'גבעת שמואל', 'קריית אונו', 'קריית שמונה', 'מגדל העמק', 'טירת כרמל',
  'נשר', 'קריית מלאכי', 'אופקים', 'שדרות', 'נתיבות',
];

function parseAddress(address: string): { street: string; city: string } {
  let street = address.trim();
  let city = '';

  // Sort city names by length (longest first) to match "תל אביב-יפו" before "תל אביב"
  const sortedCities = [...CITY_NAMES].sort((a, b) => b.length - a.length);

  for (const c of sortedCities) {
    if (street.includes(c)) {
      city = c;
      street = street.replace(c, '').trim();
      break;
    }
  }

  // Strip numbers from street for better search
  street = street.replace(/\d+/g, '').trim();
  // Clean up separators
  street = street.replace(/[,\-–]/g, ' ').replace(/\s+/g, ' ').trim();

  return { street, city };
}

function mapRecord(r: Record<string, string | number>) {
  return {
    id: r._id,
    complexNumber: r.MisparMitham ?? '',
    city: typeof r.Yeshuv === 'string' ? r.Yeshuv.trim() : '',
    complexName: typeof r.ShemMitcham === 'string' ? r.ShemMitcham.trim() : '',
    existingUnits: r.YachadKayam ?? 0,
    addedUnits: r.YachadTosafti ?? 0,
    proposedUnits: r.YachadMutza ?? 0,
    declarationDate: r.TaarichHachraza ?? '',
    planNumber: typeof r.MisparTochnit === 'string' ? r.MisparTochnit.trim() : '',
    mavatLink: typeof r.KishurLatar === 'string' ? r.KishurLatar.trim() : '',
    govmapLink: typeof r.KishurLaMapa === 'string' ? r.KishurLaMapa.trim() : '',
    totalPermits: r.SachHeterim ?? 0,
    track: typeof r.Maslul === 'string' ? r.Maslul.trim() : '',
    approvalYear: r.ShnatMatanTokef ?? '',
    inExecution: typeof r.Bebitzua === 'string' ? r.Bebitzua.trim() : '',
    status: typeof r.Status === 'string' ? r.Status.trim() : '',
  };
}

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

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const city = req.nextUrl.searchParams.get('city') ?? '';
  const street = req.nextUrl.searchParams.get('street') ?? '';

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
        const url = `${API_URL}?resource_id=${RESOURCE_ID}&filters=${encodeURIComponent(JSON.stringify({ Yeshuv: city }))}&q=${encodeURIComponent(cleanStreet)}&limit=50`;
        addUnique(results, await fetchRecords(url), seen);
      }
      // Also try city-only if no results from street+city
      if (results.length === 0) {
        const url = `${API_URL}?resource_id=${RESOURCE_ID}&filters=${encodeURIComponent(JSON.stringify({ Yeshuv: city }))}&limit=50`;
        addUnique(results, await fetchRecords(url), seen);
      }
    }

    // Strategy 2: Parse combined query string
    if (q) {
      const parsed = parseAddress(q);

      // 2a: If city detected, filter by city + search street
      if (parsed.city && parsed.street) {
        const url = `${API_URL}?resource_id=${RESOURCE_ID}&filters=${encodeURIComponent(JSON.stringify({ Yeshuv: parsed.city }))}&q=${encodeURIComponent(parsed.street)}&limit=50`;
        addUnique(results, await fetchRecords(url), seen);
      }

      // 2b: Just city filter if city detected
      if (parsed.city && results.length === 0) {
        const url = `${API_URL}?resource_id=${RESOURCE_ID}&filters=${encodeURIComponent(JSON.stringify({ Yeshuv: parsed.city }))}&limit=50`;
        addUnique(results, await fetchRecords(url), seen);
      }

      // 2c: Search just the street name (strip numbers)
      if (parsed.street && results.length === 0) {
        const url = `${API_URL}?resource_id=${RESOURCE_ID}&q=${encodeURIComponent(parsed.street)}&limit=50`;
        addUnique(results, await fetchRecords(url), seen);
      }

      // 2d: Full text search as final fallback
      if (results.length === 0) {
        // Strip numbers from query for better matching
        const cleanQ = q.replace(/\d+/g, '').trim();
        if (cleanQ) {
          const url = `${API_URL}?resource_id=${RESOURCE_ID}&q=${encodeURIComponent(cleanQ)}&limit=50`;
          addUnique(results, await fetchRecords(url), seen);
        }
      }
    }

    // Strategy 3: City-only search
    if (city && results.length === 0) {
      const url = `${API_URL}?resource_id=${RESOURCE_ID}&filters=${encodeURIComponent(JSON.stringify({ Yeshuv: city }))}&limit=50`;
      addUnique(results, await fetchRecords(url), seen);
    }

    const mapped = results.map(mapRecord);
    return NextResponse.json({ records: mapped, total: mapped.length });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch planning data', detail: String(err) }, { status: 500 });
  }
}
