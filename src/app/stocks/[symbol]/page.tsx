import { AlertCircle } from 'lucide-react';
import { getQuote } from '@/lib/stocks/yahoo';
import type { Quote } from '@/lib/stocks/types';
import { StocksNav } from '../_components/StocksNav';
import { SymbolSearch } from '../_components/SymbolSearch';
import { QuoteHeader } from '../_components/QuoteHeader';
import { PriceChart } from '../_components/PriceChart';
import { StatsGrid } from '../_components/StatsGrid';
import { NewsList } from '../_components/NewsList';

export const dynamic = 'force-dynamic';

type Params = { symbol: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol).toUpperCase();
  return {
    title: `${sym} · מניות`,
    description: `מחיר, גרף וחדשות בעברית עבור ${sym}`,
  };
}

export default async function StockDetailPage({ params }: { params: Promise<Params> }) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol).toUpperCase();

  let quote: Quote | null = null;
  let quoteError: string | null = null;
  try {
    quote = await getQuote(sym);
  } catch (err) {
    quoteError = err instanceof Error ? err.message : 'שגיאה לא ידועה';
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StocksNav />
      <main className="container-app py-6 space-y-6">
        <SymbolSearch />
        {quote ? (
          <QuoteHeader quote={quote} />
        ) : (
          <div className="db-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-[#FF7B72]" />
              <h1 className="text-2xl font-bold font-mono">{sym}</h1>
            </div>
            <p className="text-sm text-foreground-muted">
              לא הצלחנו לטעון נתוני מחיר לסימול הזה כרגע. ייתכן שהסימול שגוי, שאין נתונים זמינים,
              או שיש בעיה זמנית בשירות החדשות הפיננסי.
            </p>
            {quoteError && (
              <p className="mt-2 text-xs text-foreground-muted font-mono">{quoteError}</p>
            )}
          </div>
        )}
        <PriceChart symbol={sym} />
        {quote && <StatsGrid quote={quote} />}
        <NewsList symbol={sym} />
      </main>
    </div>
  );
}
