'use client';

import { motion } from 'framer-motion';
import {
  Building2, Calculator, ShieldCheck, ChevronLeft,
  Layers, Box, AlertTriangle, CheckCircle2, Target, Timer,
  BadgeCheck, FileText, ArrowUpRight,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center">
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
                <h1 className="text-3xl font-bold tracking-tight">הצ׳ק-אפ של חיים</h1>
                <p className="text-xs text-foreground-muted tracking-widest uppercase">Reality Check להתחדשות עירונית</p>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold text-foreground-secondary mb-3">
              {'מחשבון היתכנות שמחזיר אותך למציאות'}
            </h2>
            <p className="text-sm text-foreground-muted max-w-2xl mx-auto mb-6 leading-relaxed">
              {'חיים היועץ מנתח סטטוס סטטוטורי, חתימות, ניסיון יזמי ויעילות עירונית – ומוציא לו״ז אמיתי לקבלת מפתח + מדד וודאות. בלי הבטחות שיווקיות, בלי סיפורים.'}
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-8">
              <a
                href="#inputs"
                className="db-card px-5 py-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground-secondary hover:border-green/30 transition"
              >
                <Calculator className="w-4 h-4 text-green" />
                {'צפה בקלטים של הצ׳ק-אפ'}
                <ChevronLeft className="w-3 h-3" />
              </a>
              <a
                href="#cta"
                className="db-card px-5 py-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground-secondary hover:border-[rgba(248,81,73,0.35)] transition"
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                {'לקביעת ייעוץ ממוקד'}
                <ChevronLeft className="w-3 h-3" />
              </a>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="db-card p-6 hover:border-red-400/30 transition-all group text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center mb-3 group-hover:bg-red-400/20 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  {'חותכים את השיווק'}
                  <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-foreground-muted">{'המערכת מציגה פערים בין הבטחות יזם לזמן אמיתי לפי סטטוס סטטוטורי.'}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="db-card p-6 hover:border-green/30 transition-all group text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center mb-3 group-hover:bg-green/20 transition-colors">
                  <Target className="w-5 h-5 text-green" />
                </div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  {'לו״ז אמיתי למפתח'}
                  <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-foreground-muted">{'תוצאה אחת: טווח ריאלי לקבלת מפתח + ציון וודאות.'}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="db-card p-6 hover:border-[rgba(255,255,255,0.15)] transition-all group text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-3 group-hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                  <BadgeCheck className="w-5 h-5 text-foreground-muted" />
                </div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  {'שפה של עסקים'}
                  <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-foreground-muted">{'חיים מדבר ישר: האם זה זהב או בור ללא תחתית.'}</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-foreground-secondary text-center mb-6">איך חיים עובד</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-xs">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="font-semibold">1. סטטוס</div>
                <div className="text-foreground-muted">{'שלב תב"ע/היתר מדויק'}</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Timer className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="font-semibold">2. לו״ז בסיס</div>
                <div className="text-foreground-muted">{'שנים עד מפתח + 3 שנות בנייה'}</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-green" />
              </div>
              <div>
                <div className="font-semibold">3. התאמות</div>
                <div className="text-foreground-muted">{'דיירים, חתימות, סוג פרויקט'}</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
                <Box className="w-4 h-4 text-green" />
              </div>
              <div>
                <div className="font-semibold">4. וודאות</div>
                <div className="text-foreground-muted">{'ציון ביטחון ופער מול הבטחות'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs + Outputs */}
      <div id="inputs" className="border-t border-[rgba(255,255,255,0.06)] p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="db-card p-6 text-right">
            <h3 className="text-sm font-semibold text-foreground-secondary mb-4">הקלט שאתה מזין</h3>
            <ul className="space-y-3 text-sm text-foreground-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green" />
                {'סוג הפרויקט: פינוי-בינוי / תמ״א 38/2'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green" />
                {'מספר דיירים: עד 100 / מעל 100'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green" />
                {'סטטוס חתימות: אין רוב / רוב חוקי / 100%'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green" />
                {'שלב תכנוני: קו כחול → היתר בתנאים'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green" />
                {'הבטחת היזם: תוך כמה שנים הבטיח מפתח?'}
              </li>
            </ul>
          </div>
          <div className="db-card p-6 text-right">
            <h3 className="text-sm font-semibold text-foreground-secondary mb-4">מה אתה מקבל</h3>
            <ul className="space-y-3 text-sm text-foreground-muted">
              <li className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green" />
                {'זמן ריאלי למפתח — מספר אחד ברור'}
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                {'פער מהבטחת היזם — מי אופטימי ומי מדויק'}
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-green" />
                {'מדד וודאות של חיים — ציון ביטחון אמיתי'}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-foreground-muted" />
                {'פרשנות חדה על הסיכונים והשלב הבא'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-foreground-secondary text-center mb-6">מתודולוגיית ״מצפן ההתחדשות״</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right text-xs">
            <div className="db-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-accent" />
                <span className="font-semibold">לו״ז בסיס</span>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                {'זמן עד מפתח לפי שלב תכנוני + 3 שנות בנייה, כולל פער רישוי אמיתי ולא ״חודשים בודדים״.'}
              </p>
            </div>
            <div className="db-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-green" />
                <span className="font-semibold">קנסות והתאמות</span>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                {'תוספת עומס דיירים, בונוס ל-100% חתימות, והפחתות לפרויקטים שמתחילים בלי בסיס חוקי.'}
              </p>
            </div>
            <div className="db-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span className="font-semibold">מדד וודאות</span>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                {'ציון ביטחון שמוריד נקודות על חוסר רוב, פינוי-בינוי ללא תב"ע, ועיכובים צפויים.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div id="cta" className="border-t border-[rgba(255,255,255,0.06)] p-6">
        <div className="max-w-4xl mx-auto db-card p-6 text-right">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">רוצה לדעת איפה המוקשים בחוזה?</h3>
              <p className="text-sm text-foreground-muted mt-2">
                {'אל תחתום על עסקה של מיליונים על עיוור. בפגישת ייעוץ של 45 דקות ננתח חוזה, שלב סטטוטורי וסיכונים.'}
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground-muted mt-3">
                <CheckCircle2 className="w-4 h-4 text-green" />
                {'עלות הפגישה: 3,000 ש״ח'}
              </div>
            </div>
            <a
              href="mailto:contact@haim-checkup.co.il"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-red-500/20 border border-red-500/40 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition"
            >
              {'קבע פגישה ותשלום במייל'}
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-4 text-center text-xs text-foreground-muted">
        <span>{'הצ׳ק-אפ של חיים'} </span>
        <span className="opacity-50">|</span>
        <span> {'מחשבון היתכנות להתחדשות עירונית'}</span>
      </div>
    </div>
  );
}
