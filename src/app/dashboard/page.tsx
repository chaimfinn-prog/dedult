'use client';

import { useState, useRef, Suspense } from 'react';
import { useLang } from '@/lib/i18n';

type FormStep = 'details' | 'problem' | 'documents' | 'submitted';

function TenantIntakeForm() {
  const { lang, toggle } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  const [step, setStep] = useState<FormStep>('details');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    projectAddress: '',
    city: '',
    neighborhood: '',
    developerName: '',
    unitsInBuilding: '',
    yearBuilt: '',
    hasElevator: false,
    hasShelter: false,
    problemDescription: '',
    projectStage: '',
    howLongWaiting: '',
    files: [] as File[],
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    set('files', [...form.files, ...Array.from(newFiles)]);
  };

  const removeFile = (idx: number) => {
    set('files', form.files.filter((_, i) => i !== idx));
  };

  const canProceedToStep2 = form.name && form.phone && form.projectAddress && form.city;
  const canProceedToStep3 = form.problemDescription;

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/pinui-binui/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.projectAddress}, ${form.city}`,
          city: form.city,
          neighborhood: form.neighborhood || undefined,
          address: form.projectAddress,
          contactName: form.name,
          contactPhone: form.phone,
          contactEmail: form.email || undefined,
          source: 'tenant-intake',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(data.error || 'Failed');
      }

      const { project } = await res.json();

      if (project && form.files.length > 0) {
        for (const file of form.files) {
          const fd = new FormData();
          fd.append('projectId', project.id);
          fd.append('file', file);
          await fetch('/api/pinui-binui/upload', { method: 'POST', body: fd }).catch(() => {});
        }
      }

      if (project) {
        await fetch('/api/pinui-binui/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: project.id,
            note: `דייר: ${form.name} | יזם: ${form.developerName || 'לא צוין'} | בעיה: ${form.problemDescription} | שלב: ${form.projectStage || 'לא צוין'} | זמן המתנה: ${form.howLongWaiting || 'לא צוין'} | דירות בבניין: ${form.unitsInBuilding || '?'} | שנת בניה: ${form.yearBuilt || '?'}`,
            extractedInfo: {
              existingUnits: form.unitsInBuilding ? parseInt(form.unitsInBuilding) : undefined,
              currentDeveloper: form.developerName || undefined,
            },
          }),
        }).catch(() => {});
      }

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pinui-binui-intake',
          formData: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            address: `${form.projectAddress}, ${form.city}`,
            developer: form.developerName,
            problem: form.problemDescription,
            stage: form.projectStage,
            waiting: form.howLongWaiting,
            units: form.unitsInBuilding,
            files: form.files.length,
          },
          contactInfo: {
            name: form.name,
            phone: form.phone,
            email: form.email,
          },
        }),
      }).catch(() => {});

      setStep('submitted');
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      {/* Header */}
      <header className="bg-[#0a0e1a] border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">P</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t('PROPCHECK', 'PROPCHECK')}</h1>
              <p className="text-[11px] text-gray-500">{t('בדיקת פרויקט פינוי-בינוי', 'Pinui-Binui Project Check')}</p>
            </div>
          </div>
          <button onClick={toggle} className="text-xs text-gray-500 hover:text-white border border-gray-700 rounded px-2 py-1">
            {isHe ? 'EN' : 'עב'}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Progress */}
        {step !== 'submitted' && (
          <div className="flex items-center gap-2 mb-6">
            {(['details', 'problem', 'documents'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-blue-600 text-white' :
                  (['details', 'problem', 'documents'].indexOf(step) > i) ? 'bg-emerald-600 text-white' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {(['details', 'problem', 'documents'].indexOf(step) > i) ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${
                  (['details', 'problem', 'documents'].indexOf(step) > i) ? 'bg-emerald-600' : 'bg-gray-800'
                }`} />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800/40 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
            <button onClick={() => setError(null)} className="float-end text-red-400">✕</button>
          </div>
        )}

        {/* ── Step 1: Contact & Project Details ── */}
        {step === 'details' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{t('ספרו לנו על הפרויקט שלכם', 'Tell Us About Your Project')}</h2>
              <p className="text-sm text-gray-400 mt-1">{t('נבדוק את הפרויקט ונחזור אליכם', 'We\'ll review your project and get back to you')}</p>
            </div>

            <Section title={t('פרטים אישיים', 'Your Details')}>
              <Input label={t('שם מלא', 'Full Name')} value={form.name} onChange={v => set('name', v)} required />
              <Input label={t('טלפון', 'Phone')} value={form.phone} onChange={v => set('phone', v)} type="tel" required />
              <Input label={t('אימייל', 'Email')} value={form.email} onChange={v => set('email', v)} type="email" />
            </Section>

            <Section title={t('פרטי הפרויקט', 'Project Details')}>
              <Input label={t('כתובת הבניין / מתחם', 'Building / Complex Address')} value={form.projectAddress} onChange={v => set('projectAddress', v)} required placeholder={t('למשל: הרצל 10-14', 'e.g. Herzl 10-14')} />
              <Input label={t('עיר', 'City')} value={form.city} onChange={v => set('city', v)} required />
              <Input label={t('שכונה', 'Neighborhood')} value={form.neighborhood} onChange={v => set('neighborhood', v)} />
              <Input label={t('שם היזם / חברה', 'Developer / Company Name')} value={form.developerName} onChange={v => set('developerName', v)} placeholder={t('שם החברה שחתמתם איתה', 'Company you signed with')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('דירות בבניין (בערך)', 'Units in Building (approx)')} value={form.unitsInBuilding} onChange={v => set('unitsInBuilding', v)} type="number" />
                <Input label={t('שנת בניה (בערך)', 'Year Built (approx)')} value={form.yearBuilt} onChange={v => set('yearBuilt', v)} type="number" />
              </div>
              <div className="flex flex-wrap gap-4 mt-1">
                <Toggle label={t('יש מעלית', 'Has Elevator')} checked={form.hasElevator} onChange={v => set('hasElevator', v)} />
                <Toggle label={t('יש ממ"ד', 'Has Shelter')} checked={form.hasShelter} onChange={v => set('hasShelter', v)} />
              </div>
            </Section>

            <NavButtons
              onNext={() => setStep('problem')}
              nextDisabled={!canProceedToStep2}
              nextLabel={t('המשך', 'Continue')}
              isHe={isHe}
            />
          </div>
        )}

        {/* ── Step 2: The Problem ── */}
        {step === 'problem' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{t('מה המצב בפרויקט?', 'What\'s the Situation?')}</h2>
              <p className="text-sm text-gray-400 mt-1">{t('ספרו לנו מה קורה ואנחנו נבדוק', 'Tell us what\'s happening and we\'ll check')}</p>
            </div>

            <Section title={t('תיאור הבעיה', 'Problem Description')}>
              <label className="block">
                <span className="text-[11px] text-gray-500 mb-1 block">{t('מה הבעיה העיקרית? *', 'Main Issue? *')}</span>
                <textarea
                  value={form.problemDescription}
                  onChange={e => set('problemDescription', e.target.value)}
                  rows={4}
                  placeholder={t(
                    'למשל: היזם לא מתקדם כבר 3 שנים, אין תקשורת, לא עומד בלוחות זמנים...',
                    'e.g. Developer hasn\'t progressed in 3 years, no communication...'
                  )}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/60 focus:outline-none resize-none"
                />
              </label>
            </Section>

            <Section title={t('שלב הפרויקט', 'Project Stage')}>
              <Select
                label={t('באיזה שלב הפרויקט?', 'What stage is the project?')}
                value={form.projectStage}
                onChange={v => set('projectStage', v)}
                options={[
                  { v: '', l: t('-- בחרו --', '-- Select --') },
                  { v: 'signed', l: t('חתמנו חוזה אבל שום דבר לא זז', 'Signed contract but nothing moves') },
                  { v: 'plan_stuck', l: t('תב"ע הוגשה אבל תקועה', 'Plan submitted but stuck') },
                  { v: 'plan_approved', l: t('תב"ע אושרה, ממתינים להיתר', 'Plan approved, waiting for permit') },
                  { v: 'permit_stuck', l: t('יש היתר אבל לא מתחילים לבנות', 'Have permit but not starting') },
                  { v: 'construction_stopped', l: t('בניה נעצרה באמצע', 'Construction stopped midway') },
                  { v: 'dont_know', l: t('לא יודע/ת', 'Don\'t know') },
                ]}
              />
              <Input
                label={t('כמה זמן אתם ממתינים?', 'How long have you been waiting?')}
                value={form.howLongWaiting}
                onChange={v => set('howLongWaiting', v)}
                placeholder={t('למשל: 5 שנים', 'e.g. 5 years')}
              />
            </Section>

            <NavButtons
              onBack={() => setStep('details')}
              onNext={() => setStep('documents')}
              nextDisabled={!canProceedToStep3}
              nextLabel={t('המשך', 'Continue')}
              backLabel={t('חזרה', 'Back')}
              isHe={isHe}
            />
          </div>
        )}

        {/* ── Step 3: Documents & Submit ── */}
        {step === 'documents' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{t('מסמכים', 'Documents')}</h2>
              <p className="text-sm text-gray-400 mt-1">{t('העלו מסמכים שיש לכם — חוזה, היתר, פרוטוקולים', 'Upload any documents — contracts, permits, protocols')}</p>
            </div>

            <Section title={t('העלאת מסמכים (לא חובה)', 'Upload Documents (optional)')}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                onChange={e => { addFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500/50 rounded-xl py-8 text-center transition group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition">+</div>
                <div className="text-sm text-gray-400">{t('לחצו להעלאת קבצים', 'Click to upload files')}</div>
                <div className="text-[11px] text-gray-600 mt-1">PDF, DOC, JPG, PNG</div>
              </button>

              {form.files.length > 0 && (
                <div className="space-y-2 mt-3">
                  {form.files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-700/30">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{f.name}</div>
                        <div className="text-[10px] text-gray-500">{(f.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Summary */}
            <Section title={t('סיכום', 'Summary')}>
              <SummaryRow label={t('שם', 'Name')} value={form.name} />
              <SummaryRow label={t('טלפון', 'Phone')} value={form.phone} />
              <SummaryRow label={t('כתובת', 'Address')} value={`${form.projectAddress}, ${form.city}`} />
              {form.developerName && <SummaryRow label={t('יזם', 'Developer')} value={form.developerName} />}
              <SummaryRow label={t('בעיה', 'Issue')} value={form.problemDescription.slice(0, 80) + (form.problemDescription.length > 80 ? '...' : '')} />
              <SummaryRow label={t('מסמכים', 'Documents')} value={`${form.files.length} ${t('קבצים', 'files')}`} />
            </Section>

            <NavButtons
              onBack={() => setStep('problem')}
              onNext={submit}
              nextDisabled={submitting}
              nextLabel={submitting ? t('שולח...', 'Submitting...') : t('שלח לבדיקה', 'Submit for Review')}
              backLabel={t('חזרה', 'Back')}
              isHe={isHe}
              nextAccent
            />
          </div>
        )}

        {/* ── Submitted ── */}
        {step === 'submitted' && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">✓</div>
            <h2 className="text-2xl font-bold text-emerald-400">{t('הפרטים נשלחו בהצלחה', 'Successfully Submitted')}</h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              {t(
                'קיבלנו את הפרטים שלכם ונבדוק את הפרויקט. ניצור אתכם קשר בהקדם.',
                'We received your details and will review the project. We\'ll contact you soon.'
              )}
            </p>
            <button
              onClick={() => { setForm({ name: '', phone: '', email: '', projectAddress: '', city: '', neighborhood: '', developerName: '', unitsInBuilding: '', yearBuilt: '', hasElevator: false, hasShelter: false, problemDescription: '', projectStage: '', howLongWaiting: '', files: [] }); setStep('details'); }}
              className="mt-6 text-sm text-blue-400 hover:text-blue-300"
            >
              {t('שליחת פרויקט נוסף', 'Submit Another Project')}
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800/40 py-4 text-center text-[11px] text-gray-600">
        PROPCHECK
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-gray-500 text-sm">Loading...</div>}>
      <TenantIntakeForm />
    </Suspense>
  );
}

/* ═══ Components ═══ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500 mb-1 block">{label}{required && <span className="text-red-400"> *</span>}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/60 focus:outline-none transition" />
    </label>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500 mb-1 block">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500/60 focus:outline-none transition">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <div className={`w-9 h-5 rounded-full relative transition ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'start-[calc(100%-1.125rem)]' : 'start-0.5'}`} />
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 text-end">{value}</span>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel, backLabel, isHe, nextAccent }: {
  onBack?: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel: string; backLabel?: string; isHe: boolean; nextAccent?: boolean;
}) {
  return (
    <div className="flex justify-between pt-2 pb-8">
      {onBack ? (
        <button onClick={onBack} className="px-5 py-2.5 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition">
          {backLabel}
        </button>
      ) : <div />}
      <button onClick={onNext} disabled={nextDisabled}
        className={`px-8 py-2.5 text-sm rounded-xl font-medium transition shadow-lg ${
          nextAccent
            ? 'bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 shadow-emerald-900/30'
            : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-900/30'
        } disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed`}
      >
        {nextLabel}
      </button>
    </div>
  );
}
