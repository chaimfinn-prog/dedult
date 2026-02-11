'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, Building2, CalendarDays, ChevronLeft, AlertTriangle, ArrowRight, Loader2,
  Shield, TrendingUp, FileText, User, Briefcase, MapPin, ExternalLink, CheckCircle2,
  Clock, Search, XCircle, Info, Globe, Phone, Mail, Send, Home, DollarSign, Timer,
  HelpCircle, MessageSquare, Sprout, AlertOctagon, BarChart3, Landmark,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

/* ==========================================================================
   GLASS CARD STYLE — light semi-transparent cards for report sections
   Video stays visible behind. Text is dark for contrast.
   ========================================================================== */
const GLASS = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 'var(--radius)',
  color: '#1a1a2e',
};
const GLASS_ACCENT = {
  ...GLASS,
  background: 'rgba(255,255,255,0.92)',
  boxShadow: '0 0 32px rgba(91,141,238,0.12)',
};
const GLASS_WARN = {
  ...GLASS,
  background: 'rgba(255, 240, 230, 0.92)',
  border: '1px solid rgba(248, 81, 73, 0.25)',
};
const GLASS_GREEN = {
  ...GLASS,
  background: 'rgba(235, 255, 240, 0.92)',
  border: '1px solid rgba(63, 185, 80, 0.25)',
};
const GLASS_GOLD = {
  ...GLASS,
  background: 'rgba(255, 248, 230, 0.92)',
  border: '1px solid rgba(210, 153, 34, 0.25)',
};

/* ==========================================================================
   PLANNING OPTIONS
   ========================================================================== */

const planningOptionsPinui = [
  { value: 'initialPlanning', label: 'תכנון ראשוני של תב״ע', labelEn: 'Initial TBA Planning', baseYears: 7, stage: 'planning', desc: 'הפרויקט בשלב תכנון ראשוני — שלב מוקדם מאוד.', descEn: 'Very early planning stage.' },
  { value: 'thresholdConditions', label: 'קיום תנאי סף', labelEn: 'Threshold Conditions Met', baseYears: 6, stage: 'planning', desc: 'עמידה בתנאי סף. שלב משמעותי אך רחוק מהריסה.', descEn: 'Threshold met. Still far from demolition.' },
  { value: 'depositPublication', label: 'פרסום להפקדה', labelEn: 'Published for Deposit', baseYears: 5, stage: 'planning', desc: 'פורסם להפקדה. שלב סטטוטורי פעיל.', descEn: 'Published for deposit. Active statutory phase.' },
  { value: 'tabaApproved', label: 'תב״ע מאושרת', labelEn: 'TBA Approved', baseYears: 4, stage: 'planning', desc: 'תב"ע אושרה. הסיכון התכנוני העקרוני הוסר.', descEn: 'TBA approved. Major planning risk removed.' },
  { value: 'designApproved', label: 'תוכנית עיצוב מאושרת', labelEn: 'Design Plan Approved', baseYears: 3, stage: 'planning', desc: 'תוכנית עיצוב אושרה. מתקרבים לרישוי.', descEn: 'Design approved. Approaching permit phase.' },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 7, stage: 'planning', desc: 'שלב תכנוני לא ידוע — תרחיש שמרני.', descEn: 'Unknown — conservative estimate.' },
];

const permitStageOptions = [
  { value: 'none', label: 'טרם הוגשה', labelEn: 'Not yet filed', baseYears: 0, stage: 'planning' },
  { value: 'permitFiled', label: 'בקשה הוגשה', labelEn: 'Permit Filed', baseYears: 2.5, stage: 'permit' },
  { value: 'permitAccepted', label: 'בקשה נקלטה', labelEn: 'Accepted', baseYears: 2, stage: 'permit' },
  { value: 'selfLicensing', label: 'רישוי עצמי', labelEn: 'Self-Licensing', baseYears: 1.5, stage: 'permit' },
  { value: 'permitConditions', label: 'היתר בתנאים', labelEn: 'Conditional', baseYears: 1.5, stage: 'permit' },
  { value: 'fullPermit', label: 'היתר מלא', labelEn: 'Full Permit', baseYears: 0.5, stage: 'permit' },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 0, stage: 'planning' },
];

const planningOptionsTama = [
  { value: 'permitFiled', label: 'בקשה הוגשה', labelEn: 'Permit Filed', baseYears: 2.5, stage: 'permit', desc: 'בקשה להיתר הוגשה.', descEn: 'Permit filed.' },
  { value: 'permitAccepted', label: 'בקשה נקלטה', labelEn: 'Accepted', baseYears: 2, stage: 'permit', desc: 'הבקשה נקלטה.', descEn: 'Application accepted.' },
  { value: 'selfLicensing', label: 'רישוי עצמי', labelEn: 'Self-Licensing', baseYears: 1.5, stage: 'permit', desc: 'מסלול רישוי עצמי מקוצר.', descEn: 'Shortened self-licensing.' },
  { value: 'permitConditions', label: 'היתר בתנאים', labelEn: 'Conditional', baseYears: 1.5, stage: 'permit', desc: 'היתר בתנאים. שלב מתקדם.', descEn: 'Conditional permit. Advanced.' },
  { value: 'fullPermit', label: 'היתר מלא', labelEn: 'Full Permit', baseYears: 0.5, stage: 'permit', desc: 'היתר מלא — שלב סופי.', descEn: 'Full permit. Final stage.' },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 2.5, stage: 'permit', desc: 'שלב לא ידוע — תרחיש שמרני.', descEn: 'Unknown — conservative.' },
];

const allOptions = [...planningOptionsPinui, ...planningOptionsTama, ...permitStageOptions];

const SCAN_STEPS = [
  { he: 'אימות נתוני כתובת ומיקום', en: 'Verifying address and location' },
  { he: 'סריקת מאגר תוכניות מינהל התכנון', en: 'Scanning planning database' },
  { he: 'אימות סטטוס תכנוני', en: 'Verifying planning status' },
  { he: 'בדיקת איתנות פיננסית של היזם', en: 'Checking developer financials' },
  { he: 'ניתוח תקן 21 ורווחיות', en: 'Analyzing Standard 21' },
  { he: 'חישוב מקדמי סיכון', en: 'Computing risk factors' },
  { he: 'עיבוד דוח סופי', en: 'Generating final report' },
];

/* ==========================================================================
   TYPES
   ========================================================================== */

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

interface DeveloperResponse { query: string; found: boolean; results: DeveloperResult[]; source: string; duns100Link: string; }

interface FormData {
  street: string; city: string; developerName: string; projectName: string;
  price: string; rent: string; apartmentSize: string; sqmAddition: string;
  projectType: string; tenantCount: string; signatureStatus: string;
  planningStatus: string; permitStage: string; objection: string; toldYears: string;
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function getRiskLevel(c: number) {
  if (c < 40) return { label: 'גבוהה מאוד', labelEn: 'Very High', color: 'var(--red)', barClass: 'confidence-low' };
  if (c < 70) return { label: 'בינונית', labelEn: 'Medium', color: 'var(--gold)', barClass: 'confidence-medium' };
  return { label: 'נמוכה', labelEn: 'Low', color: 'var(--green)', barClass: 'confidence-high' };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
}

function getExpectedStatusKeywords(s: string): string[] {
  switch (s) {
    case 'tabaApproved': case 'designApproved': return ['מאושרת', 'אישור', 'תוקף'];
    case 'depositPublication': return ['הפקדה', 'הופקד'];
    case 'fullPermit': case 'permitConditions': return ['היתר', 'במימוש', 'בביצוע'];
    default: return [];
  }
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function ReportPage() {
  const router = useRouter();
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const [form, setForm] = useState<FormData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const [planningData, setPlanningData] = useState<PlanningRecord[]>([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanningRecord | null>(null);
  const [devData, setDevData] = useState<DeveloperResponse | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  const [activeCta, setActiveCta] = useState<null | 'consultation' | 'report' | 'broker'>(null);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '' });
  const [investForm, setInvestForm] = useState({ budget: '', city: '', freeText: '', years: '' });
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [ctaSending, setCtaSending] = useState(false);

  // Load form data
  useEffect(() => {
    const saved = sessionStorage.getItem('rc-form');
    if (!saved) { router.push('/checkup'); return; }
    const parsed = JSON.parse(saved) as FormData;
    setForm(parsed);
    // Don't scan for agricultural land — show warning immediately
    if (parsed.projectType === 'agri') { setShowResults(true); return; }
    setIsScanning(true);
    if (parsed.city || parsed.street || parsed.projectName) fetchPlanning(parsed.street, parsed.city, parsed.projectName);
    if (parsed.developerName) fetchDev(parsed.developerName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlanning = useCallback(async (street: string, city: string, projectName: string) => {
    setPlanningLoading(true);
    try {
      const p = new URLSearchParams();
      if (street && city) { p.set('street', street); p.set('city', city); }
      else if (projectName) p.set('q', projectName);
      else if (street) p.set('q', street);
      else if (city) p.set('city', city);
      const res = await fetch(`/api/planning?${p.toString()}`);
      if (res.ok) { const d = await res.json(); setPlanningData(d.records ?? []); }
    } catch { /* silent */ }
    setPlanningLoading(false);
  }, []);

  const fetchDev = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setDevLoading(true);
    try { const res = await fetch(`/api/developer?q=${encodeURIComponent(q.trim())}`); if (res.ok) setDevData(await res.json()); }
    catch { /* silent */ }
    setDevLoading(false);
  }, []);

  // Scanning animation
  useEffect(() => {
    if (!isScanning) return;
    setScanStep(0);
    const iv = setInterval(() => {
      setScanStep((p) => { if (p >= SCAN_STEPS.length - 1) { clearInterval(iv); setIsScanning(false); setShowResults(true); return p; } return p + 1; });
    }, 700);
    return () => clearInterval(iv);
  }, [isScanning]);

  // CTA submit
  const handleCtaSubmit = async () => {
    if (!contactForm.name || !contactForm.phone || !contactForm.email) return;
    if (activeCta === 'broker' && (!investForm.city || !investForm.budget)) return;
    setCtaSending(true);
    try {
      await fetch('/api/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeCta, formData: form,
          reportData: calc ? { certainty: calc.certainty, years: calc.years, gap: calc.promiseDiff } : null,
          contactInfo: contactForm,
          investmentInfo: activeCta === 'broker' ? investForm : null,
        }),
      });
    } catch { /* silent */ }
    setCtaSubmitted(true);
    setCtaSending(false);
  };

  /* ========================================================================
     CORE CALCULATION
     ======================================================================== */

  const calc = useMemo(() => {
    if (!form || form.projectType === 'agri') return null;

    let planning = allOptions.find(o => o.value === form.planningStatus && 'desc' in o);
    if (!planning) planning = planningOptionsPinui[0];

    const permit = permitStageOptions.find(o => o.value === form.permitStage);
    const usePermit = form.projectType === 'pinui' && (form.planningStatus === 'tabaApproved' || form.planningStatus === 'designApproved') && permit && permit.value !== 'none' && permit.value !== 'unknown';

    let years = usePermit ? permit!.baseYears : planning.baseYears;
    const adjustments: { he: string; en: string }[] = [];
    const risks: { he: string; en: string }[] = [];
    const unknownFields: { he: string; en: string }[] = [];

    // Track unknowns
    if (form.planningStatus === 'unknown') unknownFields.push({ he: 'שלב תכנוני', en: 'Planning stage' });
    if (form.permitStage === 'unknown') unknownFields.push({ he: 'שלב רישוי', en: 'Permit stage' });
    if (form.signatureStatus === 'unknown') unknownFields.push({ he: 'סטטוס חתימות', en: 'Signatures' });
    if (form.tenantCount === 'unknown') unknownFields.push({ he: 'מספר דיירים', en: 'Tenant count' });
    if (form.objection === 'unknown') unknownFields.push({ he: 'התנגדויות/ערר', en: 'Objections' });

    // Objection
    if (form.objection === 'objection') { years += 1; adjustments.push({ he: '+1.0 שנה: התנגדות', en: '+1.0y: Objection' }); }
    else if (form.objection === 'appeal') { years += 1.5; adjustments.push({ he: '+1.5 שנים: ערר', en: '+1.5y: Appeal' }); }
    else if (form.objection === 'both') { years += 2; adjustments.push({ he: '+2.0 שנים: התנגדות + ערר', en: '+2.0y: Both' }); }
    else if (form.objection === 'unknown') { years += 0.5; adjustments.push({ he: '+0.5 שנה: חוסר ודאות', en: '+0.5y: Uncertainty' }); }

    // 100+ tenants
    const planStage = usePermit ? permit!.stage : planning.stage;
    if (form.tenantCount === 'over100') {
      years += 0.8;
      adjustments.push({ he: '+0.8 שנים: מורכבות (מעל 100 דיירים)', en: '+0.8y: Complexity (100+ tenants)' });
    }

    // Signatures
    if (form.signatureStatus === 'full') { years = Math.max(0.5, years - 1); adjustments.push({ he: '−1.0 שנה: 100% חתימות', en: '−1.0y: 100% signatures' }); }

    // Certainty
    let certainty = 100;
    if (form.signatureStatus === 'noMajority') { certainty -= 30; risks.push({ he: 'אין רוב חוקי (−30%)', en: 'No majority (−30%)' }); }
    else if (form.signatureStatus === 'unknown') { certainty -= 20; risks.push({ he: 'חתימות לא ידועות (−20%)', en: 'Unknown signatures (−20%)' }); }

    if (form.projectType === 'pinui' && planStage === 'planning' && form.planningStatus !== 'tabaApproved' && form.planningStatus !== 'designApproved') {
      certainty -= 25; risks.push({ he: 'פינוי-בינוי ללא תב"ע מאושרת (−25%)', en: 'No approved TBA (−25%)' });
    }
    if (form.planningStatus === 'unknown') { certainty -= 25; risks.push({ he: 'שלב תכנוני לא ידוע (−25%)', en: 'Unknown planning (−25%)' }); }

    const sqmAdd = parseFloat(form.sqmAddition);
    const hasSqmRisk = Number.isFinite(sqmAdd) && sqmAdd > 12;
    if (hasSqmRisk) { certainty -= 15; risks.push({ he: 'תוספת מ"ר חורגת — תקן 21 (−15%)', en: 'Excess sqm — Std 21 (−15%)' }); }

    if (form.objection === 'objection') { certainty -= 10; risks.push({ he: 'התנגדות (−10%)', en: 'Objection (−10%)' }); }
    else if (form.objection === 'appeal') { certainty -= 15; risks.push({ he: 'ערר (−15%)', en: 'Appeal (−15%)' }); }
    else if (form.objection === 'both') { certainty -= 20; risks.push({ he: 'התנגדות + ערר (−20%)', en: 'Both (−20%)' }); }
    else if (form.objection === 'unknown') { certainty -= 10; risks.push({ he: 'התנגדויות לא ידועות (−10%)', en: 'Unknown objections (−10%)' }); }

    // **100+ TENANT TRAP** — extra -25% certainty penalty
    if (form.tenantCount === 'over100') {
      certainty -= 25;
      risks.push({ he: 'מקדם חיכוך גבוה: מעל 100 דיירים (−25%)', en: 'High friction: 100+ tenants (−25%)' });
    }

    certainty = Math.max(0, Math.min(100, certainty));

    // Financial
    const price = parseFloat(form.price);
    const rent = parseFloat(form.rent);
    const size = parseFloat(form.apartmentSize);
    const told = parseFloat(form.toldYears);
    const annualYield = Number.isFinite(price) && Number.isFinite(rent) && price > 0 ? ((rent * 12) / price) * 100 : null;
    const pricePerSqm = Number.isFinite(price) && Number.isFinite(size) && size > 0 ? price / size : null;
    const promiseDiff = Number.isFinite(told) ? Number((years - told).toFixed(1)) : null;
    const planningDesc = 'desc' in planning ? (planning as { desc: string }).desc : '';
    const planningDescEn = 'descEn' in planning ? (planning as { descEn: string }).descEn : '';

    // Generate score explanation paragraph
    const riskLevel = getRiskLevel(certainty);
    const occupancyYear = new Date().getFullYear() + Math.ceil(years);

    let explanationHe = `ציון הוודאות נקבע על סמך: `;
    let explanationEn = `The certainty score was determined by: `;
    const factorsHe = risks.map(r => r.he);
    const factorsEn = risks.map(r => r.en);
    explanationHe += factorsHe.join(', ') + '. ';
    explanationEn += factorsEn.join(', ') + '. ';

    if (form.planningStatus !== 'unknown') {
      const statusLabel = allOptions.find(o => o.value === form.planningStatus)?.label ?? '';
      explanationHe += `הפרויקט נמצא בסטטוס "${statusLabel}"`;
      explanationEn += `The project is at "${allOptions.find(o => o.value === form.planningStatus)?.labelEn ?? ''}" status`;
    }
    if (form.tenantCount === 'over100') {
      explanationHe += `, ובשל היקף של מעל 100 דיירים, המערכת הפחיתה את הציון בגין סיכון התארגנות ועיכובים משפטיים`;
      explanationEn += `, and due to 100+ tenants, the system reduced the score for organizational risk and legal delays`;
    }
    explanationHe += `. התחזית שלנו שמרנית וכוללת מקדמי ביטחון.`;
    explanationEn += `. Our forecast is conservative and includes safety margins.`;

    return {
      years: Number(years.toFixed(1)), certainty, promiseDiff,
      toldYears: Number.isFinite(told) ? told : null,
      annualYield: annualYield !== null ? Number(annualYield.toFixed(2)) : null,
      pricePerSqm: pricePerSqm !== null ? Math.round(pricePerSqm) : null,
      hasSqmRisk, sqmAdd: Number.isFinite(sqmAdd) ? sqmAdd : null,
      risk: riskLevel, adjustments, risks, unknownFields,
      planningDesc, planningDescEn,
      occupancyYear, explanationHe, explanationEn,
      isNegativeCarry: annualYield !== null && annualYield < 3,
    };
  }, [form]);

  if (!form) return <div className="min-h-screen flex items-center justify-center text-foreground-muted">טוען...</div>;

  const displayAddress = [form.street, form.city].filter(Boolean).join(', ');
  const isAgri = form.projectType === 'agri';

  /* ========================================================================
     RENDER
     ======================================================================== */

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80">
          <source src="https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80')` }} />
        <div className="absolute inset-0 bg-overlay-dark opacity-60" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border)] sticky top-0" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-green" />
            <span className="font-bold text-sm text-white tracking-tight">THE REALITY CHECK</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-white transition-colors cursor-pointer bg-transparent border-0"><Globe className="w-3.5 h-3.5" />{lang === 'he' ? 'EN' : 'עב'}</button>
            <a href="/checkup" className="text-xs text-foreground-muted hover:text-white transition-colors flex items-center gap-1">{t('בדיקה חדשה', 'New Check')}<ArrowRight className="w-3 h-3" /></a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 flex-1 w-full">

        {/* ============ AGRICULTURAL LAND — FULL BLOCK WARNING ============ */}
        {isAgri && showResults && (
          <div className="fade-in-up">
            {/* Full-screen warning with cracked earth background */}
            <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: '100vh' }}>
              {/* Background: cracked parched earth */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=2000&q=80')", filter: 'saturate(0.3)' }} />
              {/* Dark overlay 75% */}
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} />

              <div className="relative z-10 p-8 md:p-12 text-right" dir="rtl">
                {/* Icon + Main Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,38,38,0.25)', border: '2px solid rgba(220,38,38,0.5)' }}>
                    <Sprout className="w-8 h-8" style={{ color: '#ef4444' }} />
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black leading-tight" style={{ color: '#ef4444' }}>
                    {t('אזהרה חמורה: סיכון קיצוני וחוסר ודאות בהשקעה', 'Severe Warning: Extreme Risk and Investment Uncertainty')}
                  </h1>
                </div>

                {/* Intro Paragraph */}
                <div className="max-w-4xl mb-8">
                  <p className="text-base md:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {t(
                      'רכישת קרקע חקלאית בישראל היא מהלך המאופיין ברמת סיכון קיצונית ובחוסר ודאות מובנה. בניגוד לרכישת דירה מוכנה או מניות בשוק ההון, כאן המשקיע תלוי בשורה ארוכה של משתנים שאינם בשליטתו: החלטות פוליטיות של מוסדות התכנון, מדיניות ארצית של שימור שטחים פתוחים, יכולת הניהול של קבוצת זרים במושע, ועמידות התקציב האישי מול נטל מיסוי שעלול להגיע ל-70% מסך ההשבחה (בשקלול היטל השבחה, מס שבח ועלויות פיתוח).',
                      'Purchasing agricultural land in Israel is characterized by extreme risk and inherent uncertainty. Unlike buying a finished apartment or stock market shares, the investor depends on a long chain of uncontrollable variables: political decisions by planning institutions, national open space preservation policy, management capability of a group of strangers in musha, and personal budget resilience against a tax burden that can reach 70% of total appreciation.'
                    )}
                  </p>
                </div>

                <div className="max-w-4xl mb-10">
                  <p className="text-base md:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {t(
                      'הכשל המרכזי טמון בעובדה שהשוק מתמחר את ה"ציפיות" כבר במחיר הרכישה המקורי. כתוצאה מכך, המשקיע משלם פרמיה גבוהה על סיכון שלא בטוח שיתממש, וגם אם יתממש – השנים הרבות של ההמתנה (למעלה מ-15 שנה בממוצע לקרקע גולמית) שוחקות את התשואה הריאלית והופכות את ההשקעה לבלתי כלכלית בהשוואה לאפיקים סולידיים יותר. עבור המשקיע הסביר, הקרקע החקלאית היא לעיתים קרובות נכס שקל מאוד לקנות וקשה מאוד (עד בלתי אפשרי) למכור, מה שהופך אותה ל"בור ללא תחתית" של הוצאות במקום למנוע של צמיחה והון.',
                      'The core failure lies in the fact that the market already prices "expectations" into the original purchase price. As a result, the investor pays a high premium on risk that may never materialize, and even if it does – the many years of waiting (over 15 years on average for raw land) erode real returns and make the investment uneconomical compared to more solid channels. For the average investor, agricultural land is often an asset that is very easy to buy and very hard (to impossible) to sell, turning it into a "bottomless pit" of expenses rather than an engine of growth.'
                    )}
                  </p>
                </div>

                {/* Risk Factors Header */}
                <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: '#fbbf24' }}>
                  {t('הנה הנקודות המרכזיות שהופכות השקעה בקרקע חקלאית לסיכון משמעותי ולעיתים קרובות ללא כדאית מבחינה כלכלית:', 'Key factors that make agricultural land investment a significant and often uneconomical risk:')}
                </h2>

                {/* 7 Bullet Points */}
                <div className="max-w-4xl space-y-5 mb-10">
                  <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: '#ef4444' }}>{t('חוסר ודאות תכנוני מובנה', 'Inherent Planning Uncertainty')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {t('תוכניות מתאר ארציות כמו תמ"א 35 מגדירות אזורים לשימור ומונעות הפשרה של קרקעות שאינן צמודות דופן ליישובים קיימים. משקיעים רבים מגלים מאוחר מדי שהקרקע שרכשו מוגדרת כשטח פתוח מוגן שהסיכוי לשינוי ייעודו קלוש.', 'National outline plans like TAMA 35 designate preservation zones and prevent rezoning of land not adjacent to existing settlements. Many investors discover too late that their land is classified as protected open space with minimal chance of rezoning.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: '#ef4444' }}>{t('לוחות זמנים של עשרות שנים', 'Decades-Long Timelines')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {t('תהליך הפשרה של קרקע חקלאית גולמית יכול להימשך בין מספר שנים לעשור ואף עשרות שנים, ללא כל ערובה לתוצאה הסופית. לאורך כל התקופה הזו, הכסף "נעול" ללא תשואה שוטפת.', 'The rezoning process for raw agricultural land can take years to decades, with no guarantee of outcome. Throughout this entire period, capital is locked with no current yield.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: '#ef4444' }}>{t('עיכובים בשל התנגדויות', 'Objection-Driven Delays')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {t('חוק התכנון והבנייה מאפשר לכל בעל עניין, תושב או ארגון סביבתי להגיש התנגדות לתוכנית שהופקדה. הליכים אלו, יחד עם ערעורים ועתירות מנהליות, מייצרים עיכובים משפטיים כבדים שעלולים להקפיא פרויקטים לשנים רבות.', 'The Planning and Building Law allows any stakeholder, resident or environmental organization to file objections. These proceedings, along with appeals and administrative petitions, create heavy legal delays that can freeze projects for years.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: '#ef4444' }}>{t('סיכוני הבעלות המשותפת ("מושע")', 'Joint Ownership Risks ("Musha")')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {t('רכישה כחלק מקבוצה גדולה בתוך חטיבת קרקע אחת (Musha) משמעותה שאין לכם בעלות על מגרש ספציפי. כל החלטה דורשת הסכמה של שותפים רבים, ודי בשותף סרבן אחד או בסכסוך פנימי כדי לעכב את פיתוח הקרקע או את מכירתה.', 'Purchasing as part of a large group within a single land parcel (Musha) means you have no ownership of a specific plot. Every decision requires consent of many partners, and a single refusing partner or internal dispute can delay development or sale.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: '#ef4444' }}>{t('הפרשות לצורכי ציבור (הפקעות)', 'Public Purpose Appropriations')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {t('במסגרת הליכי איחוד וחלוקה, הרשויות רשאיות להפקיע עד 40% מהשטח לצרכי ציבור ללא תשלום פיצוי, ובפועל ההפרשות בתוכניות מודרניות מגיעות גם ל-50% ומעלה. לכן, רכישת שטח קטן (כמו 100 מ"ר) עלולה שלא להספיק לקבלת זכות לדירה שלמה לאחר הקיזוזים.', 'In consolidation and redistribution proceedings, authorities can appropriate up to 40% of land for public needs without compensation, and in practice modern plans reach 50%+. Therefore, purchasing a small area (like 100 sqm) may not suffice for a full apartment right after deductions.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: '#ef4444' }}>{t('מיסוי שוחק', 'Erosive Taxation')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {t('המיסוי על קרקע חקלאית הוא מהכבדים בשוק: היטל השבחה בגובה 50% מעליית השווי המשולם לרשות המקומית, מס שבח בשיעור של עד 25% מהרווח הריאלי ומס רכישה של 6% ללא מדרגות פטור.', 'Taxation on agricultural land is among the heaviest in the market: 50% betterment levy on value increase paid to local authority, capital gains tax of up to 25% on real profit, and 6% purchase tax with no exemption brackets.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
                    <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: '#ef4444' }}>{t('מלכודת קרקעות המדינה (רמ"י)', 'State Land Trap (RMI)')}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {t('בקרקע המוחכרת מרשות מקרקעי ישראל, חוזה החכירה קובע לרוב כי עם שינוי הייעוד הקרקע חוזרת למדינה. במצב כזה, החוכר מקבל פיצוי חקלאי מינימלי בלבד ואינו נהנה מעליית הערך של הקרקע למגורים.', 'For land leased from the Israel Land Authority, the lease contract typically stipulates that upon rezoning the land reverts to the state. The lessee receives only minimal agricultural compensation and does not benefit from the land\'s residential value increase.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <a href="/booking" className="inline-flex items-center gap-3 py-5 px-10 rounded-xl text-lg font-black border-0 cursor-pointer transition-all hover:scale-105" style={{ background: '#dc2626', color: '#fff', boxShadow: '0 0 40px rgba(220,38,38,0.4)' }}>
                    <CalendarDays className="w-6 h-6" />
                    {t('העסקה דורשת בדיקת עומק — לקביעת פגישת ייעוץ לחץ כאן', 'This deal requires deep review — click to schedule consultation')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ SCANNING ANIMATION ============ */}
        {isScanning && (
          <div className="rounded-2xl p-10 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden" style={GLASS}>
            <div className="radar-container mb-8"><div className="radar-ring" /><div className="radar-ring-2" /><div className="radar-ring-3" /><div className="radar-sweep" />
              <div className="radar-dot" style={{ top: '20%', right: '30%' }} /><div className="radar-dot" style={{ top: '60%', right: '70%', animationDelay: '0.5s' }} /></div>
            <div className="w-full max-w-sm space-y-3">
              {SCAN_STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm" style={{ opacity: scanStep >= i ? 1 : 0.25, transition: 'opacity 0.3s', color: '#1a1a2e' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: scanStep > i ? 'var(--green)' : scanStep === i ? 'var(--accent)' : '#e0e0e0', color: scanStep >= i ? '#fff' : '#999' }}>
                    {scanStep > i ? '\u2713' : i + 1}
                  </div>
                  <span className={scanStep === i ? 'font-semibold' : ''}>{lang === 'he' ? s.he : s.en}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ FULL REPORT ============ */}
        {!isScanning && showResults && !isAgri && calc && (
          <div className="space-y-6 fade-in-up">

            {/* ===== THE HOLY TRINITY — Top Center ===== */}
            <div className="rounded-2xl p-8 text-center" style={GLASS_ACCENT}>
              <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--accent)' }}>THE REALITY CHECK</div>
              <h2 className="text-lg font-bold mb-6" style={{ color: '#1a1a2e' }}>{form.projectName || displayAddress || t('דוח ניתוח', 'Analysis Report')}</h2>

              {/* 1. Realistic Date */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#666' }}>{t('מועד אכלוס ריאלי (תרחיש סביר)', 'Realistic Occupancy Date (Likely Scenario)')}</div>
                <div className="text-6xl md:text-7xl font-black font-mono" style={{ color: 'var(--accent)' }}>{calc.occupancyYear}</div>
                <div className="text-base mt-1" style={{ color: '#666' }}>{calc.years} {t('שנים להריסה', 'years to demolition')}</div>
              </div>

              {/* 2. Certainty Score */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#666' }}>{t('מדד הוודאות (Certainty Score)', 'Certainty Score')}</div>
                <div className="text-7xl font-black font-mono" style={{ color: calc.risk.color }}>{calc.certainty}<span className="text-3xl">%</span></div>
                <div className="max-w-sm mx-auto mt-2 h-2 rounded-full overflow-hidden" style={{ background: '#e0e0e0' }}>
                  <div className={`h-full rounded-full ${calc.risk.barClass}`} style={{ width: `${calc.certainty}%`, transition: 'width 1s' }} />
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color: calc.risk.color }}>
                  {t('רמת סיכון: ', 'Risk: ')}{lang === 'he' ? calc.risk.label : calc.risk.labelEn}
                </div>
              </div>

              {/* 3. The Explanation — MANDATORY */}
              <div className="rounded-xl p-5 text-right mx-auto max-w-2xl" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: '#666' }}>{t('הסבר המערכת', 'System Explanation')}</div>
                <p className="text-sm leading-relaxed" style={{ color: '#333' }}>{lang === 'he' ? calc.explanationHe : calc.explanationEn}</p>
              </div>
            </div>

            {/* Gap Display — "What You Were Told vs Reality" */}
            {calc.toldYears !== null && (
              <div className="rounded-2xl p-8" style={GLASS_ACCENT}>
                <h3 className="text-base font-bold mb-5 text-center" style={{ color: '#1a1a2e' }}>{t('הפער בין מה שנאמר לך למציאות', 'Gap: Told vs Reality')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(210,153,34,0.1)', border: '1px solid rgba(210,153,34,0.2)' }}>
                    <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#b8860b' }}>{t('מה נאמר לך', 'What You Were Told')}</div>
                    <div className="text-4xl font-black font-mono" style={{ color: '#b8860b' }}>{calc.toldYears}</div>
                    <div className="text-xs mt-1" style={{ color: '#999' }}>{t('שנים', 'years')}</div>
                  </div>
                  <div className="rounded-xl p-5 text-center" style={{ background: calc.promiseDiff! > 0 ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)', border: `1px solid ${calc.promiseDiff! > 0 ? 'rgba(248,81,73,0.3)' : 'rgba(63,185,80,0.3)'}` }}>
                    <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: calc.promiseDiff! > 0 ? 'var(--red)' : 'var(--green)' }}>{t('הפער', 'THE GAP')}</div>
                    <div className="text-4xl font-black font-mono" style={{ color: calc.promiseDiff! > 0 ? 'var(--red)' : 'var(--green)' }}>
                      {calc.promiseDiff! > 0 ? `+${calc.promiseDiff}` : `${calc.promiseDiff}`}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#999' }}>{t('שנים', 'years')}</div>
                  </div>
                  <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(91,141,238,0.1)', border: '1px solid rgba(91,141,238,0.25)' }}>
                    <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--accent)' }}>{t('הצפי הריאלי', 'Reality')}</div>
                    <div className="text-4xl font-black font-mono" style={{ color: 'var(--accent)' }}>{calc.years}</div>
                    <div className="text-xs mt-1" style={{ color: '#999' }}>{t('שנים', 'years')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Unknown Fields Warning */}
            {calc.unknownFields.length > 0 && (
              <div className="rounded-2xl p-6" style={GLASS_GOLD}>
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#b8860b' }} />
                  <div>
                    <h3 className="text-base font-bold mb-2" style={{ color: '#8B6914' }}>{t('נתונים חסרים — כדאי לבדוק', 'Missing Data')}</h3>
                    <p className="text-sm mb-2" style={{ color: '#5d4e37' }}>{t('הנתונים הבאים קריטיים להבנת הכדאיות הכלכלית של העסקה:', 'These are critical for assessing this deal:')}</p>
                    <ul className="space-y-1">{calc.unknownFields.map((f, i) => <li key={i} className="text-sm flex items-center gap-2" style={{ color: '#8B6914' }}><span className="w-2 h-2 rounded-full" style={{ background: '#b8860b' }} />{lang === 'he' ? f.he : f.en}</li>)}</ul>
                  </div>
                </div>
              </div>
            )}

            {/* 100+ Tenant Trap Warning */}
            {form.tenantCount === 'over100' && (
              <div className="rounded-2xl p-6" style={GLASS_WARN}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#c0392b' }} />
                  <div>
                    <h3 className="text-base font-bold mb-2" style={{ color: '#c0392b' }}>{t('אזהרת מורכבות: מעל 100 בעלי זכויות', '100+ Tenant Complexity Warning')}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#5c1a1a' }}>
                      {t(
                        'שים לב: בפרויקט בהיקף כזה (מעל 100 בעלי זכויות), מקדם החיכוך הוא קריטי. הסטטיסטיקה מראה על סבירות גבוהה מאוד לעיכובים משמעותיים הנובעים מדיירים סרבנים, קשיים בפינוי בפועל, וניהול אופרציית הליווי הבנקאי מול מאות בתי אב. הלו"ז המוצג הינו אופטימי מידי ביחס למורכבות החברתית.',
                        'Note: In a project of this scale (100+ rights holders), the friction coefficient is critical. Statistics show very high probability of significant delays from refusing tenants, evacuation difficulties, and managing bank accompaniment for hundreds of households. The presented timeline is too optimistic relative to social complexity.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Negative Carry Warning */}
            {calc.isNegativeCarry && (
              <div className="rounded-2xl p-6" style={GLASS_WARN}>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#c0392b' }} />
                  <div>
                    <h3 className="text-base font-bold mb-2" style={{ color: '#c0392b' }}>{t('תזרים מזומנים גרעוני (Negative Carry)', 'Negative Cash Flow (Negative Carry)')}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#5c1a1a' }}>
                      {t(
                        'הנכס מניב תשואה שוטפת הנמוכה מ-3%. בסביבת הריבית הנוכחית (משכנתא כ-5%+), המשמעות היא הפסד חודשי קבוע (תזרים שלילי). עליך להיערך להשלמת הון חודשית מהכיס לאורך כל חיי הפרויקט, עד לאכלוס. כל עיכוב בלוחות הזמנים יעמיק את ההפסד התזרימי המצטבר.',
                        'The property yields below 3% annually. With current interest rates (~5%+ mortgage), this means a fixed monthly loss (negative cash flow). You must be prepared to supplement capital from pocket throughout the project\'s life until occupancy. Any timeline delay deepens the cumulative cash flow loss.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Planning Verification with TABA Selection */}
            <div className="rounded-2xl p-6" style={GLASS}>
              <div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5" style={{ color: 'var(--accent)' }} /><h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>{t('אימות סטטוס תכנוני', 'Planning Verification')}</h2></div>
              <PlanningSection planningData={planningData} planningLoading={planningLoading} street={form.street} city={form.city}
                onSearch={(q) => fetchPlanning(q, form.city, '')} reportedStatus={form.planningStatus}
                selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} lang={lang} t={t} />
            </div>

            {/* Developer Profile */}
            {form.developerName && (
              <div className="rounded-2xl p-6" style={GLASS}>
                <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5" style={{ color: 'var(--green)' }} /><h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>{t('פרופיל יזם', 'Developer Profile')}</h2></div>
                <DevSection devData={devData} devLoading={devLoading} devName={form.developerName} onSearch={fetchDev} lang={lang} t={t} />
              </div>
            )}

            {/* Financial Overview */}
            <div className="rounded-2xl p-6" style={GLASS}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5" style={{ color: 'var(--green)' }} /><h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>{t('ניתוח כלכלי', 'Financial')}</h2></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: '#888' }}>{t('תשואה שנתית', 'Annual Yield')}</div>
                  <div className="text-2xl font-black font-mono" style={{ color: calc.annualYield !== null && calc.annualYield < 3 ? 'var(--red)' : 'var(--green)' }}>{calc.annualYield !== null ? `${calc.annualYield}%` : '\u2014'}</div>
                </div>
                <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: '#888' }}>{t('מחיר למ"ר', 'Price/Sqm')}</div>
                  <div className="text-2xl font-black font-mono" style={{ color: '#1a1a2e' }}>{calc.pricePerSqm !== null ? formatCurrency(calc.pricePerSqm) : '\u2014'}</div>
                </div>
              </div>
            </div>

            {/* PREMIUM TRAP — Always Show */}
            <div className="rounded-2xl p-6" style={GLASS_GOLD}>
              <div className="flex items-start gap-3">
                <Landmark className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#8B6914' }} />
                <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#8B6914' }}>{t('ניתוח רגישות: סיכון מחיקת פרמיה', 'Sensitivity: Premium Erasure Risk')}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5d4e37' }}>
                    {t(
                      'מחיר העסקה הנוכחי מגלם "פרמיית התחדשות" (שווי פוטנציאלי עתידי). עליך לקחת בחשבון תרחיש קיצון של ביטול הפרויקט או אי-היתכנות כלכלית. במקרה כזה, שווי הנכס יצנח מיידית ל"שווי שימוש נוכחי" (ללא הפוטנציאל), מה שיגרור הפסד הון משמעותי (מחיקת הפרמיה ששולמה).',
                      'The current transaction price includes a "renewal premium" (future potential value). You must consider the extreme scenario of project cancellation or economic infeasibility. In such case, the property value would immediately drop to "current use value" (without potential), resulting in significant capital loss (erasure of the premium paid).'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Expert Disclaimer */}
            <div className="rounded-2xl p-6" style={GLASS}>
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: '#333' }}>
                    {t(
                      'דוח זה אינו פלט אוטומטי בלבד. זהו ניתוח עומק המבוסס על מתודולוגיה שמאית, אשר נכתב, נבדק ומאומת באופן אישי על ידי מומחי נדל"ן, כלכלנים ושמאי מקרקעין. הנתונים עוברים בקרת איכות אנושית (Manual Verification) כדי להבטיח דיוק מקסימלי מול המציאות התכנונית.',
                      'This report is not merely automated output. It is an in-depth analysis based on appraisal methodology, written, reviewed and personally verified by real estate experts, economists and appraisers. Data undergoes human quality control (Manual Verification) to ensure maximum accuracy against planning reality.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Cal.com Booking Widget */}
            <div className="rounded-2xl p-6" style={GLASS_GREEN}>
              <div className="text-center mb-4">
                <CalendarDays className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--green)' }} />
                <h3 className="text-base font-bold mb-2" style={{ color: '#1a5c2a' }}>{t('קביעת פגישת ייעוץ', 'Schedule Consultation')}</h3>
                <p className="text-sm" style={{ color: '#2d6b3f' }}>{t('45 דקות ניתוח מעמיק עם המומחים שלנו', '45 min deep analysis with our experts')}</p>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: '#fff', minHeight: '400px' }}>
                <iframe
                  src="https://cal.com/chaim-finn-xbxkhk?embed=true&theme=light"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title="Schedule Consultation"
                />
              </div>
            </div>

            {/* THREE CTAs */}
            {!ctaSubmitted && !activeCta && (
              <div className="space-y-4">
                <div className="text-center mb-4"><h2 className="text-xl font-bold text-white">{t('מה הצעד הבא?', "What's Next?")}</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => setActiveCta('consultation')} className="rounded-2xl p-6 text-right transition-all cursor-pointer border-0" style={GLASS}>
                    <CalendarDays className="w-8 h-8 mb-3" style={{ color: 'var(--accent)' }} />
                    <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>{t('פגישת ייעוץ', 'Consultation')}</h3>
                    <p className="text-sm mb-3" style={{ color: '#666' }}>{t('45 דקות ניתוח מעמיק', '45 min deep analysis')}</p>
                    <div className="text-base font-bold" style={{ color: 'var(--accent)' }}>3,000 ₪</div>
                  </button>
                  <button onClick={() => setActiveCta('report')} className="rounded-2xl p-6 text-right transition-all cursor-pointer border-0" style={GLASS}>
                    <FileText className="w-8 h-8 mb-3" style={{ color: 'var(--green)' }} />
                    <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>{t('דוח מפורט', 'Detailed Report')}</h3>
                    <p className="text-sm mb-3" style={{ color: '#666' }}>{t('בדיקה ידנית — 7 ימי עבודה', 'Manual review — 7 business days')}</p>
                    <div className="text-base font-bold" style={{ color: 'var(--green)' }}>750 ₪</div>
                  </button>
                  <button onClick={() => setActiveCta('broker')} className="rounded-2xl p-6 text-right transition-all cursor-pointer border-0" style={GLASS}>
                    <Home className="w-8 h-8 mb-3" style={{ color: '#b8860b' }} />
                    <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>{t('תיווך להשקעה', 'Investment Broker')}</h3>
                    <p className="text-sm mb-3" style={{ color: '#666' }}>{t('מתווך מטעמנו ייצור קשר', 'Our broker will contact you')}</p>
                    <div className="text-base font-bold" style={{ color: '#b8860b' }}>{t('ללא עלות', 'Free')}</div>
                  </button>
                </div>
              </div>
            )}

            {/* CTA Form */}
            {!ctaSubmitted && activeCta && (
              <div className="rounded-2xl p-8 fade-in-up" style={GLASS}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold" style={{ color: '#1a1a2e' }}>
                    {activeCta === 'consultation' && t('פגישת ייעוץ — 3,000 ₪', 'Consultation — 3,000 ₪')}
                    {activeCta === 'report' && t('דוח מפורט — 750 ₪', 'Report — 750 ₪')}
                    {activeCta === 'broker' && t('תיווך להשקעה', 'Investment Brokerage')}
                  </h3>
                  <button onClick={() => setActiveCta(null)} className="text-sm cursor-pointer bg-transparent border-0" style={{ color: '#666' }}>{t('← חזרה', '← Back')}</button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-sm font-medium" style={{ color: '#666' }}>{t('שם מלא *', 'Full Name *')}</label><input className="input-field text-right" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} style={{ background: 'rgba(0,0,0,0.05)', color: '#1a1a2e' }} /></div>
                    <div className="space-y-2"><label className="text-sm font-medium" style={{ color: '#666' }}>{t('טלפון *', 'Phone *')}</label><input className="input-field text-right" type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} style={{ background: 'rgba(0,0,0,0.05)', color: '#1a1a2e' }} /></div>
                  </div>
                  <div className="space-y-2"><label className="text-sm font-medium" style={{ color: '#666' }}>{t('אימייל *', 'Email *')}</label><input className="input-field text-right" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} style={{ background: 'rgba(0,0,0,0.05)', color: '#1a1a2e' }} /></div>
                  {activeCta === 'broker' && (
                    <div className="pt-4 mt-4 space-y-4" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><label className="text-sm font-medium" style={{ color: '#666' }}>{t('תקציב (₪) *', 'Budget *')}</label><input className="input-field text-right" type="number" value={investForm.budget} onChange={(e) => setInvestForm({ ...investForm, budget: e.target.value })} style={{ background: 'rgba(0,0,0,0.05)', color: '#1a1a2e' }} /></div>
                        <div className="space-y-2"><label className="text-sm font-medium" style={{ color: '#666' }}>{t('עיר *', 'City *')}</label><input className="input-field text-right" value={investForm.city} onChange={(e) => setInvestForm({ ...investForm, city: e.target.value })} style={{ background: 'rgba(0,0,0,0.05)', color: '#1a1a2e' }} /></div>
                        <div className="space-y-2"><label className="text-sm font-medium" style={{ color: '#666' }}>{t('תקופה (שנים)', 'Period (years)')}</label><input className="input-field text-right" type="number" value={investForm.years} onChange={(e) => setInvestForm({ ...investForm, years: e.target.value })} style={{ background: 'rgba(0,0,0,0.05)', color: '#1a1a2e' }} /></div>
                      </div>
                      <div className="space-y-2"><label className="text-sm font-medium" style={{ color: '#666' }}>{t('מה אתה מחפש?', 'What are you looking for?')}</label><textarea className="input-field text-right" rows={3} value={investForm.freeText} onChange={(e) => setInvestForm({ ...investForm, freeText: e.target.value })} style={{ background: 'rgba(0,0,0,0.05)', color: '#1a1a2e' }} /></div>
                    </div>
                  )}
                  <button onClick={handleCtaSubmit} disabled={ctaSending || !contactForm.name || !contactForm.phone || !contactForm.email || (activeCta === 'broker' && (!investForm.budget || !investForm.city))} className="w-full mt-3 py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 cursor-pointer border-0 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)', color: '#fff' }}>
                    {ctaSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}{t('שלח פרטים', 'Submit')}
                  </button>
                </div>
              </div>
            )}

            {/* CTA Success */}
            {ctaSubmitted && (
              <div className="rounded-2xl p-8 text-center fade-in-up" style={GLASS_GREEN}>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--green)' }} />
                <h3 className="text-2xl font-bold mb-3" style={{ color: '#1a5c2a' }}>{t('הפרטים נשלחו בהצלחה!', 'Details sent successfully!')}</h3>
                <p className="text-base mb-4" style={{ color: '#2d6b3f' }}>
                  {activeCta === 'consultation' && t('ניצור קשר לתיאום פגישה.', "We'll schedule your meeting.")}
                  {activeCta === 'report' && t('הדוח יישלח תוך 7 ימי עבודה.', 'Report within 7 business days.')}
                  {activeCta === 'broker' && t('מתווך ייצור קשר בהקדם.', 'Broker will contact you shortly.')}
                </p>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span><span className="opacity-30 mx-2">|</span><span>{t('אנחנו בודקים. אתם ישנים בשקט.', 'We check. You sleep soundly.')}</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   PLANNING SECTION — with TABA selection list
   ========================================================================== */

function PlanningSection({ planningData, planningLoading, street, city, onSearch, reportedStatus, selectedPlan, onSelectPlan, lang, t }: {
  planningData: PlanningRecord[]; planningLoading: boolean; street: string; city: string;
  onSearch: (q: string) => void; reportedStatus: string; selectedPlan: PlanningRecord | null;
  onSelectPlan: (p: PlanningRecord) => void; lang: string; t: (he: string, en: string) => string;
}) {
  const [customSearch, setCustomSearch] = useState('');
  const keywords = getExpectedStatusKeywords(reportedStatus);
  const hasMatch = planningData.some(p => keywords.some(k => p.status.includes(k)));
  const hasMismatch = planningData.length > 0 && keywords.length > 0 && !hasMatch;

  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#999' }} />
          <input type="text" className="w-full bg-transparent border-none outline-none text-sm text-right" style={{ color: '#1a1a2e' }}
            placeholder={t('חפש לפי שם, עיר או שכונה...', 'Search by name, city...')}
            value={customSearch} onChange={(e) => setCustomSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && customSearch.trim() && onSearch(customSearch.trim())} />
        </div>
        <button onClick={() => customSearch.trim() && onSearch(customSearch.trim())} className="px-4 py-2.5 rounded-lg text-sm font-medium border-0 cursor-pointer" style={{ background: 'var(--accent)', color: '#fff' }}>{t('חפש', 'Search')}</button>
      </div>

      {planningLoading && <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: '#666' }}><Loader2 className="w-5 h-5 animate-spin" />{t('מחפש...', 'Searching...')}</div>}

      {!planningLoading && planningData.length === 0 && (
        <div className="py-8 text-center">
          <XCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#ccc' }} />
          <p className="text-sm font-bold mb-2" style={{ color: '#c0392b' }}>{t('לא נמצאו תוכניות — לא ניתן לאמת סטטוס תכנוני', 'No plans found — cannot verify planning status')}</p>
          <p className="text-sm mb-4" style={{ color: '#888' }}>{t('נסה לחפש לפי שם עיר או שכונה', 'Try searching by city or area')}</p>
          <div className="flex justify-center gap-3">
            <ExtLink href="https://ags.iplan.gov.il/xplan/" label={t('XPLAN קווים כחולים', 'XPLAN Blue Lines')} />
            <ExtLink href="https://mavat.iplan.gov.il/SV3" label={t('מבא״ת', 'Mavat')} />
          </div>
        </div>
      )}

      {!planningLoading && planningData.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--green)' }}><CheckCircle2 className="w-4 h-4" />{t(`נמצאו ${planningData.length} תוכניות. בחר את התוכנית הרלוונטית:`, `Found ${planningData.length} plans. Select the relevant one:`)}</div>

          {hasMatch && <div className="p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)', color: '#1a5c2a' }}><CheckCircle2 className="w-4 h-4" style={{ color: 'var(--green)' }} />{t('אימות מוצלח — הסטטוס תואם', 'Verified — status matches')}</div>}
          {hasMismatch && <div className="p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)', color: '#c0392b' }}><AlertTriangle className="w-4 h-4" />{t('אי-התאמה אפשרית — הסטטוס לא תואם', 'Possible mismatch')}</div>}

          {planningData.slice(0, 5).map((p, i) => {
            const isSelected = selectedPlan?.id === p.id;
            return (
              <button key={p.id || i} onClick={() => onSelectPlan(p)} className="w-full rounded-lg p-4 text-right transition-all cursor-pointer border-0" style={{ background: isSelected ? 'rgba(91,141,238,0.1)' : 'rgba(0,0,0,0.03)', border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div><div className="text-sm font-bold" style={{ color: '#1a1a2e' }}>{p.complexName || p.city}</div><div className="text-xs" style={{ color: '#888' }}>{p.city}{p.planNumber ? ` | ${p.planNumber}` : ''}</div></div>
                  <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--accent)' }}>{p.status}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <MiniStat label={t('קיימות', 'Existing')} value={String(p.existingUnits)} /><MiniStat label={t('חדשות', 'New')} value={String(p.proposedUnits)} />
                  <MiniStat label={t('אישור', 'Approved')} value={p.approvalYear || '\u2014'} /><MiniStat label={t('מסלול', 'Track')} value={p.track || '\u2014'} />
                </div>
                {p.mavatLink && <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}><ExtLink href={p.mavatLink} label={t('מידע תכנוני', 'Planning Info')} /></div>}
              </button>
            );
          })}
          <div className="flex justify-center gap-3 mt-3"><ExtLink href="https://ags.iplan.gov.il/xplan/" label="XPLAN" /><ExtLink href="https://mavat.iplan.gov.il/SV3" label={t('מבא״ת', 'Mavat')} /></div>
        </div>
      )}
    </>
  );
}

/* ==========================================================================
   DEVELOPER SECTION
   ========================================================================== */

function DevSection({ devData, devLoading, devName, onSearch, lang, t }: {
  devData: DeveloperResponse | null; devLoading: boolean; devName: string;
  onSearch: (q: string) => void; lang: string; t: (he: string, en: string) => string;
}) {
  const [cs, setCs] = useState('');
  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#999' }} />
          <input type="text" className="w-full bg-transparent border-none outline-none text-sm text-right" style={{ color: '#1a1a2e' }} placeholder={t('חפש יזם...', 'Search...')} value={cs} onChange={(e) => setCs(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cs.trim() && onSearch(cs.trim())} />
        </div>
        <button onClick={() => cs.trim() && onSearch(cs.trim())} className="px-4 py-2.5 rounded-lg text-sm font-medium border-0 cursor-pointer" style={{ background: 'var(--green)', color: '#fff' }}>{t('חפש', 'Search')}</button>
      </div>
      {devLoading && <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: '#666' }}><Loader2 className="w-5 h-5 animate-spin" />{t('מחפש...', 'Searching...')}</div>}
      {!devLoading && devData && !devData.found && (
        <div className="p-5 rounded-lg" style={{ background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.2)' }}>
          <div className="flex items-start gap-3"><AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color: '#b8860b' }} /><div><div className="text-sm font-bold mb-1" style={{ color: '#8B6914' }}>{t(`"${devName}" לא נמצא בדירוג`, `"${devName}" not found`)}</div><p className="text-sm" style={{ color: '#5d4e37' }}>{t('ייתכן שמדובר בחברה חדשה או חברת בת. מומלץ לבדוק.', 'May be a new or subsidiary company.')}</p></div></div>
        </div>
      )}
      {!devLoading && devData && devData.found && devData.results.map((dev, i) => (
        <div key={i} className="rounded-lg p-5 mb-3" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black" style={{ background: dev.tier === 'A' ? 'rgba(63,185,80,0.15)' : 'rgba(91,141,238,0.15)', color: dev.tier === 'A' ? 'var(--green)' : 'var(--accent)' }}>{dev.tier}</div>
            <div><div className="text-base font-bold" style={{ color: '#1a1a2e' }}>{dev.name}</div><div className="text-xs" style={{ color: '#888' }}>{dev.tierLabel}</div></div>
          </div>
          <p className="text-sm mb-3" style={{ color: '#555' }}>{dev.summary}</p>
          <div className="grid grid-cols-4 gap-3">
            <MiniStat label={t('סה"כ', 'Total')} value={String(dev.totalProjects)} /><MiniStat label={t('בבנייה', 'Building')} value={String(dev.inConstruction)} />
            <MiniStat label={t('נמסרו', 'Delivered')} value={String(dev.delivered)} /><MiniStat label={t('בתכנון', 'Planning')} value={String(dev.inPlanning)} />
          </div>
          <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}><ExtLink href={dev.madadLink} label={t('מדד ההתחדשות', 'Index')} />{dev.website && <ExtLink href={dev.website} label={t('אתר', 'Website')} />}</div>
        </div>
      ))}
    </>
  );
}

/* ==========================================================================
   SHARED COMPONENTS
   ========================================================================== */

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="text-center px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.03)' }}><div className="text-[10px] uppercase tracking-wider" style={{ color: '#999' }}>{label}</div><div className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{value}</div></div>;
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors hover:opacity-80" style={{ background: 'rgba(91,141,238,0.1)', color: 'var(--accent)' }}><ExternalLink className="w-3 h-3" />{label}</a>;
}
