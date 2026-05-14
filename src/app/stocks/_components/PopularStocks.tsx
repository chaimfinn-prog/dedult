'use client';

import Link from 'next/link';

const POPULAR = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'BRK-B', name: 'Berkshire' },
  { symbol: 'TEVA', name: 'טבע' },
  { symbol: 'NICE', name: 'NICE' },
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'Nasdaq' },
];

export function PopularStocks() {
  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR.map((p) => (
        <Link
          key={p.symbol}
          href={`/stocks/${encodeURIComponent(p.symbol)}`}
          className="badge badge-accent hover:!bg-[rgba(91,141,238,0.2)]"
        >
          <span className="font-mono">{p.symbol}</span>
          <span className="text-foreground-muted">·</span>
          <span>{p.name}</span>
        </Link>
      ))}
    </div>
  );
}
