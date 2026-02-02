'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Sun,
  Moon,
  FileSearch,
  Calculator,
  Banknote,
  Shield,
  Zap,
  Home as HomeIcon,
  TrendingUp,
} from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import { useTheme } from '@/context/ThemeContext';
import { AddressSearch } from '@/components/features/AddressSearch';
import { AnalysisProgress } from '@/components/features/AnalysisProgress';
import { ResultsDashboard } from '@/components/features/ResultsDashboard';

export default function Home() {
  const { screen, userPath, setUserPath } = useZoning();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container-app pb-8">
      <div className="grid-overlay" />

      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center glow">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">
              <span className="text-gradient">Zchut.AI</span>
            </h1>
            <p className="text-[10px] text-foreground-muted font-mono tracking-wider">
              REAL ESTATE INTELLIGENCE
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

      {/* Content */}
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
              className="py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center glow"
              >
                <Building2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">
                <span className="text-gradient">Zchut.AI</span>
              </h2>
              <p className="text-foreground-secondary text-lg mb-2">
                גלה את זכויות הבנייה שלך בשניות
              </p>
              <p className="text-foreground-muted text-sm max-w-lg mx-auto leading-relaxed">
                {"מנוע AI שמנתח תב\"ע מורכבות ומחלץ זכויות בנייה עם הוכחות מקור, הדמיית Massing תלת-ממדית והערכה כלכלית מיידית."}
              </p>
            </motion.section>

            {/* User Path Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 justify-center mb-8"
            >
              <button
                onClick={() => setUserPath('homeowner')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                  userPath === 'homeowner'
                    ? 'bg-accent/15 border-accent text-accent-light glow'
                    : 'glass-card border-border hover:border-accent/40'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                <div className="text-right">
                  <div className="font-semibold text-sm">בעל נכס</div>
                  <div className="text-[10px] text-foreground-muted">מה מותר לי לבנות?</div>
                </div>
              </button>
              <button
                onClick={() => setUserPath('developer')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                  userPath === 'developer'
                    ? 'bg-gold/15 border-gold text-gold glow'
                    : 'glass-card border-border hover:border-gold/40'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <div className="text-right">
                  <div className="font-semibold text-sm">יזם / התחדשות</div>
                  <div className="text-[10px] text-foreground-muted">כדאיות כלכלית ופוטנציאל</div>
                </div>
              </button>
            </motion.div>

            {/* Search */}
            <AddressSearch />

            {/* Features */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="py-14"
            >
              <h3 className="text-lg font-bold text-center mb-2">
                <span className="text-gradient-gold">בדיקה של אדריכל בשניות</span>
              </h3>
              <p className="text-sm text-foreground-muted text-center mb-8">ממגרש למספרים ב-3 צעדים</p>
              <div className="grid md:grid-cols-3 gap-4">
                <FeatureCard
                  step={1}
                  title="הכנס כתובת"
                  description={'הזן כתובת או גוש/חלקה - המערכת מאתרת תב"ע חלה ונתוני GIS'}
                  icon={<FileSearch className="w-7 h-7 text-accent" />}
                />
                <FeatureCard
                  step={2}
                  title="ניתוח AI"
                  description={'מחלץ אחוזי בנייה, תכסית, קווי בניין, צפיפות וזכויות תמ"א 38'}
                  icon={<Calculator className="w-7 h-7 text-accent" />}
                />
                <FeatureCard
                  step={3}
                  title={'דו"ח מקצועי'}
                  description={'הדמיית Massing 3D, הוכחות מקור, מחשבון רווח ודו"ח להורדה'}
                  icon={<Banknote className="w-7 h-7 text-accent" />}
                />
              </div>
            </motion.section>

            {/* Capabilities */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="py-8"
            >
              <div className="glass-card p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <CapItem icon={<Shield className="w-5 h-5 text-gold" />} value={'הוכחות מקור'} label={'ציטוט סעיף + עמוד'} />
                  <CapItem icon={<Building2 className="w-5 h-5 text-accent" />} value={'Massing 3D'} label={'הדמיית נפח בנייה'} />
                  <CapItem icon={<Zap className="w-5 h-5 text-success" />} value={'< 10 שניות'} label={'זמן ניתוח'} />
                  <CapItem icon={<Banknote className="w-5 h-5 text-gold" />} value={'מחשבון רווח'} label={'סליידר אינטראקטיבי'} />
                </div>
              </div>
            </motion.section>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="py-8 text-center"
            >
              <p className="text-sm text-foreground-secondary">
                <span className="text-gradient">Zchut.AI</span>
                <span className="text-foreground-muted"> — Real Estate Intelligence Platform</span>
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                MVP - עיר רעננה | 5 תכניות | 10 כתובות
              </p>
              <p className="mt-2 text-[10px] text-foreground-muted/50">
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
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative inline-block mb-4">
        {icon}
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white text-[10px] font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h4 className="font-semibold mb-1.5 text-sm">{title}</h4>
      <p className="text-xs text-foreground-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

function CapItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {icon}
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-foreground-muted">{label}</div>
    </div>
  );
}
