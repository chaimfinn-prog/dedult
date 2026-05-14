import type {
  ChartRange,
  ChartResponse,
  NewsItem,
  Quote,
  SearchResult,
} from './types';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function yfetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'User-Agent': UA,
      Accept: 'application/json,text/xml,*/*',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Yahoo request failed: ${res.status} ${res.statusText}`);
  }
  return res;
}

const RANGE_TO_INTERVAL: Record<ChartRange, string> = {
  '1d': '5m',
  '5d': '15m',
  '1mo': '1d',
  '3mo': '1d',
  '6mo': '1d',
  '1y': '1d',
  '5y': '1wk',
  max: '1mo',
};

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query,
  )}&quotesCount=10&newsCount=0&enableFuzzyQuery=true`;
  const res = await yfetch(url);
  const json = (await res.json()) as {
    quotes?: Array<{
      symbol?: string;
      shortname?: string;
      longname?: string;
      exchange?: string;
      exchDisp?: string;
      quoteType?: string;
      typeDisp?: string;
    }>;
  };
  return (json.quotes ?? [])
    .filter((q) => typeof q.symbol === 'string' && q.symbol.length > 0)
    .map((q) => ({
      symbol: q.symbol as string,
      shortname: q.shortname,
      longname: q.longname,
      exchange: q.exchange,
      exchDisp: q.exchDisp,
      quoteType: q.quoteType,
      typeDisp: q.typeDisp,
    }));
}

type YahooChart = {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        exchangeName?: string;
        instrumentType?: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        previousClose?: number;
        regularMarketTime?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        marketState?: string;
        shortName?: string;
        longName?: string;
      };
      timestamp?: number[];
      indicators: {
        quote: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error: unknown;
  };
};

async function fetchChart(
  symbol: string,
  range: ChartRange,
  interval: string,
): Promise<YahooChart['chart']['result'][number]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${range}&interval=${interval}&includePrePost=false`;
  const res = await yfetch(url);
  const json = (await res.json()) as YahooChart;
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);
  return result;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const result = await fetchChart(symbol, '1d', '5m');
  const meta = result.meta;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? 0;
  const price = meta.regularMarketPrice;
  const change = price - prev;
  const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
  return {
    symbol: meta.symbol,
    shortName: meta.shortName,
    longName: meta.longName,
    currency: meta.currency,
    exchangeName: meta.exchangeName,
    instrumentType: meta.instrumentType,
    regularMarketPrice: price,
    previousClose: prev,
    change,
    changePercent,
    regularMarketTime: meta.regularMarketTime,
    marketState: meta.marketState,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    regularMarketVolume: meta.regularMarketVolume,
  };
}

export async function getChart(
  symbol: string,
  range: ChartRange,
): Promise<ChartResponse> {
  const interval = RANGE_TO_INTERVAL[range];
  const result = await fetchChart(symbol, range, interval);
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators.quote?.[0]?.close ?? [];
  const points = timestamps
    .map((t, i) => ({ t: t * 1000, c: closes[i] }))
    .filter((p): p is { t: number; c: number } => typeof p.c === 'number');
  return {
    symbol: result.meta.symbol,
    range,
    interval,
    currency: result.meta.currency,
    points,
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractCData(node: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(node);
  if (!m) return undefined;
  const inner = m[1].trim();
  const cdata = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(inner);
  return (cdata ? cdata[1] : inner).trim();
}

export async function getNews(symbol: string): Promise<NewsItem[]> {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(
    symbol,
  )}&region=US&lang=en-US`;
  const res = await yfetch(url);
  const xml = await res.text();
  const items: NewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = itemRe.exec(xml)) !== null) {
    const node = m[1];
    const title = extractCData(node, 'title');
    const link = extractCData(node, 'link');
    const description = extractCData(node, 'description');
    const guid = extractCData(node, 'guid');
    const pubDate = extractCData(node, 'pubDate');
    if (!title || !link) continue;
    items.push({
      uuid: guid ?? `${symbol}-${idx}`,
      title: decodeEntities(title),
      link,
      publisher: 'Yahoo Finance',
      providerPublishTime: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : undefined,
      summary: description ? stripTags(description) : undefined,
      translated: false,
    });
    idx += 1;
    if (items.length >= 15) break;
  }
  return items;
}
