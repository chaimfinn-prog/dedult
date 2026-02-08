'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Activity, Building2, CalendarDays, CheckCircle2,
  ChevronLeft, ClipboardList, AlertTriangle, ArrowRight, Loader2,
} from 'lucide-react';

// --- Constants & Options ---

const planningOptions = [
  { value: 'blueLine', label: 'בדיקת תנאי סף (קו כחול)', baseYears: 8.5, stage: 'pre' },
  { value: 'depositDiscussion', label: 'דיון להפקדה', baseYears: 7.5, stage: 'pre' },
  { value: 'tabaApproved', label: 'תב״ע מאושרת', baseYears: 7, stage: 'pre' },
  { value: 'permitFiled', label: 'הוגשה בקשה להיתר', baseYears: 5.5, stage: 'permit' },
  { value: 'permitReceived', label: 'בקשה נקלטה', baseYears: 5, stage: 'permit' },
  { value: 'permitConditions', label: 'היתר בתנאים (החלטת ועדה)', baseYears: 4.5, stage: 'permit' },
];

const SCAN_STEPS = [
  'מאמת נתוני גוש/חלקה...',
  'סורק היסטוריית החלטות ועדה...',
  'מנתח יציבות פיננסית של היזם...',
  'מחשב מקדמי סיכון והתנגדויות...',
  'מגבש דוח סופי...',
];

// --- Helper Functions ---

function getConfidenceMessage(certainty: number) {
  if (certainty < 50) {
    return 'תקשיב לי טוב, אתה קונה פה אוויר. בלי רוב חוקי ובלי תב״ע, אין לך כלום ביד חוץ מהדמיות יפות. הסיכון פה הוא עצום. זה לא הזמן לחתום, זה הזמן לברוח או לדרוש בטחונות דרקוניים.';
  }
  if (certainty < 75) {
    return 'יש פה פוטנציאל, אבל הדרך עוד ארוכה ויש לא מעט מוקשים. היזם אולי נחמד, אבל הסטטיסטיקה נגדו. אם אתה נכנס לזה, תוודא שיש לך מנגנוני יציאה ברורים בחוזה וערבויות חזקות.';
  }
  return 'זה נראה כמו עסקה בשלה. יש היתר/תב״ע ומספיק חתימות כדי להתקדם באמת. זה הזמן לסגור קצוות אחרונים ולרוץ, אבל עדיין - לא לחתום על עיוור.';
}

function getConfidenceClass(certainty: number) {
  if (certainty < 50) return 'confidence-low';
  if (certainty < 75) return 'confidence-medium';
  return 'confidence-high';
}

function getConfidenceColorVar(certainty: number) {
  if (certainty < 50) return 'var(--red)';
  if (certainty < 75) return 'var(--gold)';
  return 'var(--green)';
}

// --- Main Component ---

export default function CheckupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-foreground-muted">{'טוען...'}</div>}>
      <CheckupContent />
    </Suspense>
  );
}

function CheckupContent() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') ?? '';

  const [form, setForm] = useState({
    address: initialAddress,
    projectType: 'pinui',
    tenantCount: 'under100',
    signatureStatus: 'noMajority',
    planningStatus: 'blueLine',
    developerPromiseYears: '',
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isScanning) {
      setScanStepIndex(0);
      interval = setInterval(() => {
        setScanStepIndex((prev) => {
          if (prev >= SCAN_STEPS.length - 1) {
            clearInterval(interval);
            setIsScanning(false);
            setShowResults(true);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleCalculate = () => {
    setShowResults(false);
    setIsScanning(true);
  };

  // --- Core Algorithm ---
  const calculation = useMemo(() => {
    const planning = planningOptions.find((o) => o.value === form.planningStatus);
    if (!planning) return null;

    let years = planning.baseYears;
    const isPrePermit = planning.stage === 'pre';
    const adjustments: string[] = [];

    // Tenant load penalty
    if (isPrePermit && form.tenantCount === 'over100') {
      years += 8 / 12;
      adjustments.push('עומס דיירים: +8 חודשים (מעל 100 דיירים לפני היתר)');
    }

    // Full signatures bonus
    if (form.signatureStatus === 'full') {
      years = Math.max(0, years - 1);
      adjustments.push('בונוס 100% חתימות: \u22121 שנה');
    }

    // Certainty score
    let certainty = 100;

    if (form.signatureStatus === 'noMajority') {
      certainty -= 30;
      adjustments.push('אין רוב חוקי: \u221230% וודאות');
    }

    if (form.projectType === 'pinui' && isPrePermit && form.planningStatus !== 'tabaApproved') {
      certainty -= 25;
      adjustments.push('פינוי-בינוי ללא תב״ע מאושרת: \u221225% וודאות');
    }

    certainty = Math.max(0, Math.min(100, certainty));

    const promise = parseFloat(form.developerPromiseYears);
    const promiseDiff = Number.isFinite(promise) ? years - promise : null;

    return {
      years: Number(years.toFixed(1)),
      certainty,
      promiseDiff,
      message: getConfidenceMessage(certainty),
      confidenceClass: getConfidenceClass(certainty),
      colorVar: getConfidenceColorVar(certainty),
      adjustments,
    };
  }, [form]);

  return (
    <div className="min-h-screen flex flex-col pb-20">

      {/* Header */}
      <div className="border-b border-[var(--border)] sticky top-0 z-50" style={{ background: 'rgba(13,17,23,0.7)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green" />
            </div>
            <span className="font-bold text-lg tracking-tight">{'הצ\u05F3ק-אפ של חיים'}</span>
          </div>
          <a href="/" className="text-sm text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            {'חזרה לחיפוש'}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="db-card p-6">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-foreground">
              <ClipboardList className="w-5 h-5 text-green" />
              {'נתוני הפרויקט'}
            </h2>
            <p className="text-sm text-foreground-muted mb-6">{'הזן את הפרטים היבשים, המערכת תעשה את השאר.'}</p>

            <div className="space-y-4">
              {/* Address */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground-muted">{'כתובת הפרויקט'}</label>
                <input
                  type="text"
                  className="input-field text-right"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {/* Project Type + Tenants */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground-muted">{'סוג הפרויקט'}</label>
                  <select
                    className="input-field text-right"
                    value={form.projectType}
                    onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                  >
                    <option value="pinui">{'פינוי-בינוי (מתחם)'}</option>
                    <option value="tama">{'תמ״א 38/2 (בניין)'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground-muted">{'מספר דיירים'}</label>
                  <select
                    className="input-field text-right"
                    value={form.tenantCount}
                    onChange={(e) => setForm({ ...form, tenantCount: e.target.value })}
                  >
                    <option value="under100">{'עד 100 דיירים'}</option>
                    <option value="over100">{'מעל 100 דיירים'}</option>
                  </select>
                </div>
              </div>

              {/* Planning Status */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground-muted">{'סטטוס תכנוני (השלב המדויק)'}</label>
                <select
                  className="input-field text-right"
                  value={form.planningStatus}
                  onChange={(e) => setForm({ ...form, planningStatus: e.target.value })}
                >
                  {planningOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Signature Status */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground-muted">{'סטטוס חתימות'}</label>
                <select
                  className="input-field text-right"
                  value={form.signatureStatus}
                  onChange={(e) => setForm({ ...form, signatureStatus: e.target.value })}
                >
                  <option value="noMajority">{'אין רוב חוקי (פחות מ-67%)'}</option>
                  <option value="majority">{'יש רוב חוקי (מעל 67%)'}</option>
                  <option value="full">{'100% חתימות (כולם חתומים)'}</option>
                </select>
              </div>

              {/* Developer Promise */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground-muted">{'הבטחת היזם (מסירת מפתח)'}</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="לדוגמה: 5"
                    className="input-field text-right"
                    value={form.developerPromiseYears}
                    onChange={(e) => setForm({ ...form, developerPromiseYears: e.target.value })}
                  />
                  <span className="absolute left-4 top-3 text-xs text-foreground-muted">{'שנים'}</span>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                disabled={isScanning}
                className="w-full mt-4 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{
                  background: isScanning ? 'var(--bg-tertiary)' : 'var(--fg-primary)',
                  color: isScanning ? 'var(--fg-muted)' : 'var(--bg-primary)',
                  boxShadow: isScanning ? 'none' : '0 0 20px rgba(255,255,255,0.1)',
                }}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {'מבצע ניתוח...'}
                  </>
                ) : (
                  <>
                    {'בצע ניתוח היתכנות'}
                    <ChevronLeft className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results / Scanning State */}
        <div className="lg:col-span-7">

          {/* Scanning Animation */}
          {isScanning && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center db-card p-8 relative overflow-hidden">
              <div className="scan-line" />
              <div className="w-16 h-16 border-4 rounded-full animate-spin mb-8" style={{ borderColor: 'var(--green-glow)', borderTopColor: 'var(--green)' }} />
              <h3 className="text-xl font-medium text-foreground mb-2">{'מנתח נתונים...'}</h3>
              <p className="text-green font-mono text-sm pulse">
                {SCAN_STEPS[scanStepIndex]}
              </p>
            </div>
          )}

          {/* Waiting State */}
          {!isScanning && !showResults && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-foreground-muted border border-dashed border-[var(--border)] rounded-[var(--radius)]">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground-secondary">{'ממתין לנתונים'}</h3>
              <p className="text-sm max-w-xs mx-auto mt-2">{'הזן את פרטי הפרויקט ולחץ על כפתור הניתוח כדי לקבל את דוח האמת.'}</p>
            </div>
          )}

          {/* Results */}
          {!isScanning && showResults && calculation && (
            <div className="db-card p-8 fade-in-up">

              {/* Title + Certainty Score */}
              <div className="flex items-start justify-between mb-8 border-b border-[var(--border)] pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {'ניתוח היתכנות: '}{form.address || 'פרויקט ללא שם'}
                  </h2>
                  <p className="text-sm text-foreground-muted">
                    {'דוח נוצר בתאריך: '}{new Date().toLocaleDateString('he-IL')}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1">{'מדד וודאות'}</div>
                  <div className="text-4xl font-black font-mono" style={{ color: calculation.colorVar }}>
                    {calculation.certainty}%
                  </div>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="db-stat p-5">
                  <div className="flex items-center gap-2 text-foreground-muted text-sm mb-2">
                    <CalendarDays className="w-4 h-4" />
                    {'זמן ריאלי למפתח'}
                  </div>
                  <div className="db-stat-value text-3xl">
                    {calculation.years} <span className="text-lg font-medium text-foreground-muted">{'שנים'}</span>
                  </div>
                  <div className="text-xs text-foreground-muted mt-2">
                    {'כולל הליכי רישוי, תב"ע ובנייה (3 שנים)'}
                  </div>
                </div>

                <div className="db-stat p-5">
                  <div className="flex items-center gap-2 text-foreground-muted text-sm mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    {'בדיקת הבטחת יזם'}
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {calculation.promiseDiff === null ? (
                      <span className="text-foreground-muted">{'לא הוזן צפי יזם'}</span>
                    ) : calculation.promiseDiff > 0 ? (
                      <span style={{ color: 'var(--red)' }}>{'היזם אופטימי ב-'}{calculation.promiseDiff.toFixed(1)}{' שנים'}</span>
                    ) : (
                      <span style={{ color: 'var(--green)' }}>{'היזם ריאלי (שמרן ב-'}{Math.abs(calculation.promiseDiff).toFixed(1)}{' שנים)'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-8">
                <div className="confidence-bar">
                  <div className={`confidence-fill ${calculation.confidenceClass}`} style={{ width: `${calculation.certainty}%` }} />
                </div>
              </div>

              {/* Haim's Verdict */}
              <div className="db-card-green p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full" style={{ background: calculation.colorVar }} />
                <h3 className="font-bold text-lg text-foreground mb-3">{'השורה התחתונה של חיים'}</h3>
                <p className="text-foreground-secondary leading-relaxed text-sm md:text-base">
                  &ldquo;{calculation.message}&rdquo;
                </p>

                {calculation.adjustments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                    <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3">{'גורמים שהשפיעו על הציון'}</h4>
                    <ul className="space-y-2">
                      {calculation.adjustments.map((adj, i) => (
                        <li key={i} className="text-xs flex items-center gap-2" style={{ color: 'var(--gold-light)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} />
                          {adj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* CTA Section */}
              <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-right">
                  <h4 className="font-bold text-foreground">{'רוצה לדעת איפה המוקשים בחוזה?'}</h4>
                  <p className="text-sm text-foreground-muted mt-1">
                    {'אל תחתום על עסקה של מיליונים על עיוור. בוא לפגישת ייעוץ ממוקדת.'}
                    <br />
                    <span className="text-green">{'אני פנוי כל יום החל מ-20:00 בערב.'}</span>
                  </p>
                </div>
                <a
                  href={`mailto:contact@haim-checkup.co.il?subject=${encodeURIComponent('תיאום פגישה - ' + form.address)}&body=${encodeURIComponent('אני רוצה לתאם פגישת ייעוץ.')}`}
                  className="btn-green py-3 px-6 rounded-lg whitespace-nowrap"
                >
                  {'קבע פגישה (3,000 ש"ח)'}
                </a>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-4 text-center text-xs text-foreground-muted mt-auto">
        <span>{'הצ\u05F3ק-אפ של חיים'} </span>
        <span className="opacity-50">|</span>
        <span> {'מחשבון היתכנות להתחדשות עירונית'}</span>
      </div>
    </div>
  );
}
