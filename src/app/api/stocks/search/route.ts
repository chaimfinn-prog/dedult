import { NextResponse } from 'next/server';
import { searchSymbols } from '@/lib/stocks/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ results: [] });
  try {
    const results = await searchSymbols(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { results: [], error: err instanceof Error ? err.message : 'Search failed' },
      { status: 502 },
    );
  }
}
