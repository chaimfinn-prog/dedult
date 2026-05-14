'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Newspaper, Languages, Loader2, AlertCircle } from 'lucide-react';
import type { NewsResponse } from '@/lib/stocks/types';
import { formatDateHe } from '@/lib/stocks/format';

export function NewsList({ symbol }: { symbol: string }) {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const lang = showOriginal ? 'en' : 'he';
    fetch(`/api/stocks/news?symbol=${encodeURIComponent(symbol)}&lang=${lang}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as NewsResponse;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'שגיאה');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, showOriginal]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[var(--accent-light)]" />
          <h2 className="text-sm font-semibold tracking-wide text-foreground-muted uppercase">
            חדשות
          </h2>
        </div>
        {data && data.translationAvailable && (
          <button
            onClick={() => setShowOriginal((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            {showOriginal ? 'הצג בעברית' : 'הצג מקור באנגלית'}
          </button>
        )}
      </div>

      {data && !data.translationAvailable && !showOriginal && (
        <div className="db-card-gold p-3 flex items-start gap-2 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 text-[var(--gold-light)] shrink-0" />
          <div>
            תרגום אוטומטי לעברית כבוי. הגדר את משתנה הסביבה{' '}
            <code className="font-mono">ANTHROPIC_API_KEY</code> בשרת כדי לקבל סיכומי כתבות בעברית.
            בינתיים הכתבות מוצגות באנגלית.
          </div>
        </div>
      )}

      {loading && (
        <div className="db-card p-6 flex items-center justify-center gap-2 text-sm text-foreground-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          {showOriginal ? 'טוען חדשות…' : 'מתרגם ומסכם חדשות לעברית…'}
        </div>
      )}

      {error && !loading && (
        <div className="db-card p-4 text-sm text-[#FF7B72]">שגיאה: {error}</div>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <div className="db-card p-6 text-sm text-foreground-muted text-center">
          לא נמצאו כתבות חדשות עבור הסימול הזה.
        </div>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((item) => {
            const title = !showOriginal && item.titleHe ? item.titleHe : item.title;
            const summary = !showOriginal && item.summaryHe ? item.summaryHe : item.summary;
            return (
              <a
                key={item.uuid}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="db-card p-4 block group"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-[var(--accent-light)] transition-colors">
                    {title}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-foreground-muted shrink-0 mt-1" />
                </div>
                {summary && (
                  <p className="mt-2 text-sm text-foreground-secondary leading-relaxed">
                    {summary}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                  {item.publisher && <span>{item.publisher}</span>}
                  {item.providerPublishTime && (
                    <>
                      <span>·</span>
                      <span>{formatDateHe(item.providerPublishTime)}</span>
                    </>
                  )}
                  {!showOriginal && item.translated && (
                    <>
                      <span>·</span>
                      <span className="badge badge-accent !py-0 !px-1.5">תורגם בעברית</span>
                    </>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
