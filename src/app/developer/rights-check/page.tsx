'use client';

/**
 * /developer/rights-check — mirrors /developer-portal/rights-calculator
 *
 * The statutory rights engine UI is complex (2800+ lines).
 * We import the existing component rather than duplicating it.
 * Navigation differences: back link goes to /developer instead of /developer-portal.
 */

import { useState, useCallback } from 'react';
import { Building2, Globe, ChevronLeft, Loader2, Ruler } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import PropertySearchBar, { type SearchParams } from '@/components/shared/PropertySearchBar';
import StatutoryEnginePanel from '@/components/shared/StatutoryEnginePanel';
import RedFlagsMatrix from '@/components/shared/RedFlagsMatrix';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80';

interface RightsResult {
  spatial_profile?: Record<string, unknown>;
  freeze_status?: Record<string, unknown>;
  alternatives?: Record<string, unknown>[];
  red_flags?: { code: string; severity: string; message: string; source: string }[];
  [key: string]: unknown;
}

export default function RightsCheckPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RightsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');

  const handleSearch = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchCity(params.city || params.raw);

    try {
      const res = await fetch('/api/rights-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: params.city || params.raw,
          gush: params.gush,
          helka: params.helka,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError(t('שגיאה בחיבור למנוע זכויות', 'Error connecting to rights engine'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col relative bg-orbs">
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
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 no-underline text-inherit hover:opacity-80 transition-opacity">
              <Building2 className="w-4 h-4 text-green" />
              <span className="font-bold text-sm">PROPCHECK</span>
            </a>
            <span className="text-foreground-muted text-xs">{t('| בדיקת זכויות', '| Rights Check')}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/developer/economic-report" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
              {t('דוח כלכלי', 'Economic Report')}
            </a>
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/developer" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ChevronLeft className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>
              <Ruler className="w-7 h-7" style={{ color: '#a78bfa' }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t('בדיקת זכויות בנייה', 'Building Rights Check')}
            </h1>
            <p className="text-foreground-muted text-sm max-w-lg mx-auto">
              {t('הזינו כתובת, גוש/חלקה או שם עיר להפעלת המנוע הסטטוטורי', 'Enter address, gush/helka or city name to run the statutory engine')}
            </p>
          </div>

          <div className="max-w-xl mx-auto mb-10">
            <PropertySearchBar onSearch={handleSearch} />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-foreground-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('מריץ מנוע סטטוטורי...', 'Running statutory engine...')}
            </div>
          )}

          {error && (
            <div className="max-w-xl mx-auto p-4 rounded-xl" style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)' }}>
              <p className="text-sm" style={{ color: '#f85149' }}>{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Spatial Profile */}
              {result.spatial_profile && (
                <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{t('פרופיל מרחבי', 'Spatial Profile')}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(result.spatial_profile).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-foreground-muted">{k}</span>
                        <span className="text-foreground">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {result.red_flags && result.red_flags.length > 0 && (
                <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{t('דגלים אדומים', 'Red Flags')}</h3>
                  <div className="space-y-2">
                    {result.red_flags.map((flag, i) => (
                      <div key={i} className="p-3 rounded-lg text-xs" style={{
                        background: flag.severity === 'HARD_BLOCK' ? 'rgba(248,81,73,0.1)' :
                                   flag.severity === 'STRONG_RISK' ? 'rgba(210,153,34,0.1)' : 'rgba(91,141,238,0.08)',
                        border: `1px solid ${flag.severity === 'HARD_BLOCK' ? 'rgba(248,81,73,0.2)' :
                                 flag.severity === 'STRONG_RISK' ? 'rgba(210,153,34,0.2)' : 'rgba(91,141,238,0.15)'}`,
                      }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold" style={{
                            color: flag.severity === 'HARD_BLOCK' ? '#f85149' :
                                   flag.severity === 'STRONG_RISK' ? '#d29922' : '#5b8dee',
                          }}>{flag.severity}</span>
                          <span className="text-foreground-muted">({flag.code})</span>
                        </div>
                        <p className="text-foreground-muted">{flag.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue to Economic Report */}
              <div className="text-center pt-4">
                <a
                  href={`/developer/economic-report?city=${encodeURIComponent(searchCity)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold no-underline transition-all hover:scale-[1.02]"
                  style={{ background: '#22c55e', color: '#fff' }}
                >
                  {t('המשך לדוח כלכלי →', 'Continue to Economic Report →')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
