'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Calculator, Shield, ChevronLeft,
  Database, Cpu, Layers, Box,
} from 'lucide-react';
import { getPlanCount } from '@/services/db';

export default function Home() {
  const [planCount, setPlanCount] = useState(0);

  useEffect(() => {
    getPlanCount().then(setPlanCount);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center border border-green/20">
                <Building2 className="w-7 h-7 text-green" />
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold tracking-tight">Zchut.AI</h1>
                <p className="text-xs text-foreground-muted tracking-widest uppercase">Zoning Intelligence Brain</p>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold text-foreground-secondary mb-3">
              {'מנוע ניתוח זכויות בנייה'}
            </h2>
            <p className="text-sm text-foreground-muted max-w-lg mx-auto mb-8 leading-relaxed">
              {'המערכת לומדת מתב"עות מפורטות מאושרות בלבד. היא מחלצת נתונים אוטומטית ומחשבת זכויות בנייה על סמך מידות המגרש שלך.'}
            </p>

            {/* Stats */}
            {planCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="db-card p-3 inline-flex items-center gap-3 mb-8"
              >
                <Database className="w-4 h-4 text-green" />
                <span className="text-sm font-medium text-green">{planCount} {'תכניות במערכת'}</span>
              </motion.div>
            )}

            {planCount === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="db-card p-4 mb-8 border border-[rgba(245,158,11,0.15)]"
              >
                <div className="flex items-center gap-2 justify-center text-sm text-gold">
                  <Database className="w-4 h-4" />
                  <span>{'המערכת ריקה — טרם נטענו תב"עות מפורטות מאושרות'}</span>
                </div>
              </motion.div>
            )}

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <motion.a
                href="/admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="db-card p-6 hover:border-accent/30 transition-all group cursor-pointer text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                  <Database className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  {'מאגר תב"עות'}
                  <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-foreground-muted">{'עיון בתב"עות מפורטות מאושרות שמוזנות אוטומטית למערכת'}</p>
              </motion.a>

              <motion.a
                href="/calculate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="db-card p-6 hover:border-green/30 transition-all group cursor-pointer text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center mb-3 group-hover:bg-green/20 transition-colors">
                  <Calculator className="w-5 h-5 text-green" />
                </div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  {'חשב זכויות'}
                  <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-foreground-muted">{'הזן גוש/חלקה ומידות — קבל חישוב שטחים, מעטפת ו-3D Massing'}</p>
              </motion.a>

              <motion.a
                href="/admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="db-card p-6 hover:border-[rgba(255,255,255,0.15)] transition-all group cursor-pointer text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-3 group-hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                  <Shield className="w-5 h-5 text-foreground-muted" />
                </div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  {'ניהול'}
                  <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-foreground-muted">{'ניהול תכניות, עריכה, מחיקה ועדכון נתונים'}</p>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-sm font-semibold text-foreground-secondary text-center mb-6">איך זה עובד</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-xs">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Database className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="font-semibold">1. סנכרון</div>
                <div className="text-foreground-muted">{'תב"עות מפורטות מאושרות'}</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="font-semibold">2. מחלץ</div>
                <div className="text-foreground-muted">{'אחוזים, קומות, תכסית'}</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-green" />
              </div>
              <div>
                <div className="font-semibold">3. חשב</div>
                <div className="text-foreground-muted">{'שטח x אחוז = זכויות'}</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
                <Box className="w-4 h-4 text-green" />
              </div>
              <div>
                <div className="font-semibold">4. הדמיה</div>
                <div className="text-foreground-muted">{'3D Massing + מעטפת'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-4 text-center text-xs text-foreground-muted">
        <span>Zchut.AI </span>
        <span className="opacity-50">|</span>
        <span> {'מנוע ניתוח זכויות בנייה'}</span>
      </div>
    </div>
  );
}
