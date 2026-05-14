import { NextResponse } from 'next/server';
import { getChart } from '@/lib/stocks/yahoo';
import type { ChartRange } from '@/lib/stocks/types';

export const dynamic = 'force-dynamic';

const VALID_RANGES: ChartRange[] = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y', 'max'];

function parseRange(value: string | null): ChartRange {
  if (value && (VALID_RANGES as string[]).includes(value)) return value as ChartRange;
  return '1mo';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim();
  const range = parseRange(searchParams.get('range'));
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  try {
    const chart = await getChart(symbol.toUpperCase(), range);
    return NextResponse.json(chart);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chart failed' },
      { status: 502 },
    );
  }
}
