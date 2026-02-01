'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Sun,
  Moon,
  FileSearch,
  Calculator,
  Banknote,
} from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import { useTheme } from '@/context/ThemeContext';
import { AddressSearch } from '@/components/features/AddressSearch';
import { AnalysisProgress } from '@/components/features/AnalysisProgress';
import { ResultsDashboard } from '@/components/features/ResultsDashboard';

export default function Home() {
  const { screen } = useZoning();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container-app pb-8">
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">
              <span className="bg-gradient-to-l from-accent to-accent-light bg-clip-text text-transparent">
                Zchut.AI
              </span>
            </h1>
            <p className="text-xs text-foreground-secondary">
              מנוע זכויות בנייה חכם
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="glass-button p-2.5 rounded-xl"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Content based on screen */}
      <AnimatePresence mode="wait">
        {screen === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center"
              >
                <Building2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-l from-accent to-accent-light bg-clip-text text-transparent">
                  Zchut.AI
                </span>
              </h2>
              <p className="text-foreground-secondary text-lg mb-2">
                גלה את זכויות הבנייה שלך בשניות
              </p>
              <p className="text-foreground-secondary/60 text-sm max-w-lg mx-auto">
                מנוע AI שהופך קבצי תב&quot;ע מורכבים לדו&quot;ח היתכנות
                כלכלי-תכנוני פשוט. במקום לשלם אלפי שקלים לאדריכל - קבל
                תשובה מיידית.
              </p>
            </motion.section>

            {/* Search */}
            <AddressSearch />

            {/* How it works */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="py-12"
            >
              <h3 className="text-xl font-bold text-center mb-8">
                איך זה עובד?
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <FeatureCard
                  step={1}
                  title="הכנס כתובת"
                  description={'הזן כתובת או גוש/חלקה וגודל המגרש - המערכת מאתרת את התב"ע הרלוונטית'}
                  icon={<FileSearch className="w-8 h-8 text-accent" />}
                />
                <FeatureCard
                  step={2}
                  title="ניתוח AI"
                  description={'מנוע ה-AI מחלץ אחוזי בנייה, שטחי שירות, קומות ונסיגות מתוך התקנון'}
                  icon={<Calculator className="w-8 h-8 text-accent" />}
                />
                <FeatureCard
                  step={3}
                  title={'דו"ח מיידי'}
                  description="קבל פירוט מלא של זכויות הבנייה כולל הערכה כלכלית - בשניות"
                  icon={<Banknote className="w-8 h-8 text-accent" />}
                />
              </div>
            </motion.section>

            {/* Stats */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="py-8"
            >
              <div className="glass-card p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <StatItem value="5" label='תכניות תב"ע' />
                  <StatItem value="10" label="כתובות לדוגמה" />
                  <StatItem value="רעננה" label="עיר MVP" />
                  <StatItem value="< 10 שניות" label="זמן ניתוח" />
                </div>
              </div>
            </motion.section>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="py-8 text-center text-sm text-foreground-secondary"
            >
              <p>Zchut.AI - מנוע זכויות בנייה חכם</p>
              <p className="mt-1">
                MVP - עיר רעננה | נתוני דמו לצורך הדגמה
              </p>
              <p className="mt-2 text-xs opacity-70">
                &copy; {new Date().getFullYear()} Zchut.AI. כל הזכויות שמורות.
              </p>
            </motion.footer>
          </motion.div>
        )}

        {screen === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            <AnalysisProgress />
          </motion.div>
        )}

        {screen === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4"
          >
            <ResultsDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      className="glass-card p-6 text-center"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative inline-block mb-4">
        {icon}
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-foreground-secondary">{description}</p>
    </motion.div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-accent">{value}</div>
      <div className="text-sm text-foreground-secondary">{label}</div>
    </div>
  );
}
