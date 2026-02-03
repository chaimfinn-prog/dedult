'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  FileSearch,
  Calculator,
  Banknote,
  Home as HomeIcon,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Search,
  Map,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useZoning } from '@/context/ZoningContext';
import { AddressSearch } from '@/components/features/AddressSearch';
import { AnalysisProgress } from '@/components/features/AnalysisProgress';
import { ResultsDashboard } from '@/components/features/ResultsDashboard';

export default function Home() {
  const { screen, userPath, setUserPath } = useZoning();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const navItems = [
    { icon: Search, label: 'חיפוש', active: screen === 'search' },
    { icon: BarChart3, label: 'ניתוח', active: screen === 'analyzing' },
    { icon: Map, label: 'תוצאות', active: screen === 'results' },
    { icon: Settings, label: 'ניהול', href: '/admin' },
  ];

  return (
    <div className="app-layout">
      {/* ─── Sidebar ─── */}
      <nav className={`app-sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
        {/* Logo */}
        <div className={`flex items-center ${sidebarExpanded ? 'w-full px-2 mb-6' : 'mb-6'} gap-3`}>
          <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-green" />
          </div>
          {sidebarExpanded && (
            <div>
              <div className="font-bold text-sm text-gradient leading-tight">Zchut.AI</div>
              <div className="text-[9px] text-foreground-muted font-mono tracking-wider">INTELLIGENCE</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className={`flex flex-col gap-1 ${sidebarExpanded ? 'w-full' : ''} flex-1`}>
          {navItems.map((item) => {
            const content = (
              <div
                className={`flex items-center gap-3 ${sidebarExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'} rounded-lg transition-all cursor-pointer ${
                  item.active
                    ? 'bg-green/10 text-green-light'
                    : 'text-foreground-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            );

            return item.href ? (
              <a key={item.label} href={item.href}>{content}</a>
            ) : (
              <div key={item.label}>{content}</div>
            );
          })}
        </div>

        {/* Expand Toggle */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors mt-auto"
        >
          {sidebarExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </nav>

      {/* ─── Main Content ─── */}
      <div className="app-main">
        {/* Top Bar */}
        <div className="app-topbar">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-semibold text-foreground">
              <span className="text-gradient">Zchut.AI</span>
              <span className="text-foreground-muted mx-2">|</span>
              <span className="text-foreground-muted text-xs font-normal">Real Estate Intelligence Platform</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserPath('homeowner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                userPath === 'homeowner'
                  ? 'bg-green/10 text-green-light border border-green/20'
                  : 'text-foreground-muted hover:text-foreground border border-transparent'
              }`}
            >
              <HomeIcon className="w-3.5 h-3.5" />
              בעל נכס
            </button>
            <button
              onClick={() => setUserPath('developer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                userPath === 'developer'
                  ? 'bg-gold/10 text-gold-light border border-gold/20'
                  : 'text-foreground-muted hover:text-foreground border border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              יזם
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="app-content">
          <AnimatePresence mode="wait">
            {screen === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-8 text-center max-w-2xl mx-auto"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-green/10 flex items-center justify-center glow">
                    <Building2 className="w-8 h-8 text-green" />
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold mb-3">
                    <span className="text-gradient">גלה את זכויות הבנייה שלך</span>
                  </h2>
                  <p className="text-foreground-muted text-sm max-w-md mx-auto leading-relaxed">
                    {"מנוע AI שמנתח תב\"ע מורכבות ומחלץ זכויות בנייה עם הוכחות מקור, הדמיית Massing תלת-ממדית והערכה כלכלית."}
                  </p>
                </motion.div>

                {/* Search */}
                <div className="max-w-2xl mx-auto">
                  <AddressSearch />
                </div>

                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto"
                >
                  <FeatureCard
                    step={1}
                    title="הכנס כתובת"
                    description={'הזן כתובת או גוש/חלקה — המערכת מאתרת תב"ע ונתוני GIS'}
                    icon={<FileSearch className="w-6 h-6 text-green" />}
                  />
                  <FeatureCard
                    step={2}
                    title="ניתוח AI"
                    description={'מחלץ אחוזי בנייה, תכסית, קווי בניין, צפיפות וזכויות תמ"א 38'}
                    icon={<Calculator className="w-6 h-6 text-green" />}
                  />
                  <FeatureCard
                    step={3}
                    title={'דו"ח מקצועי'}
                    description={'הדמיית Massing 3D, הוכחות מקור, מחשבון רווח ודו"ח להורדה'}
                    icon={<Banknote className="w-6 h-6 text-green" />}
                  />
                </motion.div>

                {/* Capabilities Bar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-10 max-w-3xl mx-auto"
                >
                  <div className="db-card p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <CapItem icon={<Shield className="w-4 h-4 text-green" />} value={'הוכחות מקור'} label={'ציטוט סעיף + עמוד'} />
                      <CapItem icon={<Building2 className="w-4 h-4 text-accent" />} value={'Massing 3D'} label={'הדמיית נפח בנייה'} />
                      <CapItem icon={<BarChart3 className="w-4 h-4 text-teal" />} value={'< 10 שניות'} label={'זמן ניתוח'} />
                      <CapItem icon={<Banknote className="w-4 h-4 text-gold" />} value={'דו"ח אפס'} label={'מחשבון כלכלי מלא'} />
                    </div>
                  </div>
                </motion.div>

                {/* Footer */}
                <div className="py-8 text-center">
                  <p className="text-xs text-foreground-muted">
                    <span className="text-gradient">Zchut.AI</span>
                    <span className="text-foreground-muted"> — Real Estate Intelligence Platform</span>
                  </p>
                  <p className="mt-1 text-[10px] text-foreground-muted/50">
                    &copy; {new Date().getFullYear()} Zchut.AI
                  </p>
                </div>
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
              >
                <ResultsDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
    <div className="db-card p-5 text-center">
      <div className="relative inline-block mb-3">
        {icon}
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded bg-green text-white text-[9px] font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-foreground-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function CapItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {icon}
      <div className="text-xs font-bold">{value}</div>
      <div className="text-[10px] text-foreground-muted">{label}</div>
    </div>
  );
}
