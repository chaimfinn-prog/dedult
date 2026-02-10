'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, Building2, CalendarDays,
  ChevronLeft, AlertTriangle, ArrowRight, Loader2,
  Shield, TrendingUp, FileText, User, Briefcase, MapPin,
  ExternalLink, CheckCircle2, Clock, Search, XCircle, Info,
  Globe, Phone, Mail, Send, Home, DollarSign, Timer, HelpCircle, MessageSquare,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

// =============================================
// PLANNING OPTIONS — for calculation
// =============================================

const planningOptionsPinui = [
  { value: 'initialPlanning', label: 'תכנון ראשוני של תב״ע', labelEn: 'Initial TBA Planning', baseYears: 7, stage: 'planning', desc: 'הפרויקט בשלב תכנון ראשוני של תוכנית בניין עיר — שלב מוקדם מאוד.', descEn: 'Project at initial urban building plan phase — very early stage.' },
  { value: 'thresholdConditions', label: 'קיום תנאי סף', labelEn: 'Threshold Conditions Met', baseYears: 6, stage: 'planning', desc: 'הפרויקט עמד בתנאי הסף הנדרשים. שלב משמעותי אך עדיין רחוק מהריסה.', descEn: 'Threshold conditions met. Meaningful but demolition still far.' },
  { value: 'depositPublication', label: 'פרסום להפקדה', labelEn: 'Published for Deposit', baseYears: 5, stage: 'planning', desc: 'התוכנית פורסמה להפקדה. שלב סטטוטורי פעיל — הציבור רשאי להגיש התנגדויות.', descEn: 'Plan published for deposit. Active statutory phase — public may file objections.' },
  { value: 'tabaApproved', label: 'תב״ע מאושרת', labelEn: 'TBA Approved', baseYears: 4, stage: 'planning', desc: 'תוכנית בניין העיר אושרה. הסיכון התכנוני העקרוני הוסר.', descEn: 'Urban building plan approved. Major planning risk gone.' },
  { value: 'designApproved', label: 'תוכנית עיצוב מאושרת', labelEn: 'Design Plan Approved', baseYears: 3, stage: 'planning', desc: 'תוכנית העיצוב אושרה. הפרויקט מתקרב לשלב הרישוי.', descEn: 'Design plan approved. Approaching permit phase.' },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 7, stage: 'planning', desc: 'שלב תכנוני לא ידוע — ההערכה מבוססת על תרחיש שמרני.', descEn: 'Unknown planning stage — estimate based on conservative scenario.' },
];

const permitStageOptions = [
  { value: 'none', label: 'טרם הוגשה בקשה', labelEn: 'Not yet filed', baseYears: 0, stage: 'planning' },
  { value: 'permitFiled', label: 'בקשה הוגשה', labelEn: 'Permit Filed', baseYears: 2.5, stage: 'permit' },
  { value: 'permitAccepted', label: 'בקשה נקלטה', labelEn: 'Application Accepted', baseYears: 2, stage: 'permit' },
  { value: 'selfLicensing', label: 'רישוי עצמי', labelEn: 'Self-Licensing', baseYears: 1.5, stage: 'permit' },
  { value: 'permitConditions', label: 'היתר בתנאים', labelEn: 'Conditional Permit', baseYears: 1.5, stage: 'permit' },
  { value: 'fullPermit', label: 'היתר מלא', labelEn: 'Full Permit', baseYears: 0.5, stage: 'permit' },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 0, stage: 'planning' },
];

const planningOptionsTama = [
  { value: 'permitFiled', label: 'בקשה הוגשה', labelEn: 'Permit Filed', baseYears: 2.5, stage: 'permit', desc: 'בקשה להיתר הוגשה. הפרויקט בשלב רישוי ראשוני.', descEn: 'Permit filed. Initial licensing phase.' },
  { value: 'permitAccepted', label: 'בקשה נקלטה', labelEn: 'Application Accepted', baseYears: 2, stage: 'permit', desc: 'הבקשה נקלטה בבדיקה פעילה של הוועדה.', descEn: 'Application accepted, under active review.' },
  { value: 'selfLicensing', label: 'רישוי עצמי', labelEn: 'Self-Licensing', baseYears: 1.5, stage: 'permit', desc: 'מסלול רישוי עצמי — מסלול מקוצר יחסית.', descEn: 'Self-licensing track — relatively shortened.' },
  { value: 'permitConditions', label: 'היתר בתנאים', labelEn: 'Conditional Permit', baseYears: 1.5, stage: 'permit', desc: 'היתר בנייה בתנאים. שלב מתקדם.', descEn: 'Conditional permit. Advanced stage.' },
  { value: 'fullPermit', label: 'היתר מלא', labelEn: 'Full Permit', baseYears: 0.5, stage: 'permit', desc: 'היתר מלא הוצא. שלב סופי.', descEn: 'Full permit issued. Final stage.' },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 2.5, stage: 'permit', desc: 'שלב רישוי לא ידוע — תרחיש שמרני.', descEn: 'Unknown permit stage — conservative estimate.' },
];

const allOptions = [...planningOptionsPinui, ...planningOptionsTama, ...permitStageOptions];

const SCAN_STEPS = [
  { label: 'אימות נתוני כתובת ומיקום', labelEn: 'Verifying address and location' },
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

interface FormData {
  street: string; city: string; developerName: string; projectName: string;
  price: string; rent: string; apartmentSize: string; sqmAddition: string;
  projectType: string; tenantCount: string; signatureStatus: string;
  planningStatus: string; permitStage: string; objection: string; toldYears: string;
}

// =============================================
// Helpers
// =============================================

function getRiskLevel(certainty: number) {
  if (certainty < 50) return { label: 'גבוהה', labelEn: 'High', color: 'text-danger', colorVar: 'var(--red)', barClass: 'confidence-low' };
  if (certainty < 75) return { label: 'בינונית', labelEn: 'Medium', color: 'text-gold', colorVar: 'var(--gold)', barClass: 'confidence-medium' };
  return { label: 'נמוכה', labelEn: 'Low', color: 'text-green', colorVar: 'var(--green)', barClass: 'confidence-high' };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
}

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s.includes('מאושרת') || s.includes('אישור') || s.includes('במימוש')) return <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0" />;
  if (s.includes('רישוי') || s.includes('היתר') || s.includes('הפקדה')) return <Clock className="w-5 h-5 text-gold flex-shrink-0" />;
  return <Info className="w-5 h-5 text-accent flex-shrink-0" />;
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('מאושרת') || s.includes('אישור') || s.includes('במימוש')) return 'var(--green)';
  if (s.includes('רישוי') || s.includes('היתר') || s.includes('הפקדה')) return 'var(--gold)';
  return 'var(--accent)';
}

// Map user-reported status to what we'd expect in the data
function getExpectedStatusKeywords(planningStatus: string): string[] {
  switch (planningStatus) {
    case 'tabaApproved': case 'designApproved': return ['מאושרת', 'אישור', 'תוקף'];
    case 'depositPublication': return ['הפקדה', 'הופקד'];
    case 'fullPermit': case 'permitConditions': return ['היתר', 'במימוש', 'בביצוע'];
    default: return [];
  }
}

// =============================================
// Main Component
// =============================================

export default function ReportPage() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const [form, setForm] = useState<FormData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const [planningData, setPlanningData] = useState<PlanningRecord[]>([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [developerData, setDeveloperData] = useState<DeveloperResponse | null>(null);
  const [developerLoading, setDeveloperLoading] = useState(false);

  const [activeCta, setActiveCta] = useState<null | 'consultation' | 'report' | 'broker'>(null);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '' });
  const [investmentForm, setInvestmentForm] = useState({ budget: '', city: '', freeText: '', years: '' });
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [ctaSending, setCtaSending] = useState(false);

  // Load form data from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('rc-form');
    if (!saved) {
      router.push('/checkup');
      return;
    }
    const parsed = JSON.parse(saved) as FormData;
    setForm(parsed);
    setIsScanning(true);

    // Fetch planning data
    const searchQuery = parsed.city || parsed.street || parsed.projectName || '';
    if (searchQuery) {
      fetchPlanning(parsed.street, parsed.city, parsed.projectName);
    }
    if (parsed.developerName) {
      fetchDeveloper(parsed.developerName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlanning = useCallback(async (street: string, city: string, projectName: string) => {
    setPlanningLoading(true);
    try {
      const params = new URLSearchParams();
      if (street && city) {
        params.set('street', street);
        params.set('city', city);
      } else if (projectName) {
        params.set('q', projectName);
      } else if (street) {
        params.set('q', street);
      } else if (city) {
        params.set('city', city);
      }
      const res = await fetch(`/api/planning?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPlanningData(data.records ?? []);
      }
    } catch { /* silent */ }
    setPlanningLoading(false);
  }, []);

  const fetchDeveloper = useCallback(async (query: string) => {
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

  // CTA submit — auto-send, no mailto
  const handleCtaSubmit = async () => {
    if (!contactForm.name || !contactForm.phone || !contactForm.email) return;
    if (activeCta === 'broker' && (!investmentForm.city || !investmentForm.budget)) return;
    setCtaSending(true);
    try {
      await fetch('/api/notify', {
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
    if (!form) return null;

    // Determine effective planning option
    let planning = allOptions.find((o) => o.value === form.planningStatus && 'desc' in o);
    if (!planning) planning = planningOptionsPinui[0];

    // For pinui-binui with permit stage, use permit stage if more specific
    const permit = permitStageOptions.find(o => o.value === form.permitStage);
    const usePermitStage = form.projectType === 'pinui' &&
      (form.planningStatus === 'tabaApproved' || form.planningStatus === 'designApproved') &&
      permit && permit.value !== 'none' && permit.value !== 'unknown';

    let years = usePermitStage ? permit!.baseYears : planning.baseYears;
    const adjustments: { he: string; en: string }[] = [];
    const risks: { he: string; en: string }[] = [];
    const unknownFields: { he: string; en: string }[] = [];

    // Track unknowns
    if (form.planningStatus === 'unknown') {
      unknownFields.push({ he: 'שלב תכנוני — חסר נתון קריטי', en: 'Planning stage — critical data missing' });
    }
    if (form.permitStage === 'unknown') {
      unknownFields.push({ he: 'שלב רישוי — חסר נתון', en: 'Permit stage — data missing' });
    }
    if (form.signatureStatus === 'unknown') {
      unknownFields.push({ he: 'סטטוס חתימות — חסר נתון', en: 'Signature status — data missing' });
    }
    if (form.tenantCount === 'unknown') {
      unknownFields.push({ he: 'מספר דיירים — חסר נתון', en: 'Tenant count — data missing' });
    }
    if (form.objection === 'unknown') {
      unknownFields.push({ he: 'התנגדויות/ערר — חסר נתון', en: 'Objections/appeals — data missing' });
    }

    // A. Objection / Appeal
    if (form.objection === 'objection') {
      years += 1;
      adjustments.push({ he: '+1.0 שנה: הוגשה התנגדות (עיכוב צפוי)', en: '+1.0 year: Objection filed (expected delay)' });
    } else if (form.objection === 'appeal') {
      years += 1.5;
      adjustments.push({ he: '+1.5 שנים: הוגש ערר (עיכוב משמעותי)', en: '+1.5 years: Appeal filed (significant delay)' });
    } else if (form.objection === 'both') {
      years += 2;
      adjustments.push({ he: '+2.0 שנים: התנגדות + ערר (עיכוב מהותי)', en: '+2.0 years: Objection + Appeal (major delay)' });
    } else if (form.objection === 'unknown') {
      years += 0.5;
      adjustments.push({ he: '+0.5 שנה: חוסר ודאות לגבי התנגדויות', en: '+0.5 year: Uncertainty about objections' });
    }

    // B. Tenant count
    const planStage = usePermitStage ? permit!.stage : planning.stage;
    if (planStage === 'planning' && form.tenantCount === 'over100') {
      years += 0.8;
      adjustments.push({ he: '+0.8 שנים: מורכבות משפטית (מעל 100 דיירים)', en: '+0.8 years: Legal complexity (over 100 tenants)' });
    }

    // C. Signature bonus
    if (form.signatureStatus === 'full') {
      years = Math.max(0.5, years - 1);
      adjustments.push({ he: '−1.0 שנה: הליך מואץ (100% חתימות)', en: '−1.0 year: Accelerated (100% signatures)' });
    }

    // D. Certainty score
    let certainty = 100;

    if (form.signatureStatus === 'noMajority') {
      certainty -= 30;
      risks.push({ he: 'סיכון משפטי: אין רוב חוקי (−30%)', en: 'Legal risk: No majority (−30%)' });
    } else if (form.signatureStatus === 'unknown') {
      certainty -= 20;
      risks.push({ he: 'חוסר ודאות: סטטוס חתימות לא ידוע (−20%)', en: 'Uncertainty: Unknown signatures (−20%)' });
    }

    if (form.projectType === 'pinui' && planStage === 'planning' && form.planningStatus !== 'tabaApproved' && form.planningStatus !== 'designApproved') {
      certainty -= 25;
      risks.push({ he: 'סיכון תכנוני: פינוי-בינוי ללא תב״ע מאושרת (−25%)', en: 'Planning risk: No approved TBA (−25%)' });
    }

    if (form.planningStatus === 'unknown') {
      certainty -= 25;
      risks.push({ he: 'חוסר ודאות: שלב תכנוני לא ידוע (−25%)', en: 'Uncertainty: Unknown planning stage (−25%)' });
    }

    const sqmAdd = parseFloat(form.sqmAddition);
    const hasSqmRisk = Number.isFinite(sqmAdd) && sqmAdd > 12;
    if (hasSqmRisk) {
      certainty -= 15;
      risks.push({ he: 'סיכון כלכלי (תקן 21): תוספת מ"ר חורגת (−15%)', en: 'Financial risk: Excess sqm (−15%)' });
    }

    if (form.objection === 'objection') {
      certainty -= 10;
      risks.push({ he: 'סיכון סטטוטורי: התנגדות (−10%)', en: 'Statutory risk: Objection (−10%)' });
    } else if (form.objection === 'appeal') {
      certainty -= 15;
      risks.push({ he: 'סיכון סטטוטורי: ערר (−15%)', en: 'Statutory risk: Appeal (−15%)' });
    } else if (form.objection === 'both') {
      certainty -= 20;
      risks.push({ he: 'סיכון סטטוטורי: התנגדות + ערר (−20%)', en: 'Statutory risk: Objection + Appeal (−20%)' });
    } else if (form.objection === 'unknown') {
      certainty -= 10;
      risks.push({ he: 'חוסר ודאות: התנגדויות לא ידועות (−10%)', en: 'Uncertainty: Unknown objections (−10%)' });
    }

    certainty = Math.max(0, Math.min(100, certainty));

    // E. Financial
    const price = parseFloat(form.price);
    const rent = parseFloat(form.rent);
    const size = parseFloat(form.apartmentSize);
    const told = parseFloat(form.toldYears);

    const annualYield = Number.isFinite(price) && Number.isFinite(rent) && price > 0
      ? ((rent * 12) / price) * 100 : null;
    const pricePerSqm = Number.isFinite(price) && Number.isFinite(size) && size > 0
      ? price / size : null;
    const promiseDiff = Number.isFinite(told) ? Number((years - told).toFixed(1)) : null;

    const planningDesc = 'desc' in planning ? (planning as { desc: string }).desc : '';
    const planningDescEn = 'descEn' in planning ? (planning as { descEn: string }).descEn : '';

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
      unknownFields,
      planningDesc,
      planningDescEn,
    };
  }, [form]);

  if (!form) {
    return <div className="min-h-screen flex items-center justify-center text-foreground-muted">טוען...</div>;
  }

  const displayAddress = [form.street, form.city].filter(Boolean).join(', ');
  const displayProjectName = form.projectName || displayAddress || t('ללא שם', 'Unnamed');
  const reportedStatusLabel = allOptions.find(o => o.value === form.planningStatus)?.label ?? form.planningStatus;

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* Background */}
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
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-green/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green" />
            </div>
            <span className="font-bold text-sm tracking-tight">THE REALITY CHECK</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/checkup" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('בדיקה חדשה', 'New Check')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 flex-1 w-full">

        {/* Scanning Animation */}
        {isScanning && (
          <div className="db-card p-10 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="scan-line" />
            <div className="radar-container mb-8">
              <div className="radar-ring" />
              <div className="radar-ring-2" />
              <div className="radar-ring-3" />
              <div className="radar-sweep" />
              <div className="radar-dot" style={{ top: '20%', right: '30%' }} />
              <div className="radar-dot" style={{ top: '60%', right: '70%', animationDelay: '0.5s' }} />
              <div className="radar-dot" style={{ top: '40%', right: '50%', animationDelay: '1s' }} />
            </div>
            <div className="w-full max-w-sm space-y-3">
              {SCAN_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm" style={{ opacity: scanStepIndex >= i ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{
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

        {/* Report */}
        {!isScanning && showResults && calculation && (
          <div className="space-y-6 fade-in-up">

            {/* Report Header */}
            <div className="db-card-accent p-8">
              <div className="text-[11px] font-bold text-accent uppercase tracking-[0.2em] mb-2">THE REALITY CHECK — {t('דוח ניתוח', 'Analysis Report')}</div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {displayProjectName}
              </h1>
              <p className="text-base text-foreground-muted">
                {displayAddress && <>{displayAddress} | </>}
                {t('תאריך: ', 'Date: ')}{new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US')}
                {form.developerName && <> | {t('יזם/מוכר: ', 'Developer: ')}{form.developerName}</>}
              </p>
            </div>

            {/* Unknown Fields Warning */}
            {calculation.unknownFields.length > 0 && (
              <div className="db-card-gold p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold-light)' }} />
                  <div>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--gold-light)' }}>
                      {t('נתונים חסרים — כדאי לבדוק', 'Missing Data — Worth Checking')}
                    </h3>
                    <p className="text-sm text-foreground-muted mb-3">
                      {t('הנתונים הבאים קריטיים להבנת הכדאיות הכלכלית של העסקה. כדאי לברר או להתייעץ:', 'The following data is critical for assessing this deal. Worth investigating or consulting:')}
                    </p>
                    <ul className="space-y-1.5">
                      {calculation.unknownFields.map((f, i) => (
                        <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--gold-light)' }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
                          {lang === 'he' ? f.he : f.en}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Planning Verification */}
            <div className="db-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">{t('אימות סטטוס תכנוני', 'Planning Status Verification')}</h2>
              </div>

              <div className="mb-4">
                <div className="text-xs text-foreground-muted uppercase tracking-wider mb-2">{t('הסטטוס שדווח', 'Reported Status')}</div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--fg-secondary)' }}>
                  <Info className="w-4 h-4 text-accent" />
                  {reportedStatusLabel}
                </div>
              </div>

              <PlanningSearchSection
                planningData={planningData}
                planningLoading={planningLoading}
                street={form.street}
                city={form.city}
                onSearch={(q) => fetchPlanning(q, form.city, '')}
                reportedStatus={form.planningStatus}
                lang={lang}
                t={t}
              />
            </div>

            {/* 2. Developer Profile */}
            {form.developerName && (
              <div className="db-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-green" />
                  <h2 className="text-lg font-bold text-foreground">{t('פרופיל יזם', 'Developer Profile')}</h2>
                </div>
                <DeveloperSection
                  developerData={developerData}
                  developerLoading={developerLoading}
                  developerName={form.developerName}
                  onSearch={fetchDeveloper}
                  lang={lang}
                  t={t}
                />
              </div>
            )}

            {/* 3. Risk Analysis */}
            <div className="db-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-bold text-foreground">{t('ניתוח סיכונים', 'Risk Analysis')}</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-sm font-semibold text-foreground-secondary mb-2">{t('סטטוס סטטוטורי', 'Statutory Status')}</div>
                  <p className="text-sm text-foreground-muted leading-relaxed">{lang === 'he' ? calculation.planningDesc : calculation.planningDescEn}</p>
                </div>

                <div>
                  <div className="text-sm font-semibold text-foreground-secondary mb-2">{t('ניתוח תוספת מ"ר', 'Sqm Addition Analysis')}</div>
                  {calculation.hasSqmRisk ? (
                    <div className="db-card-gold p-4 text-sm text-foreground-muted leading-relaxed">
                      <span className="font-semibold" style={{ color: 'var(--gold-light)' }}>{t('אזהרת תקן 21: ', 'Standard 21 Warning: ')}</span>
                      {t(`התוספת המובטחת (${calculation.sqmAdd} מ"ר) חורגת מ-12 מ"ר הסטנדרט. סיכון פיננסי מוגבר.`, `Promised addition (${calculation.sqmAdd} sqm) exceeds 12 sqm standard. Increased financial risk.`)}
                    </div>
                  ) : calculation.sqmAdd !== null ? (
                    <div className="db-card-green p-4 text-sm text-foreground-muted leading-relaxed">
                      {t(`התמורה המובטחת (${calculation.sqmAdd} מ"ר) תואמת את הסטנדרט ותקן 21.`, `Promised addition (${calculation.sqmAdd} sqm) aligns with standard.`)}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">{t('לא הוזנו נתוני תוספת.', 'No addition data entered.')}</p>
                  )}
                </div>

                {calculation.risks.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border)] space-y-2">
                    <div className="text-xs text-foreground-muted uppercase tracking-wider font-semibold">{t('גורמי סיכון שזוהו', 'Identified Risk Factors')}</div>
                    {calculation.risks.map((r, i) => (
                      <div key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--gold-light)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />{lang === 'he' ? r.he : r.en}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Financial Overview */}
            <div className="db-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green" />
                <h2 className="text-lg font-bold text-foreground">{t('ניתוח כלכלי', 'Financial Overview')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="db-stat p-5">
                  <div className="db-stat-label text-sm">{t('תשואה שנתית נגזרת', 'Derived Annual Yield')}</div>
                  <div className="db-stat-value text-2xl" style={{ color: calculation.annualYield !== null && calculation.annualYield < 3 ? 'var(--gold)' : 'var(--green)' }}>
                    {calculation.annualYield !== null ? `${calculation.annualYield}%` : '\u2014'}
                  </div>
                </div>
                <div className="db-stat p-5">
                  <div className="db-stat-label text-sm">{t('שווי למ"ר (מצב קיים)', 'Price per Sqm')}</div>
                  <div className="db-stat-value text-2xl">
                    {calculation.pricePerSqm !== null ? formatCurrency(calculation.pricePerSqm) : '\u2014'}
                  </div>
                </div>
              </div>
              {calculation.annualYield !== null && (
                <p className="text-sm text-foreground-muted mt-4 leading-relaxed">
                  {calculation.annualYield < 3
                    ? t('תשואה נמוכה — המחיר כבר מגלם חלק מעליית הערך הצפויה.', 'Low yield — price already factors in expected appreciation.')
                    : t('התשואה תואמת ממוצע שוק. המחיר משקף מצב נוכחי.', 'Yield aligns with market average.')}
                </p>
              )}
            </div>

            {/* ====================================== */}
            {/* 5. THE BIG REVEAL                      */}
            {/* ====================================== */}
            <div className="db-card-accent p-8">
              <div className="text-center mb-8">
                <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">{t('תוצאות הניתוח', 'ANALYSIS RESULTS')}</div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('הפער בין מה שנאמר לך למציאות', 'The Gap Between What You Were Told and Reality')}</h2>
              </div>

              {/* Gap Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(210, 153, 34, 0.08)', border: '1px solid rgba(210, 153, 34, 0.2)' }}>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--gold-light)' }}>{t('מה נאמר לך', 'What You Were Told')}</div>
                  <div className="text-5xl font-black font-mono" style={{ color: 'var(--gold-light)' }}>
                    {calculation.toldYears !== null ? calculation.toldYears : '?'}
                  </div>
                  <div className="text-sm text-foreground-muted mt-2">{t('שנים להריסה', 'years to demolition')}</div>
                </div>

                <div className="rounded-xl p-6 text-center flex flex-col items-center justify-center" style={{
                  background: calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'rgba(248, 81, 73, 0.1)' : 'rgba(63, 185, 80, 0.1)',
                  border: `1px solid ${calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'rgba(248, 81, 73, 0.3)' : 'rgba(63, 185, 80, 0.3)'}`,
                }}>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {t('הפער', 'THE GAP')}
                  </div>
                  <div className="text-5xl font-black font-mono" style={{ color: calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {calculation.promiseDiff !== null
                      ? (calculation.promiseDiff > 0 ? `+${calculation.promiseDiff}` : `${calculation.promiseDiff}`)
                      : '\u2014'}
                  </div>
                  <div className="text-sm text-foreground-muted mt-2">{t('שנים', 'years')}</div>
                </div>

                <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(91, 141, 238, 0.08)', border: '1px solid rgba(91, 141, 238, 0.25)' }}>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-3 text-accent">{t('הצפי הריאלי האמיתי', 'The Real Expectation')}</div>
                  <div className="text-5xl font-black font-mono text-accent-light">
                    {calculation.years}
                  </div>
                  <div className="text-sm text-foreground-muted mt-2">{t('שנים להריסה', 'years to demolition')}</div>
                </div>
              </div>

              {calculation.promiseDiff !== null && calculation.promiseDiff > 0 && (
                <div className="rounded-lg p-4 mb-6 text-center text-base font-semibold" style={{ background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.2)', color: '#FF7B72' }}>
                  <AlertTriangle className="w-5 h-5 inline-block ml-2" />
                  {t(
                    `אופטימיות יתר: נאמר לך ${calculation.toldYears} שנים אבל הצפי הריאלי הוא ${calculation.years} שנים — פער של ${calculation.promiseDiff} שנים!`,
                    `Over-optimism: You were told ${calculation.toldYears} years but reality is ${calculation.years} years — a gap of ${calculation.promiseDiff} years!`
                  )}
                </div>
              )}

              {/* Overall Score */}
              <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="text-xs uppercase tracking-wider font-semibold text-foreground-muted mb-4">{t('ציון וודאות כולל', 'Overall Certainty Score')}</div>
                <div className="text-7xl font-black font-mono mb-3" style={{ color: calculation.risk.colorVar }}>
                  {calculation.certainty}<span className="text-3xl">%</span>
                </div>
                <div className="confidence-bar mx-auto max-w-sm h-1.5"><div className={`confidence-fill ${calculation.risk.barClass}`} style={{ width: `${calculation.certainty}%` }} /></div>
                <div className="text-base font-semibold mt-4" style={{ color: calculation.risk.colorVar }}>
                  {t('רמת סיכון: ', 'Risk Level: ')}{lang === 'he' ? calculation.risk.label : calculation.risk.labelEn}
                </div>
              </div>

              {calculation.adjustments.length > 0 && (
                <div className="mt-5 pt-5 border-t border-[var(--border)] space-y-2">
                  <div className="text-xs text-foreground-muted uppercase tracking-wider font-semibold">{t('התאמות ללוח הזמנים', 'Timeline Adjustments')}</div>
                  {calculation.adjustments.map((a, i) => (
                    <div key={i} className="text-sm text-foreground-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />{lang === 'he' ? a.he : a.en}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Professional Verdict */}
            <div className="db-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-foreground-muted" />
                <h2 className="text-lg font-bold text-foreground">{t('סיכום המומחה', 'Professional Verdict')}</h2>
              </div>
              <div className="p-5 rounded-lg border" style={{ borderColor: calculation.risk.colorVar, background: `color-mix(in srgb, ${calculation.risk.colorVar} 5%, transparent)` }}>
                <p className="text-base text-foreground-secondary leading-relaxed">
                  {t(
                    `על בסיס הנתונים שהוזנו, העסקה מאופיינת ברמת סיכון ${calculation.risk.label}. הצפי הריאלי להריסת הבניין הישן הוא ${calculation.years} שנים${calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? `, לעומת ${calculation.toldYears} שנים שנאמרו לך — פער של ${calculation.promiseDiff} שנים` : ''}. ${calculation.unknownFields.length > 0 ? 'חלק מהנתונים הקריטיים חסרים — מומלץ בחום לבצע בדיקה מעמיקה.' : 'מומלץ לבצע בדיקת נאותות מעמיקה טרם קבלת החלטה.'}`,
                    `Based on the data entered, this transaction carries ${calculation.risk.labelEn.toLowerCase()} risk. Realistic estimate to demolition is ${calculation.years} years${calculation.promiseDiff !== null && calculation.promiseDiff > 0 ? `, vs. ${calculation.toldYears} years you were told — a ${calculation.promiseDiff}-year gap` : ''}. ${calculation.unknownFields.length > 0 ? 'Some critical data is missing — thorough review strongly recommended.' : 'Thorough due diligence recommended.'}`
                  )}
                </p>
              </div>
            </div>

            {/* ====================================== */}
            {/* 7. THREE CTAs                          */}
            {/* ====================================== */}
            {!ctaSubmitted && !activeCta && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-foreground">{t('מה הצעד הבא?', "What's Next?")}</h2>
                  <p className="text-sm text-foreground-muted">{t('בחר את האפשרות המתאימה לך', 'Choose the option that fits you')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => setActiveCta('consultation')} className="db-card p-6 text-right hover:border-accent/50 transition-all cursor-pointer border-0 bg-transparent">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{t('פגישת ייעוץ אסטרטגית', 'Strategic Consultation')}</h3>
                    <p className="text-sm text-foreground-muted leading-relaxed mb-3">
                      {t('45 דקות ניתוח מעמיק — חוזה, מפרט ופרופיל יזם', '45 min deep analysis — contract, specs & developer')}
                    </p>
                    <div className="text-base font-bold text-accent">3,000 ₪</div>
                  </button>

                  <button onClick={() => setActiveCta('report')} className="db-card p-6 text-right hover:border-green/50 transition-all cursor-pointer border-0 bg-transparent">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' }}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{t('דוח מפורט מקצועי', 'Detailed Professional Report')}</h3>
                    <p className="text-sm text-foreground-muted leading-relaxed mb-3">
                      {t('בדיקה ידנית מלאה — דוח תוך 7 ימי עבודה', 'Full manual review — report within 7 business days')}
                    </p>
                    <div className="text-base font-bold text-green">750 ₪</div>
                  </button>

                  <button onClick={() => setActiveCta('broker')} className="db-card p-6 text-right hover:border-gold/50 transition-all cursor-pointer border-0 bg-transparent">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)' }}>
                      <Home className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{t('תיווך להשקעה חלופית', 'Alternative Investment Broker')}</h3>
                    <p className="text-sm text-foreground-muted leading-relaxed mb-3">
                      {t('מתווך מטעמנו ייצור קשר ויציע נכסים מתאימים', 'Our broker will contact you with suitable properties')}
                    </p>
                    <div className="text-base font-bold text-gold">{t('ללא עלות', 'Free')}</div>
                  </button>
                </div>
              </div>
            )}

            {/* CTA Form */}
            {!ctaSubmitted && activeCta && (
              <div className="db-card p-8 fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-foreground">
                    {activeCta === 'consultation' && t('פגישת ייעוץ — 3,000 ₪', 'Consultation — 3,000 ₪')}
                    {activeCta === 'report' && t('דוח מפורט — 750 ₪ (7 ימי עבודה)', 'Report — 750 ₪ (7 business days)')}
                    {activeCta === 'broker' && t('תיווך להשקעה', 'Investment Brokerage')}
                  </h3>
                  <button onClick={() => setActiveCta(null)} className="text-sm text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                    {t('← חזרה', '← Back')}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground-muted flex items-center gap-1"><User className="w-4 h-4" />{t('שם מלא *', 'Full Name *')}</label>
                      <input className="input-field text-right" placeholder={t('ישראל ישראלי', 'John Doe')} value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground-muted flex items-center gap-1"><Phone className="w-4 h-4" />{t('טלפון *', 'Phone *')}</label>
                      <input className="input-field text-right" type="tel" placeholder="050-1234567" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-muted flex items-center gap-1"><Mail className="w-4 h-4" />{t('אימייל *', 'Email *')}</label>
                    <input className="input-field text-right" type="email" placeholder="example@email.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                  </div>

                  {/* Broker investment form */}
                  {activeCta === 'broker' && (
                    <div className="pt-4 mt-4 border-t border-[var(--border)] space-y-4">
                      <div className="text-sm font-bold text-foreground-muted uppercase tracking-wider">{t('פרטי השקעה', 'Investment Details')}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground-muted flex items-center gap-1"><DollarSign className="w-4 h-4" />{t('תקציב (₪) *', 'Budget (₪) *')}</label>
                          <input className="input-field text-right" type="number" placeholder="2,000,000" value={investmentForm.budget} onChange={(e) => setInvestmentForm({ ...investmentForm, budget: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground-muted flex items-center gap-1"><MapPin className="w-4 h-4" />{t('עיר מבוקשת *', 'City *')}</label>
                          <input className="input-field text-right" placeholder={t('תל אביב', 'Tel Aviv')} value={investmentForm.city} onChange={(e) => setInvestmentForm({ ...investmentForm, city: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground-muted flex items-center gap-1"><Timer className="w-4 h-4" />{t('תקופת השקעה', 'Investment Period')}</label>
                          <input className="input-field text-right" type="number" placeholder={t('5 שנים', '5 years')} value={investmentForm.years} onChange={(e) => setInvestmentForm({ ...investmentForm, years: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-muted flex items-center gap-1"><MessageSquare className="w-4 h-4" />{t('מה אתה מחפש? (מלל חופשי)', 'What are you looking for? (Free text)')}</label>
                        <textarea className="input-field text-right" rows={3} placeholder={t('דירת 3 חדרים, שכונה שקטה, קרוב לתחבורה...', '3 room apartment, quiet neighborhood, near transportation...')} value={investmentForm.freeText} onChange={(e) => setInvestmentForm({ ...investmentForm, freeText: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCtaSubmit}
                    disabled={ctaSending || !contactForm.name || !contactForm.phone || !contactForm.email || (activeCta === 'broker' && (!investmentForm.budget || !investmentForm.city))}
                    className="w-full mt-3 py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer border-0 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)', color: '#fff' }}
                  >
                    {ctaSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {t('שלח פרטים', 'Submit')}
                  </button>
                </div>
              </div>
            )}

            {/* CTA Success */}
            {ctaSubmitted && (
              <div className="db-card-green p-8 text-center fade-in-up">
                <div className="w-20 h-20 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-10 h-10 text-green" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{t('הפרטים נשלחו בהצלחה!', 'Details sent successfully!')}</h3>
                <p className="text-base text-foreground-muted mb-6">
                  {activeCta === 'consultation' && t('ניצור איתך קשר לתיאום פגישה. תודה!', "We'll contact you to schedule. Thank you!")}
                  {activeCta === 'report' && t('הדוח המפורט יישלח תוך 7 ימי עבודה. תודה!', 'Report delivered within 7 business days. Thank you!')}
                  {activeCta === 'broker' && t('מתווך מטעמנו ייצור קשר בהקדם. תודה!', 'Our broker will contact you shortly. Thank you!')}
                </p>
                <button onClick={() => { setCtaSubmitted(false); setActiveCta(null); }} className="btn-secondary py-3 px-6 rounded-lg text-sm cursor-pointer">
                  {t('חזרה לדוח', 'Back to Report')}
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('בדיקת נאותות להתחדשות עירונית', 'Urban Renewal Due Diligence')}</span>
      </div>
    </div>
  );
}

// =========================================
// Planning Search Section
// =========================================

function PlanningSearchSection({ planningData, planningLoading, street, city, onSearch, reportedStatus, lang, t }: {
  planningData: PlanningRecord[]; planningLoading: boolean; street: string; city: string;
  onSearch: (q: string) => void; reportedStatus: string; lang: string; t: (he: string, en: string) => string;
}) {
  const [customSearch, setCustomSearch] = useState('');

  // Check if found plans match the reported status
  const expectedKeywords = getExpectedStatusKeywords(reportedStatus);
  const hasStatusMatch = planningData.some(p =>
    expectedKeywords.some(k => p.status.includes(k))
  );
  const hasStatusMismatch = planningData.length > 0 && expectedKeywords.length > 0 && !hasStatusMatch;

  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
          <input type="text" className="w-full bg-transparent border-none outline-none text-sm text-foreground text-right placeholder:text-[var(--fg-dim)]"
            placeholder={t('חפש לפי שם מתחם, עיר או שכונה...', 'Search by complex name, city or area...')}
            value={customSearch} onChange={(e) => setCustomSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && customSearch.trim() && onSearch(customSearch.trim())} />
        </div>
        <button onClick={() => customSearch.trim() && onSearch(customSearch.trim())} className="px-4 py-2.5 rounded-lg text-sm font-medium border-0 cursor-pointer" style={{ background: 'var(--accent)', color: '#fff' }}>
          {t('חפש', 'Search')}
        </button>
      </div>

      {planningLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-foreground-muted">
          <Loader2 className="w-5 h-5 animate-spin" />{t('מחפש במאגר מינהל התכנון...', 'Searching planning database...')}
        </div>
      )}

      {!planningLoading && planningData.length === 0 && (
        <div className="py-8 text-center">
          <XCircle className="w-10 h-10 text-foreground-muted opacity-30 mx-auto mb-3" />
          <p className="text-sm text-foreground-muted mb-3">{t('לא נמצאו תוכניות התחדשות עירונית.', 'No urban renewal plans found.')}</p>
          <p className="text-sm text-foreground-muted mb-4">{t('נסה לחפש לפי שם עיר או שכונה', 'Try searching by city or area name')}</p>
          <div className="flex justify-center gap-3">
            <ExternalLinkBtn href="https://ags.iplan.gov.il/xplan/" label={t('XPLAN קווים כחולים', 'XPLAN Blue Lines')} />
            <ExternalLinkBtn href="https://mavat.iplan.gov.il/SV3" label={t('מבא״ת', 'Mavat')} />
          </div>
        </div>
      )}

      {!planningLoading && planningData.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-green font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t(`נמצאו ${planningData.length} תוכניות רלוונטיות`, `Found ${planningData.length} relevant plans`)}
          </div>

          {/* Verification result */}
          {hasStatusMatch && (
            <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: 'rgba(63, 185, 80, 0.08)', border: '1px solid rgba(63, 185, 80, 0.2)' }}>
              <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-green">{t('אימות מוצלח', 'Verification Successful')}</div>
                <p className="text-sm text-foreground-muted">{t('הסטטוס התכנוני שדווח תואם את הנתונים שנמצאו במאגר.', 'Reported planning status matches the database records.')}</p>
              </div>
            </div>
          )}
          {hasStatusMismatch && (
            <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: 'rgba(248, 81, 73, 0.08)', border: '1px solid rgba(248, 81, 73, 0.2)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: '#FF7B72' }}>{t('אי-התאמה אפשרית', 'Possible Mismatch')}</div>
                <p className="text-sm text-foreground-muted">{t('הסטטוס שדווח לא תואם את הנמצא במאגר. מומלץ לוודא את הנתונים.', 'Reported status may not match database. Verify the data.')}</p>
              </div>
            </div>
          )}

          {planningData.slice(0, 5).map((plan, i) => (
            <div key={plan.id || i} className="rounded-lg p-5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(plan.status)}
                  <div>
                    <div className="text-sm font-bold text-foreground">{plan.complexName || plan.city}</div>
                    <div className="text-xs text-foreground-muted">{plan.city}{plan.planNumber ? ` | ${t('תוכנית', 'Plan')} ${plan.planNumber}` : ''}</div>
                  </div>
                </div>
                <div className="inline-block px-3 py-1 rounded text-xs font-medium" style={{ background: `color-mix(in srgb, ${getStatusColor(plan.status)} 15%, transparent)`, color: getStatusColor(plan.status) }}>
                  {plan.status}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <MiniStat label={t('דירות קיימות', 'Existing')} value={String(plan.existingUnits)} />
                <MiniStat label={t('דירות חדשות', 'Proposed')} value={String(plan.proposedUnits)} />
                <MiniStat label={t('שנת אישור', 'Approval')} value={plan.approvalYear || '\u2014'} />
                <MiniStat label={t('מסלול', 'Track')} value={plan.track || '\u2014'} />
              </div>
              {plan.inExecution && (
                <div className="mt-3 text-xs flex items-center gap-2">
                  {plan.inExecution === 'כן' ? (
                    <><CheckCircle2 className="w-4 h-4 text-green" /><span className="text-green font-medium">{t('בביצוע', 'In execution')}</span></>
                  ) : (
                    <><Clock className="w-4 h-4 text-foreground-muted" /><span className="text-foreground-muted">{t('טרם בביצוע', 'Not in execution')}</span></>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                {plan.mavatLink && <ExternalLinkBtn href={plan.mavatLink} label={t('מידע תכנוני', 'Planning Info')} />}
                {plan.govmapLink && <ExternalLinkBtn href={plan.govmapLink} label="GovMap" />}
              </div>
            </div>
          ))}

          <div className="flex justify-center gap-3 mt-3">
            <ExternalLinkBtn href="https://ags.iplan.gov.il/xplan/" label={t('XPLAN קווים כחולים', 'XPLAN Blue Lines')} />
            <ExternalLinkBtn href="https://mavat.iplan.gov.il/SV3" label={t('מבא״ת', 'Mavat')} />
          </div>
        </div>
      )}
    </>
  );
}

// =========================================
// Developer Section
// =========================================

function DeveloperSection({ developerData, developerLoading, developerName, onSearch, lang, t }: {
  developerData: DeveloperResponse | null; developerLoading: boolean; developerName: string;
  onSearch: (q: string) => void; lang: string; t: (he: string, en: string) => string;
}) {
  const [customSearch, setCustomSearch] = useState('');

  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
          <input type="text" className="w-full bg-transparent border-none outline-none text-sm text-foreground text-right placeholder:text-[var(--fg-dim)]"
            placeholder={t('חפש יזם לפי שם...', 'Search developer...')}
            value={customSearch} onChange={(e) => setCustomSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && customSearch.trim() && onSearch(customSearch.trim())} />
        </div>
        <button onClick={() => customSearch.trim() && onSearch(customSearch.trim())} className="px-4 py-2.5 rounded-lg text-sm font-medium border-0 cursor-pointer" style={{ background: 'var(--green)', color: '#fff' }}>
          {t('חפש', 'Search')}
        </button>
      </div>

      {developerLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-foreground-muted">
          <Loader2 className="w-5 h-5 animate-spin" />{t('מחפש פרופיל יזם...', 'Searching developer...')}
        </div>
      )}

      {!developerLoading && developerData && !developerData.found && (
        <div className="py-5">
          <div className="rounded-lg p-5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-foreground mb-1">{t(`היזם "${developerName}" לא נמצא בדירוג`, `"${developerName}" not found in rankings`)}</div>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  {t('יזם שאינו בדירוג עשוי להיות חברה חדשה, חברת בת, או חברה קטנה. מומלץ לבדוק.', 'May be a new, subsidiary, or small company. Investigation recommended.')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <ExternalLinkBtn href={developerData.duns100Link} label={t('Duns100 דירוג', 'Duns100')} />
            <ExternalLinkBtn href="https://madadithadshut.co.il/" label={t('מדד ההתחדשות', 'Renewal Index')} />
          </div>
        </div>
      )}

      {!developerLoading && developerData && developerData.found && (
        <div className="space-y-4">
          {developerData.results.map((dev, i) => (
            <div key={i} className="rounded-lg p-5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black" style={{
                  background: dev.tier === 'A' ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)',
                  color: dev.tier === 'A' ? 'var(--green)' : 'var(--accent)',
                }}>
                  {dev.tier}
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">{dev.name}</div>
                  <div className="text-xs text-foreground-muted">{dev.tierLabel}</div>
                </div>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed">{dev.summary}</p>
              <div className="grid grid-cols-4 gap-3 mt-4">
                <MiniStat label={t('סה״כ', 'Total')} value={String(dev.totalProjects)} />
                <MiniStat label={t('בבנייה', 'Building')} value={String(dev.inConstruction)} />
                <MiniStat label={t('נמסרו', 'Delivered')} value={String(dev.delivered)} />
                <MiniStat label={t('בתכנון', 'Planning')} value={String(dev.inPlanning)} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {dev.specialties.map((s, j) => (
                  <span key={j} className="px-3 py-1 rounded text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>{s}</span>
                ))}
              </div>
              <div className="flex gap-3 mt-4 pt-3 border-t border-[var(--border)]">
                <ExternalLinkBtn href={dev.madadLink} label={t('מדד ההתחדשות', 'Renewal Index')} />
                {dev.website && <ExternalLinkBtn href={dev.website} label={t('אתר החברה', 'Website')} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {!developerLoading && !developerData && developerName && (
        <p className="text-sm text-foreground-muted text-center py-4">{t(`מחפש "${developerName}"...`, `Searching "${developerName}"...`)}</p>
      )}
    </>
  );
}

// =========================================
// Sub-Components
// =========================================

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center px-3 py-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-[10px] text-foreground-muted uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function ExternalLinkBtn({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors hover:opacity-80"
      style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
      <ExternalLink className="w-3.5 h-3.5" />{label}
    </a>
  );
}
