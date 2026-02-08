'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Calculator, ShieldCheck, ChevronLeft,
  Layers, AlertTriangle, CheckCircle2, Target, Timer,
  BadgeCheck, ArrowUpRight, Search,
} from 'lucide-react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=2000&q=80';

const planningOptions = [
  { value: 'blueLine', label: 'בדיקת תנאי סף (קו כחול)', baseYears: 8.5, stage: 'pre' },
  { value: 'depositDiscussion', label: 'דיון להפקדה', baseYears: 7.5, stage: 'pre' },
  { value: 'tabaApproved', label: 'תב״ע מאושרת', baseYears: 7, stage: 'pre' },
  { value: 'permitFiled', label: 'הוגשה בקשה להיתר', baseYears: 5.5, stage: 'permit' },
  { value: 'permitReceived', label: 'בקשה נקלטה', baseYears: 5, stage: 'permit' },
  { value: 'permitConditions', label: 'היתר בתנאים (החלטת ועדה)', baseYears: 4.5, stage: 'permit' },
];

const defaultForm = {
  projectType: 'pinui',
  tenantCount: 'under100',
  signatureStatus: 'noMajority',
  planningStatus: 'blueLine',
  developerPromiseYears: '',
};

function getConfidenceMessage(certainty: number) {
  if (certainty < 50) {
    return 'תקשיב לי טוב, אתה קונה פה אוויר. בלי רוב חוקי ובלי תב״ע, אין לך כלום ביד חוץ מהדמיות יפות. הסיכון פה עצום.';
  }
  if (certainty >= 80) {
    return 'זה נראה כמו עסקה בשלה. יש בסיס סטטוטורי חזק והסיכון נשלט. עדיין צריך לבדוק חוזה, אבל זה הכיוון הנכון.';
  }
  return 'יש פה פוטנציאל, אבל עוד יש מוקשים בדרך. אם אתה נכנס לזה, תוודא שיש לך מנגנוני יציאה והגנות בחוזה.';
}

export default function Home() {
  const [form, setForm] = useState(defaultForm);

  const calculation = useMemo(() => {
    const planning = planningOptions.find((option) => option.value === form.planningStatus);
    if (!planning) {
      return null;
    }

    let years = planning.baseYears;
    const isPrePermit = planning.stage === 'pre';
    const hasOver100Tenants = form.tenantCount === 'over100';
    const hasFullSignatures = form.signatureStatus === 'full';

    if (isPrePermit && hasOver100Tenants) {
      years += 8 / 12;
    }

    if (hasFullSignatures) {
      years = Math.max(0, years - 1);
    }

    let certainty = 100;
    if (form.signatureStatus === 'noMajority') {
      certainty -= 30;
    }
    if (form.projectType === 'pinui' && form.planningStatus !== 'tabaApproved' && isPrePermit) {
      certainty -= 25;
    }

    certainty = Math.max(0, Math.min(100, certainty));

    const promise = parseFloat(form.developerPromiseYears);
    const promiseDiff = Number.isFinite(promise) ? +(years - promise).toFixed(1) : null;

    return {
      years: +years.toFixed(1),
      certainty,
      promiseDiff,
      message: getConfidenceMessage(certainty),
    };
  }, [form]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div
        className="relative flex-1 flex items-center justify-center text-white min-h-[620px]"
        style={{
          backgroundImage: `linear-gradient(rgba(10,12,18,0.65), rgba(10,12,18,0.65)), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.35)]" />
        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-6 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/80 uppercase tracking-wider">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <Building2 className="w-5 h-5 text-green-300" />
                <span>הצ׳ק-אפ של חיים</span>
              </div>
              <div className="flex items-center gap-6">
                <span>בדיקה</span>
                <span>תהליך</span>
                <span>שאלות</span>
                <a href="#cta" className="text-white font-semibold">
                  קבע ייעוץ
                </a>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 text-center mt-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-semibold tracking-tight"
            >
              {'בדיקת היתכנות שמורידה אותך לקרקע'}
            </motion.h1>
            <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto mt-4">
              {'חיים היועץ מנתח סטטוס סטטוטורי, חתימות וניהול יזמי, ומחזיר לך לו״ז אמיתי למפתח + מדד וודאות.'}
            </p>

            <div className="bg-white/95 text-gray-900 rounded-xl shadow-2xl max-w-3xl mx-auto mt-10">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500 py-3 border-b border-gray-200">
                <span className="px-3 py-1 bg-gray-900 text-white rounded-md">בדיקה</span>
                <span className="px-3 py-1 rounded-md">וודאות</span>
                <span className="px-3 py-1 rounded-md">לו״ז</span>
              </div>
              <div className="flex flex-col md:flex-row items-stretch gap-3 p-4">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg flex items-center px-4 py-3 text-sm text-gray-600">
                  <Search className="w-4 h-4 text-gray-400 ml-2" />
                  <span>{'בחר סטטוס תכנוני, חתימות והבטחת יזם כדי לקבל פלט.'}</span>
                </div>
                <a
                  href="#calculator"
                  className="bg-blue-600 text-white rounded-lg px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  {'התחל בדיקה'}
                  <ChevronLeft className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-3 mt-8">
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border border-white/40 px-4 py-2 rounded-lg hover:bg-white/10 transition"
              >
                <Calculator className="w-4 h-4" />
                {'המחשבון המלא'}
              </a>
              <a
                href="#cta"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border border-white/40 px-4 py-2 rounded-lg hover:bg-white/10 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                {'קביעת ייעוץ ממוקד'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator */}
      <div id="calculator" className="border-t border-[rgba(255,255,255,0.06)] p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="db-card p-6 text-right">
            <h3 className="text-lg font-semibold text-foreground-secondary mb-2">המחשבון של חיים</h3>
            <p className="text-sm text-foreground-muted mb-6">
              {'מלא את הפרטים, קבל לו״ז אמיתי, פער מול הבטחת היזם וציון וודאות.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <label className="flex flex-col gap-2">
                <span className="text-foreground-muted">סוג הפרויקט</span>
                <select
                  className="db-card px-3 py-2 bg-transparent border border-[rgba(255,255,255,0.1)]"
                  value={form.projectType}
                  onChange={(event) => setForm({ ...form, projectType: event.target.value })}
                >
                  <option value="pinui">פינוי-בינוי</option>
                  <option value="tama">תמ״א 38/2</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-foreground-muted">מספר דיירים</span>
                <select
                  className="db-card px-3 py-2 bg-transparent border border-[rgba(255,255,255,0.1)]"
                  value={form.tenantCount}
                  onChange={(event) => setForm({ ...form, tenantCount: event.target.value })}
                >
                  <option value="under100">עד 100</option>
                  <option value="over100">מעל 100</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-foreground-muted">סטטוס חתימות</span>
                <select
                  className="db-card px-3 py-2 bg-transparent border border-[rgba(255,255,255,0.1)]"
                  value={form.signatureStatus}
                  onChange={(event) => setForm({ ...form, signatureStatus: event.target.value })}
                >
                  <option value="noMajority">אין רוב חוקי</option>
                  <option value="majority">יש רוב חוקי</option>
                  <option value="full">100% חתימות</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-foreground-muted">סטטוס תכנוני</span>
                <select
                  className="db-card px-3 py-2 bg-transparent border border-[rgba(255,255,255,0.1)]"
                  value={form.planningStatus}
                  onChange={(event) => setForm({ ...form, planningStatus: event.target.value })}
                >
                  {planningOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-foreground-muted">הבטחת היזם (בשנים)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="לדוגמה: 6"
                  className="db-card px-3 py-2 bg-transparent border border-[rgba(255,255,255,0.1)]"
                  value={form.developerPromiseYears}
                  onChange={(event) => setForm({ ...form, developerPromiseYears: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="db-card p-6 text-right">
            <h3 className="text-lg font-semibold text-foreground-secondary mb-2">ניתוח היתכנות – הצ׳ק-אפ של חיים</h3>
            {calculation && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">זמן ריאלי למפתח</span>
                  <span className="text-lg font-semibold text-green">{calculation.years} שנים</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">פער מהבטחת היזם</span>
                  <span className="font-semibold text-red-300">
                    {calculation.promiseDiff === null
                      ? 'לא הוזנה הבטחת יזם'
                      : calculation.promiseDiff > 0
                        ? `היזם אופטימי ב-${calculation.promiseDiff} שנים`
                        : `היזם שמרן ב-${Math.abs(calculation.promiseDiff)} שנים`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">מדד הוודאות של חיים</span>
                  <span className="font-semibold text-foreground-secondary">{calculation.certainty}%</span>
                </div>
                <p className="text-sm text-foreground-muted leading-relaxed border-t border-[rgba(255,255,255,0.08)] pt-4">
                  {calculation.message}
                </p>
              </div>
            )}
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
