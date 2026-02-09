import { NextRequest, NextResponse } from 'next/server';

// data.gov.il urban renewal declared complexes dataset
const RESOURCE_ID = 'f65a0daf-f737-49c5-9424-d378d52104f5';
const API_URL = 'https://data.gov.il/api/3/action/datastore_search';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const city = req.nextUrl.searchParams.get('city') ?? '';

  if (!q && !city) {
    return NextResponse.json({ error: 'Missing query parameter (q or city)' }, { status: 400 });
  }

  try {
    let url: string;

    if (q) {
      // Full text search across all fields
      url = `${API_URL}?resource_id=${RESOURCE_ID}&q=${encodeURIComponent(q)}&limit=50`;
    } else {
      // Filter by city name
      const filters = JSON.stringify({ Yeshuv: city });
      url = `${API_URL}?resource_id=${RESOURCE_ID}&filters=${encodeURIComponent(filters)}&limit=50`;
    }

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'API request failed', status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const records = data?.result?.records ?? [];
    const total = data?.result?.total ?? 0;

    const mapped = records.map((r: Record<string, string | number>) => ({
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
    }));

    return NextResponse.json({ records: mapped, total });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch planning data', detail: String(err) }, { status: 500 });
  }
}
