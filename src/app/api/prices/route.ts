import { NextRequest, NextResponse } from 'next/server';

const RESOURCE_ID = '7c8255d0-49ef-49db-8904-4cf917586031';
const API_URL = 'https://data.gov.il/api/3/action/datastore_search';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const limit = req.nextUrl.searchParams.get('limit') ?? '30';

  try {
    const url = `${API_URL}?resource_id=${RESOURCE_ID}&q=${encodeURIComponent(q)}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'API request failed', status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const records = data?.result?.records ?? [];
    const total = data?.result?.total ?? 0;

    const mapped = records.map((r: Record<string, unknown>) => ({
      id: r._id,
      city: r.LamasName ?? '',
      neighborhood: r.Neighborhood ?? '',
      project: r.ProjectName ?? '',
      developer: r.ProviderName ?? '',
      pricePerSqm: r.PriceForMeter ?? '',
      units: r.LotteryHousingUnits ?? 0,
      status: r.ProjectStatus ?? '',
      date: r.LotteryExecutionDate ?? '',
    }));

    return NextResponse.json({ records: mapped, total });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch data', detail: String(err) }, { status: 500 });
  }
}
