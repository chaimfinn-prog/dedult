'use client';

import { useState, useRef, Suspense } from 'react';
import { useLang } from '@/lib/i18n';

function TenantIntakeForm() {
  const { lang, toggle } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    developerName: '',
    problemDescription: '',
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

  const canSubmit = form.name && form.phone && form.address && form.city;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      // Save project
      const res = await fetch('/api/pinui-binui/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.address}, ${form.city}`,
          city: form.city,
          address: form.address,
          contactName: form.name,
          contactPhone: form.phone,
          source: 'tenant-intake',
        }),
      });

      const { project } = await res.json().catch(() => ({ project: null }));

      // Upload documents
      if (project?.id && form.files.length > 0) {
        for (const file of form.files) {
          const fd = new FormData();
          fd.append('projectId', project.id);
          fd.append('file', file);
          await fetch('/api/pinui-binui/upload', { method: 'POST', body: fd }).catch(() => {});
        }
      }

      // Save note with problem details
      if (project?.id) {
        await fetch('/api/pinui-binui/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: project.id,
            note: `נציג: ${form.name} | יזם: ${form.developerName || 'לא צוין'} | ${form.problemDescription}`,
            extractedInfo: {
              currentDeveloper: form.developerName || undefined,
            },
          }),
        }).catch(() => {});
      }

      // Send email notification
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pinui-binui-intake',
          formData: {
            name: form.name,
            phone: form.phone,
            address: `${form.address}, ${form.city}`,
            developer: form.developerName,
            problem: form.problemDescription,
            files: form.files.length,
          },
          contactInfo: { name: form.name, phone: form.phone, email: '' },
        }),
      }).catch(() => {});

      setSubmitted(true);
    } catch (err) {
      setError(t('שגיאה בשליחה, נסו שוב', 'Submission error, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Shell t={t} toggle={toggle} isHe={isHe}>
        <div className="text-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl text-emerald-400">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-emerald-400">{t('קיבלנו!', 'Received!')}</h2>
          <p className="text-gray-400 mt-3 max-w-xs mx-auto leading-relaxed">
            {t(
              'הפרטים התקבלו אצלנו. נבדוק את הפרויקט וניצור קשר בהקדם.',
              'We got your details. We\'ll review the project and contact you soon.'
            )}
          </p>
          <button
            onClick={() => { setForm({ name: '', phone: '', address: '', city: '', developerName: '', problemDescription: '', files: [] }); setSubmitted(false); }}
            className="mt-8 text-sm text-blue-400 hover:text-blue-300"
          >
            {t('שליחת פנייה נוספת', 'Submit Another')}
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell t={t} toggle={toggle} isHe={isHe}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="text-center pb-2">
          <h2 className="text-xl font-bold">{t('הפרויקט שלכם תקוע?', 'Is Your Project Stuck?')}</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            {t(
              'השאירו פרטים ומסמכים — אנחנו נבדוק את המצב ונחזור אליכם עם תשובות.',
              'Leave your details and documents — we\'ll check the situation and get back to you.'
            )}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/40 text-red-300 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Contact */}
        <Card title={t('פרטי קשר', 'Contact')}>
          <Input label={t('שם', 'Name')} value={form.name} onChange={v => set('name', v)} required placeholder={t('השם שלכם', 'Your name')} />
          <Input label={t('טלפון', 'Phone')} value={form.phone} onChange={v => set('phone', v)} required type="tel" placeholder="05X-XXXXXXX" />
        </Card>

        {/* Project */}
        <Card title={t('הפרויקט', 'The Project')}>
          <Input label={t('כתובת הבניין', 'Building Address')} value={form.address} onChange={v => set('address', v)} required placeholder={t('הרצל 10', 'Herzl 10')} />
          <Input label={t('עיר', 'City')} value={form.city} onChange={v => set('city', v)} required placeholder={t('בת ים', 'Bat Yam')} />
          <Input label={t('שם היזם (אם ידוע)', 'Developer Name (if known)')} value={form.developerName} onChange={v => set('developerName', v)} placeholder={t('שם החברה', 'Company name')} />
        </Card>

        {/* Problem */}
        <Card title={t('מה קורה?', 'What\'s Going On?')}>
          <label className="block">
            <span className="text-[11px] text-gray-500 mb-1 block">{t('ספרו לנו בקצרה', 'Tell us briefly')}</span>
            <textarea
              value={form.problemDescription}
              onChange={e => set('problemDescription', e.target.value)}
              rows={3}
              placeholder={t(
                'למשל: חתמנו לפני 4 שנים ולא זז כלום. היזם לא עונה לטלפונים...',
                'e.g. We signed 4 years ago and nothing moved. Developer doesn\'t answer...'
              )}
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/60 focus:outline-none resize-none"
            />
          </label>
        </Card>

        {/* Documents */}
        <Card title={t('מסמכים (לא חובה)', 'Documents (optional)')}>
          <p className="text-xs text-gray-500 -mt-1 mb-2">
            {t('חוזה, פרוטוקולים, מכתבים מהיזם — כל דבר שיש לכם', 'Contracts, protocols, letters from developer — anything you have')}
          </p>
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
            className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500/50 rounded-xl py-6 text-center transition"
          >
            <div className="text-2xl text-gray-500 mb-1">+</div>
            <div className="text-sm text-gray-400">{t('לחצו להעלאת קבצים', 'Tap to upload files')}</div>
          </button>

          {form.files.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {form.files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-700/30">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 text-xs px-2 shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submit */}
        <div className="pt-2 pb-10">
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="w-full py-3.5 rounded-xl text-base font-semibold transition-all
              bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400
              disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
              shadow-lg shadow-blue-900/30 hover:shadow-blue-800/40"
          >
            {submitting ? t('שולח...', 'Sending...') : t('שלחו לבדיקה', 'Send for Review')}
          </button>
          <p className="text-center text-[11px] text-gray-600 mt-2">
            {t('הפרטים מאובטחים ולא יועברו לגורם שלישי', 'Your details are secure and private')}
          </p>
        </div>
      </div>
    </Shell>
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

function Shell({ children, t, toggle, isHe }: { children: React.ReactNode; t: (he: string, en: string) => string; toggle: () => void; isHe: boolean }) {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <header className="bg-[#0a0e1a] border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">P</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">PROPCHECK</h1>
              <p className="text-[11px] text-gray-500">{t('בדיקת פרויקט פינוי-בינוי', 'Pinui-Binui Project Check')}</p>
            </div>
          </div>
          <button onClick={toggle} className="text-xs text-gray-500 hover:text-white border border-gray-700 rounded px-2 py-1">
            {isHe ? 'EN' : 'עב'}
          </button>
        </div>
      </header>
      {children}
      <footer className="border-t border-gray-800/40 py-4 text-center text-[11px] text-gray-600">PROPCHECK</footer>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
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
