'use client';

import { useEffect, useState } from 'react';
import { Star, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import type { Quote } from '@/lib/stocks/types';
import { addFavorite, isFavorite, removeFavorite } from '@/lib/stocks/favorites';
import { formatChange, formatPercent, formatPrice } from '@/lib/stocks/format';

export function QuoteHeader({ quote }: { quote: Quote }) {
  const [fav, setFav] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const up = quote.change >= 0;

  useEffect(() => {
    isFavorite(quote.symbol).then(setFav).catch(() => setFav(false));
  }, [quote.symbol]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (fav) {
        await removeFavorite(quote.symbol);
        setFav(false);
      } else {
        await addFavorite({
          symbol: quote.symbol,
          name: quote.longName || quote.shortName || quote.symbol,
          addedAt: Date.now(),
        });
        setFav(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="db-card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold font-mono">{quote.symbol}</h1>
            <span className="text-sm text-foreground-muted truncate">
              {quote.longName || quote.shortName || ''}
            </span>
          </div>
          <div className="mt-1 text-xs text-foreground-muted flex items-center gap-2 flex-wrap">
            {quote.exchangeName && <span>{quote.exchangeName}</span>}
            {quote.instrumentType && <span>· {quote.instrumentType}</span>}
            {quote.marketState && <span>· {quote.marketState}</span>}
            <span>· {quote.currency}</span>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={fav === null || busy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors ${
            fav
              ? 'border-[var(--gold)]/50 bg-[rgba(210,153,34,0.1)] text-[var(--gold-light)]'
              : 'border-[var(--border)] text-foreground-muted hover:text-foreground'
          }`}
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Star className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} />
          )}
          {fav ? 'במועדפים' : 'הוסף למועדפים'}
        </button>
      </div>

      <div className="mt-6 flex items-end gap-4 flex-wrap">
        <div className="price text-4xl md:text-5xl font-bold tracking-tight">
          {formatPrice(quote.regularMarketPrice, quote.currency)}
        </div>
        <div
          className={`flex items-center gap-2 text-base font-semibold ${
            up ? 'text-[var(--green-light)]' : 'text-[#FF7B72]'
          }`}
        >
          {up ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          <span className="price">{formatChange(quote.change)}</span>
          <span className="price">({formatPercent(quote.changePercent)})</span>
        </div>
      </div>
    </div>
  );
}
