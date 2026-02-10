'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2, ChevronLeft, ClipboardList, ArrowRight,
  Shield, Globe, MapPin, HelpCircle,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

// =============================================
// PLANNING OPTIONS
// =============================================

const planningOptionsPinui = [
  { value: 'initialPlanning', label: 'תכנון ראשוני של תב״ע', labelEn: 'Initial TBA Planning', baseYears: 7 },
  { value: 'thresholdConditions', label: 'קיום תנאי סף', labelEn: 'Threshold Conditions Met', baseYears: 6 },
  { value: 'depositPublication', label: 'פרסום להפקדה', labelEn: 'Published for Deposit', baseYears: 5 },
  { value: 'tabaApproved', label: 'תב״ע מאושרת', labelEn: 'TBA Approved', baseYears: 4 },
  { value: 'designApproved', label: 'תוכנית עיצוב מאושרת', labelEn: 'Design Plan Approved', baseYears: 3 },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 7 },
];

const permitStageOptions = [
  { value: 'none', label: 'טרם הוגשה בקשה להיתר', labelEn: 'Not yet filed for permit', baseYears: 0 },
  { value: 'permitFiled', label: 'בקשה הוגשה', labelEn: 'Permit Filed', baseYears: 2.5 },
  { value: 'permitAccepted', label: 'בקשה נקלטה', labelEn: 'Application Accepted', baseYears: 2 },
  { value: 'selfLicensing', label: 'רישוי עצמי (אדריכל מורשה להיתר)', labelEn: 'Self-Licensing (Authorized Architect)', baseYears: 1.5 },
  { value: 'permitConditions', label: 'היתר בתנאים', labelEn: 'Conditional Permit', baseYears: 1.5 },
  { value: 'fullPermit', label: 'היתר מלא', labelEn: 'Full Permit', baseYears: 0.5 },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 0 },
];

const planningOptionsTama = [
  { value: 'permitFiled', label: 'בקשה הוגשה', labelEn: 'Permit Filed', baseYears: 2.5 },
  { value: 'permitAccepted', label: 'בקשה נקלטה', labelEn: 'Application Accepted', baseYears: 2 },
  { value: 'selfLicensing', label: 'רישוי עצמי (אדריכל מורשה להיתר)', labelEn: 'Self-Licensing (Authorized Architect)', baseYears: 1.5 },
  { value: 'permitConditions', label: 'היתר בתנאים', labelEn: 'Conditional Permit', baseYears: 1.5 },
  { value: 'fullPermit', label: 'היתר מלא', labelEn: 'Full Permit', baseYears: 0.5 },
  { value: 'unknown', label: 'לא יודע/ת', labelEn: "I don't know", baseYears: 2.5 },
];

function getPlanningOptions(projectType: string) {
  return projectType === 'tama' ? planningOptionsTama : planningOptionsPinui;
}

// Show permit stages for pinui-binui when TBA is approved or design approved
function showPermitStages(projectType: string, planningStatus: string) {
  return projectType === 'pinui' && (planningStatus === 'tabaApproved' || planningStatus === 'designApproved');
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
// Main Component — Form Only
// =============================================

function CheckupContent() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') ?? '';
  const router = useRouter();
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const [form, setForm] = useState({
    street: initialAddress,
    city: '',
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
    permitStage: 'none',
    objection: 'none',
    toldYears: '',
  });

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'projectType') {
        const opts = getPlanningOptions(value);
        if (!opts.find(o => o.value === prev.planningStatus)) {
          next.planningStatus = opts[0].value;
        }
        // Reset permit stage if switching project type
        if (value === 'tama') {
          next.permitStage = 'none';
        }
      }
      // Reset permit stage when planning status changes and it's no longer relevant
      if (field === 'planningStatus' && !showPermitStages(prev.projectType, value)) {
        next.permitStage = 'none';
      }
      return next;
    });
  }, []);

  const handleGenerate = () => {
    // Save form data to sessionStorage for the report page
    sessionStorage.setItem('rc-form', JSON.stringify(form));
    router.push('/checkup/report');
  };

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
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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
            <a href="/about" className="text-xs text-foreground-muted hover:text-foreground transition-colors">{t('אודות', 'About')}</a>
            <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10 flex-1 w-full">

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2">THE REALITY CHECK</div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t('הזן את נתוני הפרויקט', 'Enter Project Data')}
          </h1>
          <p className="text-sm text-foreground-muted max-w-lg mx-auto">
            {t('מלא את כל הנתונים שברשותך. לא בטוח לגבי שדה מסוים? בחר ״לא יודע/ת״ — גם זה מידע חשוב.', 'Fill in all the data you have. Not sure about a field? Select "I don\'t know" — that\'s valuable info too.')}
          </p>
        </div>

        <div className="db-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-foreground">{t('נתוני הפרויקט', 'Project Data')}</h2>
          </div>

          <div className="space-y-5">
            {/* Project Type */}
            <SelectField label={t('סוג פרויקט', 'Project Type')} value={form.projectType} onChange={(v) => updateField('projectType', v)} options={[
              { value: 'pinui', label: t('פינוי-בינוי', 'Pinui-Binui') },
              { value: 'tama', label: t('תמ״א 38/2 (הריסה ובנייה)', 'TAMA 38/2 (Demolition & Build)') },
            ]} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('שם היזם / מוכר / מתווך', 'Developer / Seller / Broker')} value={form.developerName} onChange={(v) => updateField('developerName', v)} placeholder={t('לדוגמה: אזורים', 'e.g. Azorim')} />
              <Field label={t('שם הפרויקט', 'Project Name')} value={form.projectName} onChange={(v) => updateField('projectName', v)} placeholder={t('לדוגמה: פארק TLV', 'e.g. Park TLV')} />
            </div>

            {/* Address — split into street + city */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('רחוב ומספר', 'Street & Number')} value={form.street} onChange={(v) => updateField('street', v)} placeholder={t('לדוגמה: יפת 5', 'e.g. Yefet 5')} icon={<MapPin className="w-3.5 h-3.5" />} />
              <Field label={t('עיר', 'City')} value={form.city} onChange={(v) => updateField('city', v)} placeholder={t('לדוגמה: תל אביב-יפו', 'e.g. Tel Aviv')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('מחיר מבוקש (₪)', 'Asking Price (₪)')} value={form.price} onChange={(v) => updateField('price', v)} type="number" placeholder="2,500,000" />
              <Field label={t('שכר דירה נוכחי (₪)', 'Current Rent (₪)')} value={form.rent} onChange={(v) => updateField('rent', v)} type="number" placeholder="5,500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('גודל דירה קיים (מ"ר)', 'Current Size (sqm)')} value={form.apartmentSize} onChange={(v) => updateField('apartmentSize', v)} type="number" placeholder="75" />
              <Field label={t('תוספת מ"ר מובטחת', 'Promised Sqm Addition')} value={form.sqmAddition} onChange={(v) => updateField('sqmAddition', v)} type="number" placeholder="12" />
            </div>

            <SelectField label={t('מספר דיירים בפרויקט', 'Number of Tenants')} value={form.tenantCount} onChange={(v) => updateField('tenantCount', v)} options={[
              { value: 'under100', label: t('עד 100', 'Up to 100') },
              { value: 'over100', label: t('מעל 100', 'Over 100') },
              { value: 'unknown', label: t('לא יודע/ת', "I don't know") },
            ]} />

            {/* Planning Status */}
            <SelectField
              label={form.projectType === 'tama' ? t('שלב רישוי (תמ"א 38)', 'Permit Stage (TAMA 38)') : t('שלב תכנוני (תב"ע)', 'Planning Stage (TBA)')}
              value={form.planningStatus}
              onChange={(v) => updateField('planningStatus', v)}
              options={getPlanningOptions(form.projectType).map((o) => ({ value: o.value, label: lang === 'he' ? o.label : o.labelEn }))}
              helpText={form.planningStatus === 'unknown' ? t('נתון קריטי — מומלץ לברר מול היזם או הרשות המקומית', 'Critical info — check with developer or local authority') : undefined}
            />

            {/* Permit Stage — only for Pinui-Binui when TBA approved */}
            {showPermitStages(form.projectType, form.planningStatus) && (
              <div className="fade-in-up">
                <SelectField
                  label={t('שלב רישוי להיתר בנייה', 'Building Permit Stage')}
                  value={form.permitStage}
                  onChange={(v) => updateField('permitStage', v)}
                  options={permitStageOptions.map((o) => ({ value: o.value, label: lang === 'he' ? o.label : o.labelEn }))}
                  helpText={t('תב"ע אושרה — כעת ניתן לעקוב אחר שלב הרישוי להיתר', 'TBA approved — now track the building permit stage')}
                />
              </div>
            )}

            {/* Objection / Appeal */}
            <SelectField label={t('התנגדות / ערר', 'Objection / Appeal')} value={form.objection} onChange={(v) => updateField('objection', v)} options={[
              { value: 'none', label: t('לא הוגשה התנגדות', 'No objection filed') },
              { value: 'objection', label: t('הוגשה התנגדות', 'Objection filed') },
              { value: 'appeal', label: t('הוגש ערר', 'Appeal filed') },
              { value: 'both', label: t('התנגדות + ערר', 'Objection + Appeal') },
              { value: 'unknown', label: t('לא יודע/ת', "I don't know") },
            ]} />

            <SelectField label={t('סטטוס חתימות דיירים', 'Tenant Signature Status')} value={form.signatureStatus} onChange={(v) => updateField('signatureStatus', v)} options={[
              { value: 'noMajority', label: t('אין רוב חוקי (פחות מ-67%)', 'No legal majority (<67%)') },
              { value: 'majority', label: t('יש רוב חוקי (67%+)', 'Legal majority (67%+)') },
              { value: 'full', label: t('100% חתימות מלאות', '100% full signatures') },
              { value: 'unknown', label: t('לא יודע/ת', "I don't know") },
            ]} />

            {/* "What you were told" */}
            <Field
              label={t('מה נאמר לך? כמה שנים עד הריסה', 'What were you told? Years to demolition')}
              value={form.toldYears}
              onChange={(v) => updateField('toldYears', v)}
              type="number"
              placeholder={t('לדוגמה: 3', 'e.g. 3')}
              suffix={t('שנים', 'years')}
              helpText={t('הזן את מה שנאמר לך ע"י היזם, המתווך או המוכר. השאר ריק אם לא נאמר.', 'Enter what the developer, broker, or seller told you. Leave empty if not told.')}
            />

            <button
              onClick={handleGenerate}
              className="w-full mt-4 py-4 rounded-lg font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 100%)',
                color: '#fff',
                boxShadow: '0 0 24px var(--accent-glow)',
              }}
            >
              <Shield className="w-5 h-5" />
              {t('הפק דוח Reality Check', 'Generate Reality Check')}
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
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
// Sub-Components
// =========================================

function Field({ label, value, onChange, placeholder, type = 'text', suffix, icon, helpText }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: string; icon?: React.ReactNode; helpText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input type={type} placeholder={placeholder} className="input-field text-right text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
        {suffix && <span className="absolute left-3 top-2.5 text-xs text-foreground-muted">{suffix}</span>}
      </div>
      {helpText && <p className="text-[11px] text-foreground-muted opacity-70">{helpText}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, helpText }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; helpText?: string;
}) {
  const isUnknown = value === 'unknown';
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground-muted">{label}</label>
      <select className="input-field text-right text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {isUnknown && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg text-[11px]" style={{ background: 'rgba(210, 153, 34, 0.08)', border: '1px solid rgba(210, 153, 34, 0.2)' }}>
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold-light)' }} />
          <span style={{ color: 'var(--gold-light)' }}>
            {helpText || 'נתון קריטי להבנת הכדאיות הכלכלית של העסקה — כדאי לבדוק או להתייעץ'}
          </span>
        </div>
      )}
      {helpText && !isUnknown && <p className="text-[11px] text-foreground-muted opacity-70">{helpText}</p>}
    </div>
  );
}
