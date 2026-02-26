'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface PriceDataResponse {
  city: string;
  priceData: {
    national_index: {
      latest_value?: number;
      latest_period?: string;
      yoy_change_pct?: number;
      monthly_change_pct?: number;
      source_label?: string;
      error?: string;
    };
    city_estimate: {
      price_per_sqm: number;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
      source: string;
      disclaimer: string;
    };
  };
}

interface Props {
  city: string;
}

export default function PriceDataWidget({ city }: Props) {
  const { lang } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);
  const [data, setData] = useState<PriceDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/price-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl" style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="animate-pulse flex flex-col gap-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { national_index, city_estimate } = data.priceData;
  const yoy = national_index.yoy_change_pct;
  const isPositive = yoy != null && yoy > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? '#16a34a' : '#dc2626';

  const confidenceBadge = {
    HIGH: { label: t('אמינות גבוהה', 'High confidence'), color: '#16a34a' },
    MEDIUM: { label: t('אמינות בינונית', 'Medium confidence'), color: '#d97706' },
    LOW: { label: t('הערכה בלבד', 'Estimate only'), color: '#dc2626' },
  }[city_estimate.confidence];

  return (
    <div className="p-4 rounded-xl space-y-4" style={{
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
          {t('נתוני מחירים', 'Price Data')}
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(167,139,250,0.15)', color: '#7c3aed' }}>
          {national_index.source_label || t('הלמ"ס', 'CBS')}
        </span>
      </div>

      {/* National Index Trend */}
      {!national_index.error && national_index.latest_value && (
        <div className="flex items-center gap-3 p-3 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.03)' }}>
          <TrendIcon size={20} color={trendColor} />
          <div>
            <div className="text-xs font-medium" style={{ color: '#6b7280' }}>
              {t('מדד מחירים כלל-ארצי', 'National Price Index')}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold" style={{ color: '#1a1a2e' }}>
                {national_index.latest_value}
              </span>
              {yoy != null && (
                <span className="text-sm font-semibold" style={{ color: trendColor }}>
                  {isPositive ? '+' : ''}{yoy}%
                  <span className="text-[10px] font-normal" style={{ color: '#6b7280' }}>
                    {' '}{t('שנתי', 'YoY')}
                  </span>
                </span>
              )}
            </div>
            <div className="text-[10px]" style={{ color: '#9ca3af' }}>
              {national_index.latest_period}
            </div>
          </div>
        </div>
      )}

      {/* City Price Estimate */}
      <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} color={confidenceBadge.color} />
          <span className="text-xs font-semibold" style={{ color: confidenceBadge.color }}>
            {confidenceBadge.label}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>
            {city_estimate.price_per_sqm.toLocaleString('he-IL')}
          </span>
          <span className="text-xs" style={{ color: '#6b7280' }}>
            {t('₪/מ"ר', '₪/sqm')}
          </span>
        </div>

        <div className="text-[10px] leading-relaxed" style={{ color: '#9ca3af' }}>
          {isHe ? city_estimate.disclaimer : city_estimate.source}
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 p-2 rounded-lg"
        style={{ background: 'rgba(167,139,250,0.08)' }}>
        <Info size={12} className="mt-0.5 flex-shrink-0" color="#7c3aed" />
        <span className="text-[10px] leading-relaxed" style={{ color: '#6b7280' }}>
          {t(
            'הערכה בלבד — ממוצע 2024. לנתוני עסקאות מפורטים ←',
            'Estimate only — 2024 average. For detailed transactions →'
          )}
        </span>
      </div>

      {/* Link to nadlan.gov.il */}
      <a
        href="https://www.nadlan.gov.il/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: 'rgba(167,139,250,0.12)',
          color: '#7c3aed',
        }}
      >
        {t('לנתוני עסקאות מפורטים', 'Detailed Transaction Data')}
        <ExternalLink size={12} />
        <span className="text-[10px]" style={{ color: '#9ca3af' }}>nadlan.gov.il</span>
      </a>
    </div>
  );
}
