'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import type { SearchResult } from '@/lib/stocks/types';

export function SymbolSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q.trim())}`);
        const data = (await res.json()) as { results?: SearchResult[] };
        if (id !== reqId.current) return;
        setResults(data.results ?? []);
        setHighlight(0);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (symbol: string) => {
    setOpen(false);
    setQ('');
    router.push(`/stocks/${encodeURIComponent(symbol)}`);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = results[highlight];
      if (pick) go(pick.symbol);
      else if (q.trim()) go(q.trim().toUpperCase());
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="db-card flex items-center gap-2 px-4 h-12 focus-within:border-[var(--accent)]">
        <Search className="w-4 h-4 text-foreground-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="חפש סימול או שם חברה (AAPL, Tesla, מיקרוסופט)"
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder-[var(--fg-dim)]"
          autoFocus={autoFocus}
          dir="auto"
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />}
      </div>
      {open && (results.length > 0 || (q.trim() && !loading)) && (
        <div className="absolute top-full mt-2 left-0 right-0 db-card overflow-hidden z-40 max-h-80 overflow-y-auto">
          {results.length === 0 && q.trim() && !loading && (
            <button
              onClick={() => go(q.trim().toUpperCase())}
              className="w-full text-right px-4 py-3 hover:bg-[var(--bg-card-hover)] text-sm"
            >
              <span className="text-foreground-muted">נסה ישירות:</span>{' '}
              <span className="font-mono font-semibold">{q.trim().toUpperCase()}</span>
            </button>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.symbol}-${i}`}
              onClick={() => go(r.symbol)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-right px-4 py-3 flex items-center justify-between gap-3 text-sm transition-colors ${
                i === highlight ? 'bg-[var(--bg-card-hover)]' : 'hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <div className="flex flex-col items-end min-w-0 flex-1">
                <span className="font-mono font-semibold text-foreground">{r.symbol}</span>
                <span className="text-xs text-foreground-muted truncate max-w-full">
                  {r.longname || r.shortname}
                </span>
              </div>
              <div className="flex flex-col items-start text-xs text-foreground-muted shrink-0">
                <span>{r.exchDisp || r.exchange}</span>
                <span>{r.typeDisp || r.quoteType}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
