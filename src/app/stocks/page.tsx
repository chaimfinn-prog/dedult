import { StocksNav } from './_components/StocksNav';
import { SymbolSearch } from './_components/SymbolSearch';
import { FavoritesGrid } from './_components/FavoritesGrid';
import { PopularStocks } from './_components/PopularStocks';
import { Star, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'מניות · דשבורד פיננסי',
  description: 'חיפוש מניות, מועדפים, גרפים בזמן אמת וחדשות בעברית',
};

export default function StocksHomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StocksNav />
      <main className="container-app py-8 space-y-8">
        <section className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-blue">
              דשבורד פיננסי
            </h1>
            <p className="text-sm text-foreground-muted">
              חפש מניה, צפה במחיר ובגרף, וקבל סיכומי חדשות בעברית.
            </p>
          </div>
          <SymbolSearch autoFocus />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-light)]" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground-muted uppercase">
              מניות פופולריות
            </h2>
          </div>
          <PopularStocks />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[var(--gold-light)]" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground-muted uppercase">
              המועדפים שלי
            </h2>
          </div>
          <FavoritesGrid />
        </section>
      </main>
    </div>
  );
}
