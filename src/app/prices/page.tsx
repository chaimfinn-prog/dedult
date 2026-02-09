'use client';

import { useState } from 'react';
import {
  Building2, ArrowRight, Search, Loader2, BarChart3,
  TrendingUp, ExternalLink, MapPin,
} from 'lucide-react';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

interface PriceRecord {
  id: number;
  city: string;
  neighborhood: string;
  project: string;
  developer: string;
  pricePerSqm: string;
  units: number;
  status: string;
  date: string;
}

export default function PricesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PriceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(`/api/prices?q=${encodeURIComponent(query.trim())}&limit=30`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.records ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setError('שגיאה בטעינת נתונים. נסה שוב.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Compute stats
  const prices = results
    .map((r) => parseFloat(String(r.pricePerSqm).replace(/,/g, '')))
    .filter((n) => !isNaN(n) && n > 0);

  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
  const minPrice = prices.length > 0 ? Math.round(Math.min(...prices)) : null;
  const maxPrice = prices.length > 0 ? Math.round(Math.max(...prices)) : null;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border)] sticky top-0" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-green" />
            <span className="font-bold text-sm">THE REALITY CHECK</span>
            <span className="text-foreground-muted text-xs">{'| השוואת מחירים'}</span>
          </div>
          <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            {'חזרה'}<ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 flex-1">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{'השוואת מחירים לפי אזור'}</h1>
          <p className="text-sm text-foreground-muted max-w-lg mx-auto">
            {'נתוני מחירים ממאגרי המידע הממשלתיים. חפש לפי עיר, שכונה או שם פרויקט.'}
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="db-card p-2 flex gap-2">
            <div className="flex-1 flex items-center px-4 h-12">
              <Search className="w-4 h-4 text-foreground-muted ml-2" />
              <input
                type="text"
                placeholder="לדוגמה: תל אביב, ירושלים, רמת גן..."
                className="w-full bg-transparent border-none outline-none text-foreground placeholder-[var(--fg-dim)] text-right text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="btn-primary h-12 px-6 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {'חפש'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {results.length > 0 && avgPrice && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="תוצאות" value={total.toLocaleString('he-IL')} icon={<BarChart3 className="w-4 h-4 text-accent" />} />
            <StatCard label='מחיר ממוצע למ"ר' value={`${avgPrice?.toLocaleString('he-IL')} \u20AA`} icon={<TrendingUp className="w-4 h-4 text-green" />} />
            <StatCard label='מינימום למ"ר' value={`${minPrice?.toLocaleString('he-IL')} \u20AA`} icon={<TrendingUp className="w-4 h-4 text-green" />} />
            <StatCard label='מקסימום למ"ר' value={`${maxPrice?.toLocaleString('he-IL')} \u20AA`} icon={<TrendingUp className="w-4 h-4 text-gold" />} />
          </div>
        )}

        {/* Results Table */}
        {loading && (
          <div className="db-card p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-accent" />
            <p className="text-sm text-foreground-muted">{'טוען נתוני מחירים...'}</p>
          </div>
        )}

        {error && (
          <div className="db-card-gold p-5 text-center text-sm text-foreground-muted">
            {error}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="db-card p-8 text-center">
            <MapPin className="w-8 h-8 text-foreground-muted opacity-30 mx-auto mb-3" />
            <p className="text-sm text-foreground-muted">{'לא נמצאו תוצאות. נסה חיפוש אחר.'}</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="db-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-foreground-muted">
                    <th className="text-right p-3 font-medium">{'עיר'}</th>
                    <th className="text-right p-3 font-medium">{'שכונה'}</th>
                    <th className="text-right p-3 font-medium">{'פרויקט'}</th>
                    <th className="text-right p-3 font-medium">{'יזם'}</th>
                    <th className="text-right p-3 font-medium">{'מחיר/מ"ר'}</th>
                    <th className="text-right p-3 font-medium">{'יח"ד'}</th>
                    <th className="text-right p-3 font-medium">{'סטטוס'}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="p-3 font-medium text-foreground">{r.city}</td>
                      <td className="p-3 text-foreground-muted">{r.neighborhood || '\u2014'}</td>
                      <td className="p-3 text-foreground-secondary text-xs">{r.project || '\u2014'}</td>
                      <td className="p-3 text-foreground-muted text-xs">{r.developer || '\u2014'}</td>
                      <td className="p-3 font-semibold price">{r.pricePerSqm || '\u2014'}</td>
                      <td className="p-3 text-foreground-muted price">{r.units || '\u2014'}</td>
                      <td className="p-3">
                        {r.status && <span className="badge badge-accent text-[10px]">{r.status}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* External Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="https://www.nadlan.gov.il" target="_blank" rel="noopener noreferrer" className="db-card p-4 flex items-center gap-3 hover:border-accent/30 transition-all">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-accent" />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{'אתר הנדל"ן הממשלתי'}</div>
              <div className="text-xs text-foreground-muted">{'עסקאות נדל"ן בפועל — רשות המיסים'}</div>
            </div>
          </a>
          <a href="https://www.govmap.gov.il" target="_blank" rel="noopener noreferrer" className="db-card p-4 flex items-center gap-3 hover:border-green/30 transition-all">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green" />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">GovMap</div>
              <div className="text-xs text-foreground-muted">{'מפות תכנון, גוש/חלקה ותב"ע'}</div>
            </div>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{'נתונים: data.gov.il — מידע ציבורי פתוח'}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="db-stat p-4 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <div className="db-stat-label text-[10px]">{label}</div>
      <div className="db-stat-value text-base">{value}</div>
    </div>
  );
}
