'use client';

import { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Activity, Building2, CalendarDays,
  ChevronLeft, ClipboardList, AlertTriangle, ArrowRight, Loader2,
  Shield, TrendingUp, FileText, User, Briefcase, MapPin,
  ExternalLink, CheckCircle2, Clock, Search, XCircle, Info,
  Globe, Phone, Mail, Send, Home, DollarSign, Timer,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

// =============================================
// PLANNING OPTIONS — Updated timelines to demolition
// =============================================

const planningOptionsPinui = [
  { value: 'initialPlanning', label: 'תכנון ראשוני של תב״ע', labelEn: 'Initial TBA Planning', baseYears: 7, stage: 'planning', desc: 'הפרויקט בשלב תכנון ראשוני של תוכנית בניין עיר. שלב מוקדם מאוד — טרם הוגשה תוכנית סטטוטורית למוסדות התכנון.', descEn: 'Project is at the initial urban building plan phase. Very early stage — no statutory plan has been submitted yet.' },
  { value: 'thresholdConditions', label: 'קיום תנאי סף', labelEn: 'Threshold Conditions Met', baseYears: 6, stage: 'planning', desc: 'הפרויקט עמד בתנאי הסף הנדרשים להמשך קידום התוכנית. שלב משמעותי אך עדיין רחוק מהריסה.', descEn: 'Threshold conditions have been met. A meaningful milestone, but demolition is still far off.' },
  { value: 'depositPublication', label: 'פרסום להפקדה', labelEn: 'Published for Deposit', baseYears: 5, stage: 'planning', desc: 'התוכנית פורסמה להפקדה. שלב סטטוטורי פעיל — הציבור רשאי להגיש התנגדויות, מה שעלול לעכב.', descEn: 'Plan published for deposit. Active statutory phase — public may file objections, causing potential delays.' },
  { value: 'tabaApproved', label: 'תב״ע מאושרת', labelEn: 'TBA Approved', baseYears: 4, stage: 'planning', desc: 'תוכנית בניין העיר אושרה. הסיכון התכנוני העקרוני הוסר, אך נותרו שלבי עיצוב ורישוי משמעותיים.', descEn: 'Urban building plan approved. Major planning risk is gone, but significant design and permit phases remain.' },
  { value: 'designApproved', label: 'תוכנית עיצוב מאושרת', labelEn: 'Design Plan Approved', baseYears: 3, stage: 'planning', desc: 'תוכנית העיצוב האדריכלית אושרה. הפרויקט בשלב מתקדם ומתקרב לשלב הרישוי והיתר הבנייה.', descEn: 'Architectural design plan approved. Project at advanced stage, approaching permit issuance.' },
];

const planningOptionsTama = [
  { value: 'permitFiled', label: 'בקשה הוגשה', labelEn: 'Permit Filed', baseYears: 2.5, stage: 'permit', desc: 'בקשה להיתר בנייה הוגשה לוועדה המקומית. הפרויקט בשלב רישוי ראשוני במסלול תמ"א 38.', descEn: 'Building permit application filed. Project in initial licensing phase under TAMA 38.' },
  { value: 'permitAccepted', label: 'בקשה נקלטה', labelEn: 'Application Accepted', baseYears: 2, stage: 'permit', desc: 'הבקשה נקלטה במערכת הרישוי ונמצאת בבדיקה פעילה של הוועדה המקומית.', descEn: 'Application accepted into licensing system, under active local committee review.' },
  { value: 'selfLicensing', label: 'רישוי עצמי (אדריכל מורשה להיתר)', labelEn: 'Self-Licensing (Authorized Architect)', baseYears: 1.5, stage: 'permit', desc: 'הפרויקט במסלול רישוי עצמי בליווי אדריכל מורשה להיתר. מסלול מקוצר ומהיר יחסית.', descEn: 'Project on self-licensing track with authorized architect. Shortened, relatively fast track.' },
  { value: 'permitConditions', label: 'היתר בתנאים', labelEn: 'Conditional Permit', baseYears: 1.5, stage: 'permit', desc: 'הוועדה אישרה היתר בנייה בתנאים. שלב מתקדם — נותר מילוי תנאים והכנות אחרונות.', descEn: 'Committee approved conditional permit. Advanced stage — conditions fulfillment and final preparations remain.' },
  { value: 'fullPermit', label: 'היתר מלא', labelEn: 'Full Permit', baseYears: 0.5, stage: 'permit', desc: 'היתר בנייה מלא הוצא. הפרויקט מוכן להריסת הבניין הישן ותחילת בנייה — שלב סופי.', descEn: 'Full building permit issued. Project ready for demolition — final stage.' },
];

function getPlanningOptions(projectType: string) {
  return projectType === 'tama' ? planningOptionsTama : planningOptionsPinui;
}

const allPlanningOptions = [...planningOptionsPinui, ...planningOptionsTama];

const SCAN_STEPS = [
  { label: 'אימות נתוני גוש וחלקה', labelEn: 'Verifying parcel data' },
  { label: 'סריקת מאגר תוכניות מינהל התכנון', labelEn: 'Scanning planning database' },
  { label: 'אימות סטטוס תכנוני', labelEn: 'Verifying planning status' },
  { label: 'בדיקת איתנות פיננסית של היזם', labelEn: 'Checking developer financials' },
  { label: 'ניתוח תקן 21 ורווחיות פרויקט', labelEn: 'Analyzing Standard 21' },
  { label: 'חישוב מקדמי סיכון מצטברים', labelEn: 'Computing risk factors' },
  { label: 'עיבוד דוח סופי', labelEn: 'Generating final report' },
];

// =============================================
// Types
// =============================================

interface PlanningRecord {
  id: number; complexNumber: string; city: string; complexName: string;
  existingUnits: number; addedUnits: number; proposedUnits: number;
  declarationDate: string; planNumber: string; mavatLink: string; govmapLink: string;
  totalPermits: number; track: string; approvalYear: string; inExecution: string; status: string;
}

interface DeveloperResult {
  name: string; tier: string; tierLabel: string; summary: string; specialties: string[];
  totalProjects: number; inConstruction: number; delivered: number; inPlanning: number;
  rating: string; madadLink: string; website: string | null;
}

interface DeveloperResponse {
  query: string; found: boolean; results: DeveloperResult[]; source: string; duns100Link: string;
}

// =============================================
// Helpers
// =============================================

function getRiskLevel(certainty: number): { label: string; labelEn: string; color: string; colorVar: string; barClass: string } {
  if (certainty < 50) return { label: 'גבוהה', labelEn: 'High', color: 'text-danger', colorVar: 'var(--red)', barClass: 'confidence-low' };
  if (certainty < 75) return { label: 'בינונית', labelEn: 'Medium', color: 'text-gold', colorVar: 'var(--gold)', barClass: 'confidence-medium' };
  return { label: 'נמוכה', labelEn: 'Low', color: 'text-green', colorVar: 'var(--green)', barClass: 'confidence-high' };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s.includes('מאושרת') || s.includes('אישור') || s.includes('במימוש')) return <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0" />;
  if (s.includes('רישוי') || s.includes('היתר') || s.includes('הפקדה')) return <Clock className="w-4 h-4 text-gold flex-shrink-0" />;
  return <Info className="w-4 h-4 text-accent flex-shrink-0" />;
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('מאושרת') || s.includes('אישור') || s.includes('במימוש')) return 'var(--green)';
  if (s.includes('רישוי') || s.includes('היתר') || s.includes('הפקדה')) return 'var(--gold)';
  return 'var(--accent)';
}

// =============================================
// Suspense Wrapper
// =============================================

export default function CheckupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-foreground-muted">{'טוען...'}</div>}>
      <CheckupContent />
    </Suspense>
  );
}

// =============================================
// Main Component
// =============================================

function CheckupContent() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') ?? '';
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

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
    planningStatus: 'initialPlanning',
    objection: 'none',
    toldYears: '',
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const [planningData, setPlanningData] = useState<PlanningRecord[]>([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [developerData, setDeveloperData] = useState<DeveloperResponse | null>(null);
  const [developerLoading, setDeveloperLoading] = useState(false);

  // CTA state
  const [activeCta, setActiveCta] = useState<null | 'consultation' | 'report' | 'broker'>(null);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '' });
  const [investmentForm, setInvestmentForm] = useState({ budget: '', city: '', years: '' });
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [ctaSending, setCtaSending] = useState(false);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'projectType') {
        const opts = getPlanningOptions(value);
        if (!opts.find(o => o.value === prev.planningStatus)) {
          next.planningStatus = opts[0].value;
        }
      }
      return next;
    });
  }, []);

  const fetchPlanningData = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setPlanningLoading(true);
    try {
      const res = await fetch(`/api/planning?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) { const data = await res.json(); setPlanningData(data.records ?? []); }
    } catch { /* silent */ }
    setPlanningLoading(false);
  }, []);

  const fetchDeveloperData = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setDeveloperLoading(true);
    try {
      const res = await fetch(`/api/developer?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) { const data = await res.json(); setDeveloperData(data); }
    } catch { /* silent */ }
    setDeveloperLoading(false);
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
    setPlanningData([]);
    setDeveloperData(null);
    setActiveCta(null);
    setCtaSubmitted(false);
    setIsScanning(true);
    const searchQuery = form.projectName || form.address || '';
    if (searchQuery) fetchPlanningData(searchQuery);
    if (form.developerName) fetchDeveloperData(form.developerName);
  };

  // CTA submit
  const handleCtaSubmit = async () => {
    if (!contactForm.name || !contactForm.phone || !contactForm.email) return;
    if (activeCta === 'broker' && (!investmentForm.budget || !investmentForm.city || !investmentForm.years)) return;
    setCtaSending(true);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeCta,
          formData: form,
          reportData: calculation ? { certainty: calculation.certainty, years: calculation.years, gap: calculation.promiseDiff } : null,
          contactInfo: contactForm,
          investmentInfo: activeCta === 'broker' ? investmentForm : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Also open mailto as fallback
        if (data.mailto) window.open(data.mailto, '_blank');
      }
      setCtaSubmitted(true);
    } catch {
      setCtaSubmitted(true);
    }
    setCtaSending(false);
  };

  // =============================================
  // Core Calculation Algorithm
  // =============================================

  const calculation = useMemo(() => {
    const planning = allPlanningOptions.find((o) => o.value === form.planningStatus);
    if (!planning) return null;

    let years = planning.baseYears;
    const adjustments: { he: string; en: string }[] = [];
    const risks: { he: string; en: string }[] = [];

    // A. Objection / Appeal adjustments
    if (form.objection === 'objection') {
      years += 1;
      adjustments.push({ he: '+1.0 שנה: הוגשה התנגדות (עיכוב צפוי בהליך הסטטוטורי)', en: '+1.0 year: Objection filed (expected statutory delay)' });
    } else if (form.objection === 'appeal') {
      years += 1.5;
      adjustments.push({ he: '+1.5 שנים: הוגש ערר (עיכוב משמעותי בהליך)', en: '+1.5 years: Appeal filed (significant delay)' });
    } else if (form.objection === 'both') {
      years += 2;
      adjustments.push({ he: '+2.0 שנים: התנגדות + ערר (עיכוב מהותי)', en: '+2.0 years: Objection + Appeal (major delay)' });
    }

    // B. Tenant count adjustment (pre-permit only)
    if (planning.stage === 'planning' && form.tenantCount === 'over100') {
      years += 0.8;
      adjustments.push({ he: '+0.8 שנים: מורכבות משפטית (מעל 100 דיירים לפני היתר)', en: '+0.8 years: Legal complexity (over 100 tenants pre-permit)' });
    }

    // C. Signature bonus
    if (form.signatureStatus === 'full') {
      years = Math.max(0.5, years - 1);
      adjustments.push({ he: '−1.0 שנה: הליך מואץ (100% חתימות)', en: '−1.0 year: Accelerated process (100% signatures)' });
    }

    // D. Certainty score
    let certainty = 100;

    if (form.signatureStatus === 'noMajority') {
      certainty -= 30;
      risks.push({ he: 'סיכון משפטי: אין רוב חוקי (−30%)', en: 'Legal risk: No legal majority (−30%)' });
    }

    if (form.projectType === 'pinui' && planning.stage === 'planning' && form.planningStatus !== 'tabaApproved' && form.planningStatus !== 'designApproved') {
      certainty -= 25;
      risks.push({ he: 'סיכון תכנוני: פינוי-בינוי ללא תב״ע מאושרת (−25%)', en: 'Planning risk: Pinui-Binui without approved TBA (−25%)' });
    }

    const sqmAdd = parseFloat(form.sqmAddition);
    const hasSqmRisk = Number.isFinite(sqmAdd) && sqmAdd > 12;
    if (hasSqmRisk) {
      certainty -= 15;
      risks.push({ he: 'סיכון כלכלי (תקן 21): תוספת מ"ר חורגת מ-12 מ"ר (−15%)', en: 'Financial risk (Standard 21): Sqm addition exceeds 12 sqm (−15%)' });
    }

    if (form.objection === 'objection') {
      certainty -= 10;
      risks.push({ he: 'סיכון סטטוטורי: הוגשה התנגדות (−10%)', en: 'Statutory risk: Objection filed (−10%)' });
    } else if (form.objection === 'appeal') {
      certainty -= 15;
      risks.push({ he: 'סיכון סטטוטורי: הוגש ערר (−15%)', en: 'Statutory risk: Appeal filed (−15%)' });
    } else if (form.objection === 'both') {
      certainty -= 20;
      risks.push({ he: 'סיכון סטטוטורי: התנגדות + ערר (−20%)', en: 'Statutory risk: Objection + Appeal (−20%)' });
    }

    certainty = Math.max(0, Math.min(100, certainty));

    // E. Financial analysis
    const price = parseFloat(form.price);
    const rent = parseFloat(form.rent);
    const size = parseFloat(form.apartmentSize);
    const told = parseFloat(form.toldYears);

    const annualYield = Number.isFinite(price) && Number.isFinite(rent) && price > 0
      ? ((rent * 12) / price) * 100 : null;

    const pricePerSqm = Number.isFinite(price) && Number.isFinite(size) && size > 0
      ? price / size : null;

    const promiseDiff = Number.isFinite(told) ? Number((years - told).toFixed(1)) : null;

    return {
      years: Number(years.toFixed(1)),
      certainty,
      promiseDiff,
      toldYears: Number.isFinite(told) ? told : null,
      annualYield: annualYield !== null ? Number(annualYield.toFixed(2)) : null,
      pricePerSqm: pricePerSqm !== null ? Math.round(pricePerSqm) : null,
      hasSqmRisk,
      sqmAdd: Number.isFinite(sqmAdd) ? sqmAdd : null,
      risk: getRiskLevel(certainty),
      adjustments,
      risks,
      planningDesc: planning.desc,
      planningDescEn: planning.descEn,
    };
  }, [form]);

  const displayProjectName = form.projectName || form.address || t('ללא שם', 'Unnamed');

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* Background — UNCHANGED */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80">
          <source src="https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80')` }} />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
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
              <span className="text-[10px] text-foreground-muted">{t('חיים פיין', 'Haim Finn')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/about" className="text-xs text-foreground-muted hover:text-foreground transition-colors">{t('אודות', 'About')}</a>
            <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">

        {/* ============================== */}
        {/* RIGHT COLUMN: INPUTS          */}
        {/* ============================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="db-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{t('נתוני הפרויקט', 'Project Data')}</h2>
            </div>

            <div className="space-y-3">
              {/* Project Type */}
              <SelectField label={t('סוג פרויקט', 'Project Type')} value={form.projectType} onChange={(v) => updateField('projectType', v)} options={[
                { value: 'pinui', label: t('פינוי-בינוי', 'Pinui-Binui') },
                { value: 'tama', label: t('תמ״א 38/2', 'TAMA 38/2') },
              ]} />

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('שם היזם / מוכר', 'Developer / Seller')} value={form.developerName} onChange={(v) => updateField('developerName', v)} placeholder={t('לדוגמה: אזורים', 'e.g. Azorim')} />
                <Field label={t('שם הפרויקט', 'Project Name')} value={form.projectName} onChange={(v) => updateField('projectName', v)} placeholder={t('לדוגמה: פארק TLV', 'e.g. Park TLV')} />
              </div>

              <Field label={t('כתובת הפרויקט', 'Project Address')} value={form.address} onChange={(v) => updateField('address', v)} placeholder={t('עיר, רחוב ומספר', 'City, street, number')} />

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('מחיר מבוקש (₪)', 'Asking Price (₪)')} value={form.price} onChange={(v) => updateField('price', v)} type="number" placeholder="2,500,000" />
                <Field label={t('שכר דירה נוכחי (₪)', 'Current Rent (₪)')} value={form.rent} onChange={(v) => updateField('rent', v)} type="number" placeholder="5,500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('גודל דירה קיים (מ"ר)', 'Current Size (sqm)')} value={form.apartmentSize} onChange={(v) => updateField('apartmentSize', v)} type="number" placeholder="75" />
                <Field label={t('תוספת מ"ר מובטחת', 'Promised Sqm Addition')} value={form.sqmAddition} onChange={(v) => updateField('sqmAddition', v)} type="number" placeholder="12" />
              </div>

              <SelectField label={t('מספר דיירים', 'Number of Tenants')} value={form.tenantCount} onChange={(v) => updateField('tenantCount', v)} options={[
                { value: 'under100', label: t('עד 100', 'Up to 100') },
                { value: 'over100', label: t('מעל 100', 'Over 100') },
              ]} />

              {/* Planning Status */}
              <SelectField label={form.projectType === 'tama' ? t('שלב רישוי (תמ"א 38)', 'Permit Stage (TAMA 38)') : t('שלב תכנוני', 'Planning Stage')} value={form.planningStatus} onChange={(v) => updateField('planningStatus', v)} options={getPlanningOptions(form.projectType).map((o) => ({ value: o.value, label: lang === 'he' ? o.label : o.labelEn }))} />

              {/* Objection / Appeal — NEW */}
              <SelectField label={t('התנגדות / ערר', 'Objection / Appeal')} value={form.objection} onChange={(v) => updateField('objection', v)} options={[
                { value: 'none', label: t('לא הוגשה התנגדות', 'No objection filed') },
                { value: 'objection', label: t('הוגשה התנגדות', 'Objection filed') },
                { value: 'appeal', label: t('הוגש ערר', 'Appeal filed') },
                { value: 'both', label: t('התנגדות + ערר', 'Objection + Appeal') },
              ]} />

              <SelectField label={t('סטטוס חתימות', 'Signature Status')} value={form.signatureStatus} onChange={(v) => updateField('signatureStatus', v)} options={[
                { value: 'noMajority', label: t('אין רוב חוקי (פחות מ-67%)', 'No legal majority (<67%)') },
                { value: 'majority', label: t('יש רוב חוקי (67%+)', 'Legal majority (67%+)') },
                { value: 'full', label: t('100% חתימות מלאות', '100% full signatures') },
              ]} />

              {/* "What you were told" — renamed from developer promise */}
              <Field label={t('מה נאמר לך? כמה שנים עד הריסה', 'What were you told? Years to demolition')} value={form.toldYears} onChange={(v) => updateField('toldYears', v)} type="number" placeholder={t('לדוגמה: 3', 'e.g. 3')} suffix={t('שנים', 'years')} />

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
                  <><Loader2 className="w-4 h-4 animate-spin" />{t('מנתח...', 'Analyzing...')}</>
                ) : (
                  <><Shield className="w-4 h-4" />{t('הפק דוח Reality Check', 'Generate Reality Check')}<ChevronLeft className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ============================== */}
        {/* LEFT COLUMN: RESULTS          */}
        {/* ============================== */}
        <div className="lg:col-span-7">

          {/* Scanning State — UNCHANGED */}
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
                      {lang === 'he' ? step.label : step.labelEn}
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
              <h3 className="text-base font-medium text-foreground-secondary mb-1">{t('ממתין לנתוני הפרויקט', 'Waiting for project data')}</h3>
              <p className="text-xs text-foreground-muted max-w-xs">{t('מלא את כל הפרמטרים ולחץ על ״הפק דוח״ כדי לקבל ניתוח מקצועי.', 'Fill in all parameters and click Generate to receive a professional analysis.')}</p>
            </div>
          )}

          {/* ============================== */}
          {/* THE REPORT                     */}
          {/* ============================== */}
          {!isScanning && showResults && calculation && (
            <div className="space-y-4 fade-in-up">

              {/* Report Header */}
              <div className="db-card-accent p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[10px] font-semibold text-accent uppercase tracking-[0.15em] mb-1">THE REALITY CHECK</div>
                    <h2 className="text-xl font-bold text-foreground">
                      {t('דוח ניתוח | פרויקט: ', 'Analysis Report | Project: ')}{displayProjectName}
                    </h2>
                    <p className="text-xs text-foreground-muted mt-1">
                      {form.address && <>{form.address}{' | '}</>}
                      {t('תאריך הפקה: ', 'Generated: ')}{new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Planning Verification */}
              <PlanningVerificationSection
                planningData={planningData}
                planningLoading={planningLoading}
                address={form.address}
                projectName={form.projectName}
                onSearch={fetchPlanningData}
                reportedStatus={allPlanningOptions.find(o => o.value === form.planningStatus)?.label ?? ''}
                lang={lang}
                t={t}
              />

              {/* 2. Developer Profile */}
              <DeveloperProfileSection
                developerData={developerData}
                developerLoading={developerLoading}
                developerName={form.developerName}
                onSearch={fetchDeveloperData}
                lang={lang}
                t={t}
              />

              {/* 3. Risk Analysis */}
              <div className="db-card p-5">
                <SectionTitle icon={<AlertTriangle className="w-4 h-4 text-gold" />} title={t('ניתוח סיכונים', 'Risk Analysis')} />
                <div className="space-y-4 mt-4 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-foreground-secondary mb-1">{t('סטטוס סטטוטורי (לפי דיווח)', 'Statutory Status (as reported)')}</div>
                    <p className="text-xs text-foreground-muted leading-relaxed">{lang === 'he' ? calculation.planningDesc : calculation.planningDescEn}</p>
                  </div>

                  {/* Sqm analysis */}
                  <div>
                    <div className="text-xs font-semibold text-foreground-secondary mb-1">{t('ניתוח תוספת מ"ר', 'Sqm Addition Analysis')}</div>
                    {calculation.hasSqmRisk ? (
                      <div className="db-card-gold p-3 text-xs text-foreground-muted leading-relaxed">
                        <span className="font-semibold" style={{ color: 'var(--gold-light)' }}>{t('אזהרת תקן 21: ', 'Standard 21 Warning: ')}</span>
                        {t(
                          `התוספת המובטחת (${calculation.sqmAdd} מ"ר) חורגת מהסטנדרט הכלכלי (12 מ"ר). נתון זה מעלה את רמת הסיכון הפיננסי.`,
                          `The promised addition (${calculation.sqmAdd} sqm) exceeds the economic standard (12 sqm). This raises financial risk.`
                        )}
                      </div>
                    ) : calculation.sqmAdd !== null ? (
                      <div className="db-card-green p-3 text-xs text-foreground-muted leading-relaxed">
                        {t(
                          `התמורה המובטחת (${calculation.sqmAdd} מ"ר) תואמת את הסטנדרט המקובל ואת תקן 21.`,
                          `The promised addition (${calculation.sqmAdd} sqm) aligns with market standard and Standard 21.`
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-foreground-muted">{t('לא הוזנו נתוני תוספת.', 'No addition data entered.')}</p>
                    )}
                  </div>

                  {calculation.risks.length > 0 && (
                    <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
                      <div className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">{t('גורמי סיכון שזוהו', 'Identified Risk Factors')}</div>
                      {calculation.risks.map((r, i) => (
                        <div key={i} className="text-xs flex items-center gap-2" style={{ color: 'var(--gold-light)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} />{lang === 'he' ? r.he : r.en}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Financial Overview */}
              <div className="db-card p-5">
                <SectionTitle icon={<TrendingUp className="w-4 h-4 text-green" />} title={t('ניתוח כלכלי', 'Financial Overview')} />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="db-stat p-4">
                    <div className="db-stat-label">{t('תשואה שנתית נגזרת', 'Derived Annual Yield')}</div>
                    <div className="db-stat-value" style={{ color: calculation.annualYield !== null && calculation.annualYield < 3 ? 'var(--gold)' : 'var(--green)' }}>
                      {calculation.annualYield !== null ? `${calculation.annualYield}%` : '\u2014'}
                    </div>
                  </div>
                  <div className="db-stat p-4">
                    <div className="db-stat-label">{t('שווי למ"ר (מצב קיים)', 'Price per Sqm (current)')}</div>
                    <div className="db-stat-value">
                      {calculation.pricePerSqm !== null ? formatCurrency(calculation.pricePerSqm) : '\u2014'}
                    </div>
                  </div>
                </div>
                {calculation.annualYield !== null && (
                  <p className="text-xs text-foreground-muted mt-3 leading-relaxed">
                    {calculation.annualYield < 3
                      ? t('התשואה הנמוכה מעידה שהמחיר כבר מגלם חלק מעליית הערך הצפויה.', 'Low yield suggests the price already factors in expected appreciation.')
                      : t('התשואה תואמת את ממוצע השוק. המחיר משקף את המצב הנוכחי.', 'Yield aligns with market average. Price reflects current conditions.')}
                  </p>
                )}
              </div>

              {/* ====================================== */}
              {/* 5. THE BIG REVEAL — Score + Timeline   */}
              {/* ====================================== */}
              <div className="db-card-accent p-6">
                <div className="text-center mb-6">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2">{t('תוצאות הניתוח', 'ANALYSIS RESULTS')}</div>
                  <h3 className="text-lg font-bold text-foreground">{t('הפער בין מה שנאמר לך למציאות', 'The Gap Between What You Were Told and Reality')}</h3>
                </div>

                {/* The Gap Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* What you were told */}
                  <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(210, 153, 34, 0.08)', border: '1px solid rgba(210, 153, 34, 0.2)' }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--gold-light)' }}>{t('מה נאמר לך', 'What You Were Told')}</div>
                    <div className="text-4xl font-black font-mono" style={{ color: 'var(--gold-light)' }}>
                      {calculation.toldYears !== null ? calculation.toldYears : '?'}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">{t('שנים להריסה', 'years to demolition')}</div>
                  </div>

                  {/* The Gap */}
                  <div className="rounded-xl p-5 text-center flex flex-col items-center justify-center" style={{
                    background: calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'rgba(248, 81, 73, 0.1)' : 'rgba(63, 185, 80, 0.1)',
                    border: `1px solid ${calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'rgba(248, 81, 73, 0.3)' : 'rgba(63, 185, 80, 0.3)'}`,
                  }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'var(--red)' : 'var(--green)' }}>
                      {t('הפער', 'THE GAP')}
                    </div>
                    <div className="text-4xl font-black font-mono" style={{ color: calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'var(--red)' : 'var(--green)' }}>
                      {calculation.promiseDiff !== null
                        ? (calculation.promiseDiff > 0 ? `+${calculation.promiseDiff}` : `${calculation.promiseDiff}`)
                        : '\u2014'}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">{t('שנים', 'years')}</div>
                  </div>

                  {/* Reality */}
                  <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(91, 141, 238, 0.08)', border: '1px solid rgba(91, 141, 238, 0.25)' }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2 text-accent">{t('הצפי הריאלי האמיתי', 'The Real Expectation')}</div>
                    <div className="text-4xl font-black font-mono text-accent-light">
                      {calculation.years}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">{t('שנים להריסה', 'years to demolition')}</div>
                  </div>
                </div>

                {calculation.promiseDiff !== null && calculation.promiseDiff > 0 && (
                  <div className="rounded-lg p-3 mb-5 text-center text-sm font-semibold" style={{ background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.2)', color: '#FF7B72' }}>
                    <AlertTriangle className="w-4 h-4 inline-block ml-2" />
                    {t(
                      `אופטימיות יתר: נאמר לך ${calculation.toldYears} שנים אבל הצפי הריאלי הוא ${calculation.years} שנים — פער של ${calculation.promiseDiff} שנים!`,
                      `Over-optimism: You were told ${calculation.toldYears} years but the realistic expectation is ${calculation.years} years — a gap of ${calculation.promiseDiff} years!`
                    )}
                  </div>
                )}

                {/* Overall Score */}
                <div className="rounded-xl p-6 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-foreground-muted mb-3">{t('ציון וודאות כולל', 'Overall Certainty Score')}</div>
                  <div className="text-6xl font-black font-mono mb-2" style={{ color: calculation.risk.colorVar }}>
                    {calculation.certainty}<span className="text-2xl">%</span>
                  </div>
                  <div className="confidence-bar mx-auto max-w-xs"><div className={`confidence-fill ${calculation.risk.barClass}`} style={{ width: `${calculation.certainty}%` }} /></div>
                  <div className="text-sm font-semibold mt-3" style={{ color: calculation.risk.colorVar }}>
                    {t('רמת סיכון: ', 'Risk Level: ')}{lang === 'he' ? calculation.risk.label : calculation.risk.labelEn}
                  </div>
                </div>

                {/* Timeline adjustments */}
                {calculation.adjustments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1">
                    <div className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">{t('התאמות ללוח הזמנים', 'Timeline Adjustments')}</div>
                    {calculation.adjustments.map((a, i) => (
                      <div key={i} className="text-xs text-foreground-muted flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-accent" />{lang === 'he' ? a.he : a.en}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Professional Verdict */}
              <div className="db-card p-5">
                <SectionTitle icon={<FileText className="w-4 h-4 text-foreground-muted" />} title={t('סיכום המומחה', 'Professional Verdict')} />
                <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: calculation.risk.colorVar, background: `color-mix(in srgb, ${calculation.risk.colorVar} 5%, transparent)` }}>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {t(
                      `על בסיס הנתונים שהוזנו, העסקה מאופיינת ברמת סיכון ${calculation.risk.label}. הצפי הריאלי להריסת הבניין הישן הוא ${calculation.years} שנים${calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? `, לעומת ${calculation.toldYears} שנים שנאמרו לך — פער של ${calculation.promiseDiff} שנים` : ''}. מומלץ לבצע בדיקת נאותות מעמיקה טרם קבלת החלטה.`,
                      `Based on the data entered, this transaction carries ${calculation.risk.labelEn.toLowerCase()} risk. The realistic estimate to demolition is ${calculation.years} years${calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? `, vs. the ${calculation.toldYears} years you were told — a ${calculation.promiseDiff}-year gap` : ''}. A thorough due diligence review is recommended before making a decision.`
                    )}
                  </p>
                </div>
              </div>

              {/* ====================================== */}
              {/* 7. THREE CTAs                          */}
              {/* ====================================== */}
              {!ctaSubmitted && !activeCta && (
                <div className="space-y-3">
                  <div className="text-center mb-2">
                    <h3 className="text-base font-bold text-foreground">{t('מה הצעד הבא?', 'What\'s Next?')}</h3>
                    <p className="text-xs text-foreground-muted">{t('בחר את האפשרות המתאימה לך', 'Choose the option that fits you')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* CTA 1: Consultation */}
                    <button onClick={() => setActiveCta('consultation')} className="db-card p-5 text-right hover:border-accent/50 transition-all cursor-pointer border-0 bg-transparent">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">{t('פגישת ייעוץ אסטרטגית', 'Strategic Consultation')}</h4>
                      <p className="text-[11px] text-foreground-muted leading-relaxed mb-2">
                        {t('45 דקות עם חיים פיין — ניתוח חוזה, מפרט ופרופיל יזם', '45 min with Haim Finn — contract, specs & developer analysis')}
                      </p>
                      <div className="text-sm font-bold text-accent">3,000 ₪</div>
                    </button>

                    {/* CTA 2: Detailed Report */}
                    <button onClick={() => setActiveCta('report')} className="db-card p-5 text-right hover:border-green/50 transition-all cursor-pointer border-0 bg-transparent">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' }}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">{t('דוח מפורט מקצועי', 'Detailed Professional Report')}</h4>
                      <p className="text-[11px] text-foreground-muted leading-relaxed mb-2">
                        {t('כל הבדיקות יבוצעו באופן ידני על ידי — דוח מלא תוך 7 ימי עבודה', 'All checks performed manually by me — full report within 7 business days')}
                      </p>
                      <div className="text-sm font-bold text-green">750 ₪</div>
                    </button>

                    {/* CTA 3: Broker */}
                    <button onClick={() => setActiveCta('broker')} className="db-card p-5 text-right hover:border-gold/50 transition-all cursor-pointer border-0 bg-transparent">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)' }}>
                        <Home className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">{t('מתווך להשקעה חלופית', 'Alternative Investment Broker')}</h4>
                      <p className="text-[11px] text-foreground-muted leading-relaxed mb-2">
                        {t('מתווך מטעמי ייצור קשר ויציע דירות להשקעה מתאימות', 'Our broker will contact you with suitable investment properties')}
                      </p>
                      <div className="text-sm font-bold text-gold">{t('ללא עלות', 'Free')}</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Active CTA Form */}
              {!ctaSubmitted && activeCta && (
                <div className="db-card p-6 fade-in-up">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-foreground">
                      {activeCta === 'consultation' && t('פגישת ייעוץ — 3,000 ₪', 'Consultation — 3,000 ₪')}
                      {activeCta === 'report' && t('דוח מפורט — 750 ₪ (7 ימי עבודה)', 'Detailed Report — 750 ₪ (7 business days)')}
                      {activeCta === 'broker' && t('תיווך להשקעה', 'Investment Brokerage')}
                    </h3>
                    <button onClick={() => setActiveCta(null)} className="text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                      {t('← חזרה', '← Back')}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><User className="w-3 h-3" />{t('שם מלא *', 'Full Name *')}</label>
                        <input className="input-field text-right text-sm" placeholder={t('ישראל ישראלי', 'John Doe')} value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><Phone className="w-3 h-3" />{t('טלפון *', 'Phone *')}</label>
                        <input className="input-field text-right text-sm" type="tel" placeholder="050-1234567" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><Mail className="w-3 h-3" />{t('אימייל *', 'Email *')}</label>
                      <input className="input-field text-right text-sm" type="email" placeholder="example@email.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                    </div>

                    {/* Investment form — only for broker CTA */}
                    {activeCta === 'broker' && (
                      <div className="pt-3 mt-3 border-t border-[var(--border)] space-y-3">
                        <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">{t('פרטי השקעה', 'Investment Details')}</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><DollarSign className="w-3 h-3" />{t('תקציב (₪) *', 'Budget (₪) *')}</label>
                            <input className="input-field text-right text-sm" type="number" placeholder="2,000,000" value={investmentForm.budget} onChange={(e) => setInvestmentForm({ ...investmentForm, budget: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{t('עיר מבוקשת *', 'City *')}</label>
                            <input className="input-field text-right text-sm" placeholder={t('תל אביב', 'Tel Aviv')} value={investmentForm.city} onChange={(e) => setInvestmentForm({ ...investmentForm, city: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><Timer className="w-3 h-3" />{t('שנות השקעה *', 'Years *')}</label>
                            <input className="input-field text-right text-sm" type="number" placeholder="5" value={investmentForm.years} onChange={(e) => setInvestmentForm({ ...investmentForm, years: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleCtaSubmit}
                      disabled={ctaSending || !contactForm.name || !contactForm.phone || !contactForm.email || (activeCta === 'broker' && (!investmentForm.budget || !investmentForm.city || !investmentForm.years))}
                      className="w-full mt-2 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-0 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)', color: '#fff' }}
                    >
                      {ctaSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t('שלח פרטים', 'Submit')}
                    </button>
                  </div>
                </div>
              )}

              {/* CTA Submitted Confirmation */}
              {ctaSubmitted && (
                <div className="db-card-green p-6 text-center fade-in-up">
                  <div className="w-16 h-16 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{t('הפרטים נשלחו בהצלחה!', 'Details sent successfully!')}</h3>
                  <p className="text-sm text-foreground-muted mb-4">
                    {activeCta === 'consultation' && t('חיים ייצור איתך קשר לתיאום פגישה. תודה!', 'Haim will contact you to schedule. Thank you!')}
                    {activeCta === 'report' && t('הדוח המפורט יישלח אליך תוך 7 ימי עבודה. תודה!', 'Your detailed report will be delivered within 7 business days. Thank you!')}
                    {activeCta === 'broker' && t('מתווך מטעמנו ייצור איתך קשר בהקדם. תודה!', 'Our broker will contact you shortly. Thank you!')}
                  </p>
                  <button onClick={() => { setCtaSubmitted(false); setActiveCta(null); }} className="btn-secondary py-2 px-4 rounded-lg text-xs cursor-pointer">
                    {t('חזרה לדוח', 'Back to Report')}
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('בדיקת נאותות להתחדשות עירונית', 'Urban Renewal Due Diligence')}</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('חיים פיין', 'Haim Finn')}</span>
      </div>
    </div>
  );
}

// =========================================
// Planning Verification Section
// =========================================

function PlanningVerificationSection({ planningData, planningLoading, address, projectName, onSearch, reportedStatus, lang, t }: {
  planningData: PlanningRecord[]; planningLoading: boolean; address: string; projectName: string;
  onSearch: (q: string) => void; reportedStatus: string; lang: string; t: (he: string, en: string) => string;
}) {
  const [customSearch, setCustomSearch] = useState('');
  const handleCustomSearch = () => { if (customSearch.trim()) onSearch(customSearch.trim()); };

  return (
    <div className="db-card p-5">
      <SectionTitle icon={<MapPin className="w-4 h-4 text-accent" />} title={t('אימות סטטוס תכנוני', 'Planning Status Verification')} />

      <div className="mt-3 mb-4">
        <div className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">{t('סטטוס שדווח על ידי היזם/מתווך/מוכר', 'Status reported by developer/broker/seller')}</div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--fg-secondary)' }}>
          <Info className="w-3 h-3 text-accent" />
          {reportedStatus}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <Search className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" />
          <input type="text" className="w-full bg-transparent border-none outline-none text-xs text-foreground text-right placeholder:text-[var(--fg-dim)]"
            placeholder={t('חפש לפי עיר, שכונה או שם מתחם...', 'Search by city, neighborhood or complex...')}
            value={customSearch} onChange={(e) => setCustomSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()} />
        </div>
        <button onClick={handleCustomSearch} className="px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer" style={{ background: 'var(--accent)', color: '#fff' }}>
          {t('חפש', 'Search')}
        </button>
      </div>

      {planningLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-foreground-muted">
          <Loader2 className="w-4 h-4 animate-spin" />{t('מחפש במאגר מינהל התכנון...', 'Searching planning database...')}
        </div>
      )}

      {!planningLoading && planningData.length === 0 && (
        <div className="py-6 text-center">
          <XCircle className="w-8 h-8 text-foreground-muted opacity-30 mx-auto mb-2" />
          <p className="text-xs text-foreground-muted mb-2">{t('לא נמצאו תוכניות התחדשות עירונית עבור חיפוש זה.', 'No urban renewal plans found for this search.')}</p>
          <div className="flex justify-center gap-2 mt-3">
            <ExternalLinkButton href="https://ags.iplan.gov.il/xplan/" label={t('XPLAN קווים כחולים', 'XPLAN Blue Lines')} />
            <ExternalLinkButton href="https://mavat.iplan.gov.il/SV3" label={t('מידע תכנוני (מבא״ת)', 'Planning Info (Mavat)')} />
          </div>
        </div>
      )}

      {!planningLoading && planningData.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] text-green font-medium uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            {t(`נמצאו ${planningData.length} תוכניות רלוונטיות`, `Found ${planningData.length} relevant plans`)}
          </div>

          {planningData.slice(0, 5).map((plan, i) => (
            <div key={plan.id || i} className="rounded-lg p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(plan.status)}
                  <div>
                    <div className="text-xs font-semibold text-foreground">{plan.complexName || plan.city}</div>
                    <div className="text-[10px] text-foreground-muted">{plan.city}{plan.planNumber ? ` | ${t('תוכנית', 'Plan')} ${plan.planNumber}` : ''}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: `color-mix(in srgb, ${getStatusColor(plan.status)} 15%, transparent)`, color: getStatusColor(plan.status) }}>
                    {plan.status}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                <MiniStat label={t('דירות קיימות', 'Existing')} value={String(plan.existingUnits)} />
                <MiniStat label={t('דירות חדשות', 'Proposed')} value={String(plan.proposedUnits)} />
                <MiniStat label={t('שנת אישור', 'Approval Year')} value={plan.approvalYear || '\u2014'} />
                <MiniStat label={t('מסלול', 'Track')} value={plan.track || '\u2014'} />
              </div>
              {plan.inExecution && (
                <div className="mt-2 text-[10px] flex items-center gap-1.5">
                  {plan.inExecution === 'כן' ? (
                    <><CheckCircle2 className="w-3 h-3 text-green" /><span className="text-green font-medium">{t('בביצוע', 'In execution')}</span></>
                  ) : (
                    <><Clock className="w-3 h-3 text-foreground-muted" /><span className="text-foreground-muted">{t('טרם בביצוע', 'Not yet in execution')}</span></>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                {plan.mavatLink && <ExternalLinkButton href={plan.mavatLink} label={t('מידע תכנוני', 'Planning Info')} />}
                {plan.govmapLink && <ExternalLinkButton href={plan.govmapLink} label="GovMap" />}
              </div>
            </div>
          ))}

          {planningData.length > 5 && (
            <p className="text-[10px] text-foreground-muted text-center">
              {t(`ו-${planningData.length - 5} תוכניות נוספות.`, `And ${planningData.length - 5} more plans.`)}{' '}
              <a href="https://mavat.iplan.gov.il/SV3" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{t('צפה בכל התוכניות', 'View all plans')}</a>
            </p>
          )}

          <div className="flex justify-center gap-2 mt-2">
            <ExternalLinkButton href="https://ags.iplan.gov.il/xplan/" label={t('XPLAN קווים כחולים', 'XPLAN Blue Lines')} />
            <ExternalLinkButton href="https://mavat.iplan.gov.il/SV3" label={t('מידע תכנוני (מבא״ת)', 'Planning Info (Mavat)')} />
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================
// Developer Profile Section
// =========================================

function DeveloperProfileSection({ developerData, developerLoading, developerName, onSearch, lang, t }: {
  developerData: DeveloperResponse | null; developerLoading: boolean; developerName: string;
  onSearch: (q: string) => void; lang: string; t: (he: string, en: string) => string;
}) {
  const [customSearch, setCustomSearch] = useState('');
  if (!developerName && !developerData) return null;
  const handleCustomSearch = () => { if (customSearch.trim()) onSearch(customSearch.trim()); };

  return (
    <div className="db-card p-5">
      <SectionTitle icon={<Building2 className="w-4 h-4 text-green" />} title={t('פרופיל יזם', 'Developer Profile')} />

      <div className="flex gap-2 mt-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <Search className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" />
          <input type="text" className="w-full bg-transparent border-none outline-none text-xs text-foreground text-right placeholder:text-[var(--fg-dim)]"
            placeholder={t('חפש יזם לפי שם...', 'Search developer by name...')}
            value={customSearch} onChange={(e) => setCustomSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()} />
        </div>
        <button onClick={handleCustomSearch} className="px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer" style={{ background: 'var(--green)', color: '#fff' }}>
          {t('חפש', 'Search')}
        </button>
      </div>

      {developerLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-foreground-muted">
          <Loader2 className="w-4 h-4 animate-spin" />{t('מחפש פרופיל יזם...', 'Searching developer profile...')}
        </div>
      )}

      {!developerLoading && developerData && !developerData.found && (
        <div className="py-4">
          <div className="rounded-lg p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-foreground mb-1">
                  {t(`היזם ${developerName} לא נמצא בדירוג ההתחדשות העירונית`, `Developer "${developerName}" not found in renewal rankings`)}
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  {t('יזם שאינו מופיע בדירוג עשוי להיות חברה חדשה, חברת בת, או חברה קטנה. מומלץ לבצע בדיקה מעמיקה.',
                    'A developer not in the ranking may be a new company, subsidiary, or small firm. Thorough investigation recommended.')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <ExternalLinkButton href={developerData.duns100Link} label={t('Duns100 דירוג יזמים', 'Duns100 Rankings')} />
            <ExternalLinkButton href="https://madadithadshut.co.il/" label={t('מדד ההתחדשות', 'Renewal Index')} />
          </div>
        </div>
      )}

      {!developerLoading && developerData && developerData.found && (
        <div className="space-y-3">
          {developerData.results.map((dev, i) => (
            <div key={i} className="rounded-lg p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black" style={{
                    background: dev.tier === 'A' ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)',
                    color: dev.tier === 'A' ? 'var(--green)' : 'var(--accent)',
                  }}>
                    {dev.tier}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{dev.name}</div>
                    <div className="text-[10px] text-foreground-muted">{dev.tierLabel}</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed mt-2">{dev.summary}</p>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <MiniStat label={t('סה״כ', 'Total')} value={String(dev.totalProjects)} />
                <MiniStat label={t('בבנייה', 'Building')} value={String(dev.inConstruction)} />
                <MiniStat label={t('נמסרו', 'Delivered')} value={String(dev.delivered)} />
                <MiniStat label={t('בתכנון', 'Planning')} value={String(dev.inPlanning)} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {dev.specialties.map((s, j) => (
                  <span key={j} className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                <ExternalLinkButton href={dev.madadLink} label={t('מדד ההתחדשות', 'Renewal Index')} />
                {dev.website && <ExternalLinkButton href={dev.website} label={t('אתר החברה', 'Company Website')} />}
              </div>
            </div>
          ))}
          <div className="flex justify-center gap-2 mt-2">
            <ExternalLinkButton href={developerData.duns100Link} label={t('Duns100 דירוג יזמים', 'Duns100 Rankings')} />
            <ExternalLinkButton href="https://madadithadshut.co.il/" label={t('מדד ההתחדשות', 'Renewal Index')} />
          </div>
        </div>
      )}

      {!developerLoading && !developerData && developerName && (
        <div className="py-4 text-center">
          <p className="text-xs text-foreground-muted">{t(`לא בוצע חיפוש עבור "${developerName}"`, `No search performed for "${developerName}"`)}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        <p className="text-[10px] text-foreground-muted leading-relaxed">
          {t('מקור: מדד ההתחדשות העירונית ודירוג Duns100. הנתונים הם לצורך הכוונה כללית בלבד.',
            'Source: Urban Renewal Index and Duns100 ranking. Data is for general guidance only.')}
        </p>
      </div>
    </div>
  );
}

// =========================================
// Sub-Components
// =========================================

function Field({ label, value, onChange, placeholder, type = 'text', suffix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-foreground-muted">{label}</label>
      <div className="relative">
        <input type={type} placeholder={placeholder} className="input-field text-right text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
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

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="text-sm font-bold text-foreground">{title}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-[9px] text-foreground-muted uppercase tracking-wider">{label}</div>
      <div className="text-xs font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium transition-colors hover:opacity-80"
      style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
      <ExternalLink className="w-3 h-3" />{label}
    </a>
  );
}
