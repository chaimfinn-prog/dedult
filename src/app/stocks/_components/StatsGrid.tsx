import type { Quote } from '@/lib/stocks/types';
import { formatCompact, formatPrice } from '@/lib/stocks/format';

export function StatsGrid({ quote }: { quote: Quote }) {
  const stats: { label: string; value: string }[] = [
    {
      label: 'סגירה קודמת',
      value: formatPrice(quote.previousClose, quote.currency),
    },
    {
      label: 'גבוה היום',
      value: quote.dayHigh !== undefined ? formatPrice(quote.dayHigh, quote.currency) : '—',
    },
    {
      label: 'נמוך היום',
      value: quote.dayLow !== undefined ? formatPrice(quote.dayLow, quote.currency) : '—',
    },
    {
      label: 'מחזור',
      value: formatCompact(quote.regularMarketVolume),
    },
    {
      label: 'גבוה 52 שב׳',
      value:
        quote.fiftyTwoWeekHigh !== undefined
          ? formatPrice(quote.fiftyTwoWeekHigh, quote.currency)
          : '—',
    },
    {
      label: 'נמוך 52 שב׳',
      value:
        quote.fiftyTwoWeekLow !== undefined
          ? formatPrice(quote.fiftyTwoWeekLow, quote.currency)
          : '—',
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="db-stat">
          <div className="db-stat-label">{s.label}</div>
          <div className="db-stat-value price">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
