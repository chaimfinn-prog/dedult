'use client';

import Link from 'next/link';
import { LineChart, Home } from 'lucide-react';

export function StocksNav() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/60 backdrop-blur sticky top-0 z-30">
      <div className="container-app flex items-center justify-between h-14">
        <Link href="/stocks" className="flex items-center gap-2 font-bold">
          <LineChart className="w-5 h-5 text-[var(--accent-light)]" />
          <span>מניות · Stocks</span>
        </Link>
        <nav className="flex items-center gap-4 text-xs text-foreground-muted">
          <Link href="/stocks" className="hover:text-foreground transition-colors">דשבורד</Link>
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            עמוד הבית
          </Link>
        </nav>
      </div>
    </header>
  );
}
