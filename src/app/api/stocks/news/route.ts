import { NextResponse } from 'next/server';
import { getNews } from '@/lib/stocks/yahoo';
import { hasTranslationKey, translateNewsItems } from '@/lib/stocks/translate';
import type { NewsResponse } from '@/lib/stocks/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim();
  const lang = (searchParams.get('lang') === 'en' ? 'en' : 'he') as 'he' | 'en';
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  try {
    const raw = await getNews(symbol.toUpperCase());
    const items = lang === 'he' ? await translateNewsItems(raw) : raw;
    const body: NewsResponse = {
      symbol: symbol.toUpperCase(),
      lang,
      translationAvailable: hasTranslationKey(),
      items,
    };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'News failed' },
      { status: 502 },
    );
  }
}
