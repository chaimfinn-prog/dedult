'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, X, TrendingUp, TrendingDown } from 'lucide-react';
import type { Favorite, Quote } from '@/lib/stocks/types';
import { listFavorites, removeFavorite } from '@/lib/stocks/favorites';
import { formatPrice, formatPercent } from '@/lib/stocks/format';

type Row = { fav: Favorite; quote?: Quote; error?: boolean };

export function FavoritesGrid() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const favs = await listFavorites();
      if (cancelled) return;
      setRows(favs.map((fav) => ({ fav })));
      const results = await Promise.all(
        favs.map(async (fav) => {
          try {
            const res = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(fav.symbol)}`);
            if (!res.ok) return { fav, error: true } as Row;
            const quote = (await res.json()) as Quote;
            return { fav, quote } as Row;
          } catch {
            return { fav, error: true } as Row;
          }
        }),
      );
      if (!cancelled) setRows(results);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null) {
    return <div className="text-sm text-foreground-muted">טוען מועדפים…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="db-card p-6 text-center">
        <Star className="w-6 h-6 text-foreground-muted mx-auto mb-2" />
        <p className="text-sm text-foreground-muted">
          אין מועדפים עדיין. חפש מניה ולחץ על הכוכב כדי להוסיף.
        </p>
      </div>
    );
  }

  const onRemove = async (symbol: string) => {
    await removeFavorite(symbol);
    setRows((prev) => (prev ?? []).filter((r) => r.fav.symbol !== symbol));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map(({ fav, quote, error }) => {
        const up = (quote?.change ?? 0) >= 0;
        return (
          <div key={fav.symbol} className="db-card p-4 group relative">
            <button
              onClick={() => onRemove(fav.symbol)}
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-muted hover:text-[var(--red)]"
              aria-label="הסר ממועדפים"
            >
              <X className="w-4 h-4" />
            </button>
            <Link href={`/stocks/${encodeURIComponent(fav.symbol)}`} className="block">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono font-bold text-base">{fav.symbol}</div>
                  <div className="text-xs text-foreground-muted truncate">{fav.name}</div>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="price text-xl font-semibold">
                  {quote ? formatPrice(quote.regularMarketPrice, quote.currency) : error ? '—' : '…'}
                </div>
                {quote && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      up ? 'text-[var(--green-light)]' : 'text-[#FF7B72]'
                    }`}
                  >
                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="price">{formatPercent(quote.changePercent)}</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
