export type SearchResult = {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
  quoteType?: string;
  typeDisp?: string;
};

export type Quote = {
  symbol: string;
  shortName?: string;
  longName?: string;
  currency: string;
  exchangeName?: string;
  instrumentType?: string;
  regularMarketPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  regularMarketTime?: number;
  marketState?: string;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketVolume?: number;
};

export type ChartRange =
  | '1d'
  | '5d'
  | '1mo'
  | '3mo'
  | '6mo'
  | '1y'
  | '5y'
  | 'max';

export type ChartPoint = {
  t: number;
  c: number;
};

export type ChartResponse = {
  symbol: string;
  range: ChartRange;
  interval: string;
  currency: string;
  points: ChartPoint[];
};

export type NewsItem = {
  uuid: string;
  title: string;
  publisher?: string;
  link: string;
  providerPublishTime?: number;
  summary?: string;
  thumbnail?: string;
  titleHe?: string;
  summaryHe?: string;
  translated: boolean;
};

export type NewsResponse = {
  symbol: string;
  lang: 'he' | 'en';
  translationAvailable: boolean;
  items: NewsItem[];
};

export type Favorite = {
  symbol: string;
  name: string;
  addedAt: number;
};
