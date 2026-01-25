'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingCart,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { UserStats } from '@/types';

// Mock user statistics
const mockUserStats: UserStats = {
  totalSavings: 487.5,
  basketsOptimized: 23,
  favoriteStore: 'רמי לוי',
  lastOptimization: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  monthlySavings: [
    { month: 'אוג', savings: 120 },
    { month: 'ספט', savings: 95 },
    { month: 'אוק', savings: 145 },
    { month: 'נוב', savings: 127.5 },
  ],
};

export function Dashboard() {
  const stats = mockUserStats;
  const lastMonthSavings = stats.monthlySavings[stats.monthlySavings.length - 1].savings;
  const prevMonthSavings = stats.monthlySavings[stats.monthlySavings.length - 2].savings;
  const savingsChange = ((lastMonthSavings - prevMonthSavings) / prevMonthSavings) * 100;

  return (
    <section id="dashboard" className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">לוח הבקרה שלך</h2>
          <span className="text-sm text-foreground-secondary">
            עודכן היום
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Savings */}
          <motion.div
            className="glass-card p-4 col-span-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-foreground-secondary mb-1">סה״כ חיסכון</p>
                <p className="text-3xl font-bold text-success price">
                  ₪{stats.totalSavings.toFixed(0)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {savingsChange >= 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-success" />
                      <span className="text-sm text-success">
                        +{savingsChange.toFixed(0)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-danger" />
                      <span className="text-sm text-danger">
                        {savingsChange.toFixed(0)}%
                      </span>
                    </>
                  )}
                  <span className="text-xs text-foreground-secondary">
                    מהחודש הקודם
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </motion.div>

          {/* Baskets Optimized */}
          <motion.div
            className="glass-card p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-foreground-secondary mb-1">סלים שעברו אופטימיזציה</p>
                <p className="text-2xl font-bold">{stats.basketsOptimized}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-accent" />
              </div>
            </div>
          </motion.div>

          {/* Favorite Store */}
          <motion.div
            className="glass-card p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-foreground-secondary mb-1">חנות מועדפת</p>
                <p className="text-lg font-bold">{stats.favoriteStore}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-warning" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Monthly Savings Chart */}
        <motion.div
          className="glass-card p-4"
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">חיסכון חודשי</h3>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground-secondary">
                4 חודשים אחרונים
              </span>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end justify-around h-32 gap-2">
            {stats.monthlySavings.map((month, index) => {
              const maxSavings = Math.max(...stats.monthlySavings.map((m) => m.savings));
              const height = (month.savings / maxSavings) * 100;
              const isLastMonth = index === stats.monthlySavings.length - 1;

              return (
                <motion.div
                  key={month.month}
                  className="flex flex-col items-center gap-2 flex-1"
                  initial={{ opacity: 0, scaleY: 0 }}
                  whileInView={{ opacity: 1, scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    className={`w-full max-w-12 rounded-t-lg ${
                      isLastMonth
                        ? 'bg-gradient-to-t from-accent to-accent-light'
                        : 'bg-border'
                    }`}
                    style={{ height: `${height}%` }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  />
                  <span className="text-xs text-foreground-secondary">
                    {month.month}
                  </span>
                  <span className={`text-sm font-semibold ${isLastMonth ? 'text-accent' : ''}`}>
                    ₪{month.savings}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Tips Card */}
        <motion.div
          className="glass-card p-4 bg-gradient-to-l from-accent/5 to-transparent border border-accent/20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-accent">טיפ חכם</h4>
              <p className="text-sm text-foreground-secondary mt-1">
                על פי הרגלי הקנייה שלך, תוכל לחסוך עוד ₪45 בחודש אם תעבור לקנות מוצרי חלב ברמי לוי במקום בשופרסל.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
