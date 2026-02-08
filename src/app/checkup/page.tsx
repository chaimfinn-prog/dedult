'use client';

import { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Activity, Building2, CalendarDays,
  ChevronLeft, ClipboardList, AlertTriangle, ArrowRight, Loader2,
  Shield, TrendingUp, FileText, User, Briefcase,
} from 'lucide-react';

// --- Constants ---

const planningOptions = [
  { value: 'blueLine', label: 'קו כחול (בדיקת היתכנות)', baseYears: 8.5, stage: 'pre', desc: 'הפרויקט בשלב ראשוני של בדיקת היתכנות תכנונית. טרם הוגשה תוכנית למוסדות התכנון.' },
  { value: 'depositDiscussion', label: 'דיון להפקדה', baseYears: 7.5, stage: 'pre', desc: 'התוכנית הוגשה ונמצאת בדיון להפקדה בוועדה. שלב סטטוטורי פעיל אך ארוך.' },
  { value: 'tabaApproved', label: 'תב״ע מאושרת', baseYears: 7, stage: 'pre', desc: 'התב״ע אושרה. הסיכון התכנוני העקרוני הוסר, אך נותר פער רישוי משמעותי.' },
  { value: 'permitFiled', label: 'בקשה להיתר הוגשה/נקלטה', baseYears: 5.5, stage: 'permit', desc: 'בקשה להיתר בנייה הוגשה לוועדה המקומית. הפרויקט בשלב רישוי פעיל.' },
  { value: 'permitConditions', label: 'היתר בתנאים (החלטת ועדה)', baseYears: 4.5, stage: 'permit', desc: 'הוועדה אישרה היתר בתנאים. שלב מתקדם — נותר מילוי תנאים ותחילת ביצוע.' },
];

const SCAN_STEPS = [
  { label: 'אימות נתוני גוש וחלקה', icon: 'search' },
  { label: 'סריקת החלטות ועדה מקומית/מחוזית', icon: 'file' },
  { label: 'בדיקת איתנות פיננסית של היזם', icon: 'shield' },
  { label: 'ניתוח תקן 21 ורווחיות פרויקט', icon: 'chart' },
  { label: 'חישוב מקדמי סיכון מצטברים', icon: 'calc' },
  { label: 'עיבוד דוח סופי', icon: 'report' },
];

// --- Helpers ---

function getRiskLevel(certainty: number): { label: string; color: string; colorVar: string; barClass: string } {
  if (certainty < 50) return { label: 'גבוהה', color: 'text-danger', colorVar: 'var(--red)', barClass: 'confidence-low' };
  if (certainty < 75) return { label: 'בינונית', color: 'text-gold', colorVar: 'var(--gold)', barClass: 'confidence-medium' };
  return { label: 'נמוכה', color: 'text-green', colorVar: 'var(--green)', barClass: 'confidence-high' };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
}

// --- Suspense Wrapper ---

export default function CheckupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-foreground-muted">{'טוען...'}</div>}>
      <CheckupContent />
    </Suspense>
  );
}

// --- Main Component ---

function CheckupContent() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') ?? '';

  const [form, setForm] = useState({
    address: initialAddress,
    developerName: '',
    projectName: '',
    price: '',
    rent: '',
    apartmentSize: '',
    sqmAddition: '',
    projectType: 'pinui',
    tenantCount: 'under100',
    signatureStatus: 'noMajority',
    planningStatus: 'blueLine',
    developerPromiseYears: '',
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Scanning animation
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
      }, 700);
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
    const risks: string[] = [];

    // A. Timeline adjustments
    if (isPrePermit && form.tenantCount === 'over100') {
      years += 0.8;
      adjustments.push('+0.8 שנים: מורכבות משפטית (מעל 100 דיירים לפני היתר)');
    }
    if (form.signatureStatus === 'full') {
      years = Math.max(0, years - 1);
      adjustments.push('\u22121.0 שנה: הליך מואץ (100% חתימות)');
    }

    // B. Certainty score
    let certainty = 100;

    if (form.signatureStatus === 'noMajority') {
      certainty -= 30;
      risks.push('סיכון משפטי: אין רוב חוקי (\u221230%)');
    }

    if (form.projectType === 'pinui' && isPrePermit && form.planningStatus !== 'tabaApproved') {
      certainty -= 25;
      risks.push('סיכון תכנוני: פינוי-בינוי ללא תב״ע מאושרת (\u221225%)');
    }

    const sqmAdd = parseFloat(form.sqmAddition);
    const hasSqmRisk = Number.isFinite(sqmAdd) && sqmAdd > 12;
    if (hasSqmRisk) {
      certainty -= 15;
      risks.push('סיכון כלכלי (תקן 21): תוספת מ"ר חורגת מ-12 מ"ר (\u221215%)');
    }

    certainty = Math.max(0, Math.min(100, certainty));

    // C. Financial analysis
    const price = parseFloat(form.price);
    const rent = parseFloat(form.rent);
    const size = parseFloat(form.apartmentSize);
    const promise = parseFloat(form.developerPromiseYears);

    const annualYield = Number.isFinite(price) && Number.isFinite(rent) && price > 0
      ? ((rent * 12) / price) * 100
      : null;

    const pricePerSqm = Number.isFinite(price) && Number.isFinite(size) && size > 0
      ? price / size
      : null;

    const promiseDiff = Number.isFinite(promise) ? years - promise : null;

    return {
      years: Number(years.toFixed(1)),
      certainty,
      promiseDiff,
      annualYield: annualYield !== null ? Number(annualYield.toFixed(2)) : null,
      pricePerSqm: pricePerSqm !== null ? Math.round(pricePerSqm) : null,
      hasSqmRisk,
      sqmAdd: Number.isFinite(sqmAdd) ? sqmAdd : null,
      risk: getRiskLevel(certainty),
      adjustments,
      risks,
      planningDesc: planning.desc,
    };
  }, [form]);

  const displayProjectName = form.projectName || form.address || 'ללא שם';

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80')` }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.88) 50%, rgba(13,17,23,0.95) 100%)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border)] sticky top-0" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-green/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">THE REALITY CHECK</span>
              <span className="text-[10px] text-foreground-muted">by Haim Finn</span>
            </div>
          </div>
          <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            {'חזרה'}
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">

        {/* Right Column: Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="db-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{'נתוני הפרויקט'}</h2>
            </div>

            <div className="space-y-3">
              {/* Row: Developer + Project */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="שם היזם" value={form.developerName} onChange={(v) => updateField('developerName', v)} placeholder="לדוגמה: אזורים" />
                <Field label="שם הפרויקט" value={form.projectName} onChange={(v) => updateField('projectName', v)} placeholder="לדוגמה: פארק TLV" />
              </div>

              {/* Address */}
              <Field label="כתובת הפרויקט" value={form.address} onChange={(v) => updateField('address', v)} placeholder="עיר, רחוב ומספר" />

              {/* Row: Price + Rent */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="מחיר מבוקש (₪)" value={form.price} onChange={(v) => updateField('price', v)} type="number" placeholder="2,500,000" />
                <Field label="שכר דירה נוכחי (₪)" value={form.rent} onChange={(v) => updateField('rent', v)} type="number" placeholder="5,500" />
              </div>

              {/* Row: Size + Addition */}
              <div className="grid grid-cols-2 gap-3">
                <Field label='גודל דירה קיים (מ"ר)' value={form.apartmentSize} onChange={(v) => updateField('apartmentSize', v)} type="number" placeholder="75" />
                <Field label='תוספת מ"ר מובטחת' value={form.sqmAddition} onChange={(v) => updateField('sqmAddition', v)} type="number" placeholder="12" />
              </div>

              {/* Row: Type + Tenants */}
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="סוג פרויקט" value={form.projectType} onChange={(v) => updateField('projectType', v)} options={[
                  { value: 'pinui', label: 'פינוי-בינוי' },
                  { value: 'tama', label: 'תמ״א 38/2' },
                ]} />
                <SelectField label="מספר דיירים" value={form.tenantCount} onChange={(v) => updateField('tenantCount', v)} options={[
                  { value: 'under100', label: 'עד 100' },
                  { value: 'over100', label: 'מעל 100' },
                ]} />
              </div>

              {/* Planning Status */}
              <SelectField label="סטטוס תכנוני" value={form.planningStatus} onChange={(v) => updateField('planningStatus', v)} options={planningOptions.map((o) => ({ value: o.value, label: o.label }))} />

              {/* Signatures */}
              <SelectField label="סטטוס חתימות" value={form.signatureStatus} onChange={(v) => updateField('signatureStatus', v)} options={[
                { value: 'noMajority', label: 'אין רוב חוקי (פחות מ-67%)' },
                { value: 'majority', label: 'יש רוב חוקי (67%+)' },
                { value: 'full', label: '100% חתימות מלאות' },
              ]} />

              {/* Developer Promise */}
              <Field label="הצהרת היזם: מועד מסירה (שנים)" value={form.developerPromiseYears} onChange={(v) => updateField('developerPromiseYears', v)} type="number" placeholder="4" suffix="שנים" />

              {/* Button */}
              <button
                onClick={handleCalculate}
                disabled={isScanning}
                className="w-full mt-2 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
                style={{
                  background: isScanning ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)',
                  color: isScanning ? 'var(--fg-muted)' : '#fff',
                  boxShadow: isScanning ? 'none' : '0 0 24px var(--accent-glow)',
                }}
              >
                {isScanning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{'מבצע ניתוח...'}</>
                ) : (
                  <><Shield className="w-4 h-4" />{'הפק דוח Reality Check'}<ChevronLeft className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Left Column: Results */}
        <div className="lg:col-span-7">

          {/* Scanning State */}
          {isScanning && (
            <div className="db-card p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="scan-line" />
              <div className="radar-container mb-6">
                <div className="radar-ring" />
                <div className="radar-ring-2" />
                <div className="radar-ring-3" />
                <div className="radar-sweep" />
                <div className="radar-dot" style={{ top: '20%', right: '30%' }} />
                <div className="radar-dot" style={{ top: '60%', right: '70%', animationDelay: '0.5s' }} />
                <div className="radar-dot" style={{ top: '40%', right: '50%', animationDelay: '1s' }} />
              </div>
              <div className="w-full max-w-xs space-y-2">
                {SCAN_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs" style={{ opacity: scanStepIndex >= i ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{
                      background: scanStepIndex > i ? 'var(--green)' : scanStepIndex === i ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: scanStepIndex >= i ? '#fff' : 'var(--fg-dim)',
                    }}>
                      {scanStepIndex > i ? '\u2713' : i + 1}
                    </div>
                    <span className={scanStepIndex === i ? 'text-accent font-medium' : scanStepIndex > i ? 'text-green' : 'text-foreground-muted'}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idle State */}
          {!isScanning && !showResults && (
            <div className="db-card min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
              <div className="radar-container mb-6 opacity-20">
                <div className="radar-ring" />
                <div className="radar-ring-2" />
                <div className="radar-ring-3" />
              </div>
              <Activity className="w-10 h-10 mb-4 text-foreground-muted opacity-30" />
              <h3 className="text-base font-medium text-foreground-secondary mb-1">{'ממתין לנתוני הפרויקט'}</h3>
              <p className="text-xs text-foreground-muted max-w-xs">{'מלא את כל הפרמטרים ולחץ על ״הפק דוח״ כדי לקבל ניתוח Due Diligence ראשוני.'}</p>
            </div>
          )}

          {/* Report */}
          {!isScanning && showResults && calculation && (
            <div className="space-y-4 fade-in-up">

              {/* Report Header */}
              <div className="db-card-accent p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-semibold text-accent uppercase tracking-[0.15em] mb-1">THE REALITY CHECK</div>
                    <h2 className="text-xl font-bold text-foreground">
                      {'דוח ניתוח | פרויקט: '}{displayProjectName}
                    </h2>
                    <p className="text-xs text-foreground-muted mt-1">
                      {form.address && <>{form.address}{' | '}</>}
                      {'תאריך הפקה: '}{new Date().toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">{'Certainty Score'}</div>
                    <div className="text-4xl font-black font-mono" style={{ color: calculation.risk.colorVar }}>
                      {calculation.certainty}<span className="text-lg">%</span>
                    </div>
                  </div>
                </div>
                <div className="confidence-bar"><div className={`confidence-fill ${calculation.risk.barClass}`} style={{ width: `${calculation.certainty}%` }} /></div>
              </div>

              {/* 1. Executive Summary */}
              <div className="db-card p-5">
                <SectionTitle icon={<Briefcase className="w-4 h-4 text-accent" />} title="EXECUTIVE SUMMARY" subtitle="תמונת מצב" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <MetricBox label="מדד היתכנות" value={`${calculation.certainty}%`} color={calculation.risk.colorVar} />
                  <MetricBox label="צפי ריאלי למסירה" value={`${calculation.years} שנים`} color="var(--fg-primary)" />
                  <MetricBox
                    label="פער מול הצהרת יזם"
                    value={calculation.promiseDiff === null ? 'לא הוזן' : calculation.promiseDiff > 0 ? `+${calculation.promiseDiff.toFixed(1)} שנים` : `${calculation.promiseDiff.toFixed(1)} שנים`}
                    color={calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'var(--red)' : 'var(--green)'}
                  />
                </div>
                {calculation.promiseDiff !== null && calculation.promiseDiff > 0 && (
                  <div className="badge badge-danger mt-3 text-[11px]">
                    <AlertTriangle className="w-3 h-3" />
                    {'היזם אופטימי ב-'}{calculation.promiseDiff.toFixed(1)}{' שנים ביחס לצפי הריאלי'}
                  </div>
                )}
                {calculation.adjustments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1">
                    <div className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">{'התאמות לו״ז'}</div>
                    {calculation.adjustments.map((a, i) => (
                      <div key={i} className="text-xs text-foreground-muted flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-accent" />{a}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Risk Analysis */}
              <div className="db-card p-5">
                <SectionTitle icon={<AlertTriangle className="w-4 h-4 text-gold" />} title="RISK ANALYSIS" subtitle="ניתוח סיכונים" />
                <div className="space-y-4 mt-4 text-sm">

                  <div>
                    <div className="text-xs font-semibold text-foreground-secondary mb-1">{'סטטוס סטטוטורי'}</div>
                    <p className="text-xs text-foreground-muted leading-relaxed">{calculation.planningDesc}</p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-foreground-secondary mb-1">{'ניתוח תוספת מ"ר'}</div>
                    {calculation.hasSqmRisk ? (
                      <div className="db-card-gold p-3 text-xs text-foreground-muted leading-relaxed">
                        <span className="font-semibold" style={{ color: 'var(--gold-light)' }}>{'אזהרת תקן 21: '}</span>
                        {'התוספת המובטחת ('}{calculation.sqmAdd}{' מ"ר) חורגת מהסטנדרט הכלכלי (12 מ"ר). נתון זה מעלה את רמת הסיכון הפיננסי של הפרויקט ועלול להקשות על קבלת ליווי בנקאי.'}
                      </div>
                    ) : calculation.sqmAdd !== null ? (
                      <div className="db-card-green p-3 text-xs text-foreground-muted leading-relaxed">
                        {'התמורה המובטחת ('}{calculation.sqmAdd}{' מ"ר) תואמת את הסטנדרט המקובל ואת תקן 21.'}
                      </div>
                    ) : (
                      <p className="text-xs text-foreground-muted">{'לא הוזנו נתוני תוספת.'}</p>
                    )}
                  </div>

                  {form.developerName && (
                    <div>
                      <div className="text-xs font-semibold text-foreground-secondary mb-1">{'הערת יזם'}</div>
                      <div className="db-card p-3 text-xs text-foreground-muted leading-relaxed">
                        {'הוזן היזם: '}<span className="font-semibold text-foreground-secondary">{form.developerName}</span>{'. '}
                        {'במסגרת עבודתי השוטפת אני מקיים קשרים עם החברות המובילות בשוק ומכיר את איתנותן הפיננסית. ניתוח פרטני על יכולות הביצוע של יזם זה יינתן בפגישה.'}
                      </div>
                    </div>
                  )}

                  {calculation.risks.length > 0 && (
                    <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
                      <div className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">{'גורמי סיכון שזוהו'}</div>
                      {calculation.risks.map((r, i) => (
                        <div key={i} className="text-xs flex items-center gap-2" style={{ color: 'var(--gold-light)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} />{r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Financial Overview */}
              <div className="db-card p-5">
                <SectionTitle icon={<TrendingUp className="w-4 h-4 text-green" />} title="FINANCIAL OVERVIEW" subtitle="ניתוח כלכלי" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="db-stat p-4">
                    <div className="db-stat-label">{'תשואה שנתית נגזרת'}</div>
                    <div className="db-stat-value" style={{ color: calculation.annualYield !== null && calculation.annualYield < 3 ? 'var(--gold)' : 'var(--green)' }}>
                      {calculation.annualYield !== null ? `${calculation.annualYield}%` : '\u2014'}
                    </div>
                  </div>
                  <div className="db-stat p-4">
                    <div className="db-stat-label">{'שווי למ"ר (מצב קיים)'}</div>
                    <div className="db-stat-value">
                      {calculation.pricePerSqm !== null ? formatCurrency(calculation.pricePerSqm) : '\u2014'}
                    </div>
                  </div>
                </div>
                {calculation.annualYield !== null && (
                  <p className="text-xs text-foreground-muted mt-3 leading-relaxed">
                    {calculation.annualYield < 3
                      ? 'התשואה הנמוכה מעידה שהמחיר כבר מגלם חלק מעליית הערך הצפויה. יש לבחון אם הפוטנציאל העתידי מצדיק את הפרמיה.'
                      : 'התשואה תואמת את ממוצע השוק. המחיר משקף את המצב הנוכחי עם פוטנציאל לעליית ערך בהתאם להתקדמות הסטטוטורית.'}
                  </p>
                )}
              </div>

              {/* 4. Professional Verdict */}
              <div className="db-card p-5">
                <SectionTitle icon={<FileText className="w-4 h-4 text-foreground-muted" />} title="PROFESSIONAL VERDICT" subtitle="סיכום המומחה" />
                <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: calculation.risk.colorVar, background: `color-mix(in srgb, ${calculation.risk.colorVar} 5%, transparent)` }}>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {'על בסיס הנתונים שהוזנו, העסקה מאופיינת ברמת סיכון '}
                    <span className="font-bold" style={{ color: calculation.risk.colorVar }}>{calculation.risk.label}</span>
                    {'. '}
                    {'הפערים בין הסטטוס התכנוני להבטחות שניתנו, לצד המורכבות הכלכלית, מחייבים בדיקת נאותות מעמיקה (Due Diligence).'}
                  </p>
                </div>
              </div>

              {/* CTA - Meeting */}
              <div className="db-card p-5">
                <div className="flex flex-col md:flex-row items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] border-2 border-accent/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <User className="w-7 h-7 text-accent" />
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="font-bold text-foreground text-sm">{'חיים פיין | שמאי מקרקעין, כלכלן ומנהל התחדשות עירונית'}</h4>
                    <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                      {'אני מזמין אותך לפגישת ייעוץ אסטרטגית, בה ננתח את החוזה, המפרט הטכני ואת פרופיל היזם. '}
                      {'פגישת ייעוץ ממוקדת של 45 דקות.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs mt-2">
                      <CalendarDays className="w-3.5 h-3.5 text-green" />
                      <span className="text-green">{'זמין כל יום החל מ-20:00 בערב'}</span>
                      <span className="text-foreground-muted">{'|'}</span>
                      <span className="text-foreground-muted font-semibold">{'עלות: 3,000 \u20AA'}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:contact@haim-checkup.co.il?subject=${encodeURIComponent('תיאום פגישה | ' + displayProjectName)}&body=${encodeURIComponent('שלום חיים,\nאני מעוניין לתאם פגישת ייעוץ לפרויקט: ' + displayProjectName + '\nכתובת: ' + form.address + '\n\nתודה.')}`}
                    className="btn-primary py-3 px-5 rounded-lg whitespace-nowrap text-sm flex items-center gap-2"
                  >
                    {'תיאום פגישה ותשלום'}
                    <ChevronLeft className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{'בדיקת נאותות ראשונית להתחדשות עירונית'}</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{'by Haim Finn'}</span>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function Field({ label, value, onChange, placeholder, type = 'text', suffix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-foreground-muted">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          className="input-field text-right text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="absolute left-3 top-2.5 text-[11px] text-foreground-muted">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-foreground-muted">{label}</label>
      <select className="input-field text-right text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.12em]">{title}</div>
        <div className="text-xs font-semibold text-foreground-secondary">{subtitle}</div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="db-stat p-3 text-center">
      <div className="db-stat-label text-[10px]">{label}</div>
      <div className="db-stat-value text-lg" style={{ color }}>{value}</div>
    </div>
  );
}
