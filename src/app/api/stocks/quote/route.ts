import { NextResponse } from 'next/server';
import { getQuote } from '@/lib/stocks/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim();
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  try {
    const quote = await getQuote(symbol.toUpperCase());
    return NextResponse.json(quote);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Quote failed' },
      { status: 502 },
    );
  }
}
