'use client';

import { useState, useCallback } from 'react';
import {
  Building2, Globe, ChevronLeft, Search, Loader2,
  AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus,
  ExternalLink, Info,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import PropertySearchBar, { type SearchParams } from '@/components/shared/PropertySearchBar';
import { calcPurchaseTax, calcAcquisitionCosts, calcYield, type PurchaseTaxResult, type AcquisitionCostResult, type YieldResult } from '@/lib/tax-calculations';
import { calcBettermentLevy } from '@/lib/betterment-levy';
import type { ComputeResult } from '@/lib/compute-result';

// ── Types ──

interface PropertyAddress {
  city: string;
  street?: string;
  gush?: string;
  helka?: string;
  lat?: number;
  lon?: number;
}

interface ApartmentDetails {
  sqm: number;
  rooms: number;
  floor: number;
  condition: 'preserved' | 'old' | 'renovated';
  hasParking: boolean;
  hasStorage: boolean;
  hasElevator: boolean;
  askingPrice: number;
  monthlyRent: number;
  isSingleApartment: boolean | null;
  mortgageAmount: number;
}

interface RenewalDetails {
  buildingYear: number;
  totalUnits: number;
  entrances: number;
  hasParking: boolean;
  plotAreaSqm: number;
  renewalStatus: 'no_developer' | 'developer_signed' | 'planning_underway' | 'plan_approved';
  signedTenantsPct: number;
  developerName: string;
  planNumber: string;
}

type Step = 'address' | 'renewal_choice' | 'details' | 'results';

// ── Formatters ──

const fmt = (n: number) => n.toLocaleString('he-IL');
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

export default function ApartmentPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  // ── State ──
  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState<PropertyAddress | null>(null);
  const [hasRenewalPotential, setHasRenewalPotential] = useState<boolean | null>(null);
  const [apartmentDetails, setApartmentDetails] = useState<ApartmentDetails>({
    sqm: 0, rooms: 0, floor: 0, condition: 'old',
    hasParking: false, hasStorage: false, hasElevator: false,
    askingPrice: 0, monthlyRent: 0, isSingleApartment: null, mortgageAmount: 0,
  });
  const [renewalDetails, setRenewalDetails] = useState<RenewalDetails>({
    buildingYear: 0, totalUnits: 0, entrances: 1, hasParking: false,
    plotAreaSqm: 0, renewalStatus: 'no_developer', signedTenantsPct: 0,
    developerName: '', planNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [taxResult, setTaxResult] = useState<PurchaseTaxResult | null>(null);
  const [costsResult, setCostsResult] = useState<ComputeResult<AcquisitionCostResult> | null>(null);
  const [yieldResult, setYieldResult] = useState<ComputeResult<YieldResult> | null>(null);
  const [priceData, setPriceData] = useState<Record<string, unknown> | null>(null);
  const [singleApartmentError, setSingleApartmentError] = useState(false);

  // ── Step 1: Address resolution ──
  const handleAddressSearch = useCallback(async (params: SearchParams) => {
    if (!params.city && !params.gush) return;
    setAddress({
      city: params.city || '',
      street: params.street,
      gush: params.gush,
      helka: params.helka,
      lat: params.lat,
      lon: params.lon,
    });
    setStep('renewal_choice');
  }, []);

  // ── Step 2: Renewal choice ──
  const handleRenewalChoice = (hasRenewal: boolean) => {
    setHasRenewalPotential(hasRenewal);
    setStep('details');
  };

  // ── Step 3/4: Compute results ──
  const computeResults = useCallback(async () => {
    if (apartmentDetails.isSingleApartment === null) {
      setSingleApartmentError(true);
      return;
    }
    setSingleApartmentError(false);

    if (apartmentDetails.sqm <= 0 || apartmentDetails.rooms <= 0) return;

    setLoading(true);

    try {
      // Tax calculation
      if (apartmentDetails.askingPrice > 0) {
        const tax = calcPurchaseTax(apartmentDetails.askingPrice, apartmentDetails.isSingleApartment);
        setTaxResult(tax);
        const costs = calcAcquisitionCosts(apartmentDetails.askingPrice, apartmentDetails.isSingleApartment);
        setCostsResult(costs);
      }

      // Yield calculation
      if (apartmentDetails.monthlyRent > 0 && apartmentDetails.askingPrice > 0) {
        const yld = calcYield({
          purchasePrice: apartmentDetails.askingPrice,
          monthlyRent: apartmentDetails.monthlyRent,
          mortgageAmount: apartmentDetails.mortgageAmount || 0,
        });
        setYieldResult(yld);
      }

      // Fetch price data for city
      if (address?.city) {
        try {
          const res = await fetch('/api/price-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: address.city }),
          });
          if (res.ok) {
            const data = await res.json();
            setPriceData(data);
          }
        } catch { /* price data is optional */ }
      }

      setStep('results');
    } finally {
      setLoading(false);
    }
  }, [apartmentDetails, address]);

  // ── Render ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      {/* Header */}
      <div className="border-b border-[var(--border)] sticky top-0 z-20" style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 no-underline text-inherit">
              <Building2 className="w-4 h-4 text-green" />
              <span className="font-bold text-sm">PROPCHECK</span>
            </a>
            <span className="text-foreground-muted text-xs">{t('| רכישת דירה', '| Apartment Purchase')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/private" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}
              <ChevronLeft className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="border-b border-[var(--border)] px-6 py-2" style={{ background: 'rgba(13,17,23,0.85)' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4 text-xs">
          {(['address', 'renewal_choice', 'details', 'results'] as Step[]).map((s, i) => {
            const labels = [
              t('כתובת', 'Address'),
              t('פוטנציאל', 'Potential'),
              t('פרטים', 'Details'),
              t('תוצאות', 'Results'),
            ];
            const active = s === step;
            const done = ['address', 'renewal_choice', 'details', 'results'].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
                  background: done ? 'var(--green)' : active ? '#5b8dee' : 'rgba(255,255,255,0.1)',
                  color: done || active ? '#fff' : 'var(--fg-dim)',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ color: active ? '#fff' : 'var(--fg-dim)' }}>{labels[i]}</span>
                {i < 3 && <span className="text-foreground-muted mx-1">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">

          {/* ══ STEP 1: Address Search ══ */}
          {step === 'address' && (
            <div className="max-w-xl mx-auto">
              <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
                {t('שלב 1: חיפוש כתובת', 'Step 1: Address Search')}
              </h1>
              <p className="text-foreground-muted text-sm mb-8 text-center">
                {t('הכניסו כתובת, גוש/חלקה או שם רחוב', 'Enter address, gush/helka or street name')}
              </p>
              <PropertySearchBar onSearch={handleAddressSearch} />
            </div>
          )}

          {/* ══ STEP 2: Renewal Potential ══ */}
          {step === 'renewal_choice' && (
            <div className="max-w-lg mx-auto">
              <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
                {t('שלב 2: פוטנציאל התחדשות', 'Step 2: Renewal Potential')}
              </h1>
              <p className="text-foreground-muted text-sm mb-2 text-center">
                {address?.city && <span className="font-medium text-foreground">{address.city}</span>}
                {address?.street && <span> — {address.street}</span>}
              </p>
              <p className="text-foreground-muted text-xs mb-8 text-center">
                {t('האם לבניין יש פוטנציאל להתחדשות עירונית?', 'Does the building have urban renewal potential?')}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleRenewalChoice(true)}
                  className="w-full p-5 rounded-xl text-right cursor-pointer border-0 transition-all hover:scale-[1.01]"
                  style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }}
                >
                  <div className="font-semibold text-foreground mb-1">{t('הבניין עם פוטנציאל התחדשות עירונית', 'Building has urban renewal potential')}</div>
                  <div className="text-xs text-foreground-muted">{t('תמ"א 38 / פינוי-בינוי / שקד', 'TAMA 38 / Pinui-Binui / Shaked')}</div>
                </button>
                <button
                  onClick={() => handleRenewalChoice(false)}
                  className="w-full p-5 rounded-xl text-right cursor-pointer border-0 transition-all hover:scale-[1.01]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="font-semibold text-foreground mb-1">{t('אין פוטנציאל התחדשות', 'No renewal potential')}</div>
                  <div className="text-xs text-foreground-muted">{t('רכישת דירה רגילה', 'Standard apartment purchase')}</div>
                </button>
              </div>

              <button onClick={() => setStep('address')} className="mt-6 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                {t('← חזרה לחיפוש', '← Back to search')}
              </button>
            </div>
          )}

          {/* ══ STEP 3: Details Form ══ */}
          {step === 'details' && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
                {t('שלב 3: פרטי הנכס', 'Step 3: Property Details')}
              </h1>
              <p className="text-foreground-muted text-sm mb-8 text-center">
                {address?.city}{address?.street && ` — ${address.street}`}
                {hasRenewalPotential !== null && (
                  <span className="mx-2 text-xs px-2 py-0.5 rounded-full" style={{
                    background: hasRenewalPotential ? 'rgba(63,185,80,0.15)' : 'rgba(255,255,255,0.08)',
                    color: hasRenewalPotential ? '#3fb950' : 'var(--fg-dim)',
                  }}>
                    {hasRenewalPotential ? t('התחדשות', 'Renewal') : t('רגיל', 'Standard')}
                  </span>
                )}
              </p>

              <div className="rounded-2xl p-6 md:p-8 space-y-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>

                {/* ── Common apartment fields ── */}
                {!hasRenewalPotential && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Field label={t('שטח (מ"ר)', 'Area (sqm)')} required>
                        <input type="number" value={apartmentDetails.sqm || ''} onChange={e => setApartmentDetails(d => ({ ...d, sqm: Number(e.target.value) }))} className="form-input" placeholder="80" />
                      </Field>
                      <Field label={t('חדרים', 'Rooms')} required>
                        <input type="number" value={apartmentDetails.rooms || ''} onChange={e => setApartmentDetails(d => ({ ...d, rooms: Number(e.target.value) }))} className="form-input" placeholder="3" />
                      </Field>
                      <Field label={t('קומה', 'Floor')} required>
                        <input type="number" value={apartmentDetails.floor || ''} onChange={e => setApartmentDetails(d => ({ ...d, floor: Number(e.target.value) }))} className="form-input" placeholder="2" />
                      </Field>
                    </div>

                    <Field label={t('מצב', 'Condition')} required>
                      <div className="flex gap-3">
                        {(['preserved', 'old', 'renovated'] as const).map(c => (
                          <button
                            key={c}
                            onClick={() => setApartmentDetails(d => ({ ...d, condition: c }))}
                            className="flex-1 py-2 px-3 rounded-lg text-xs cursor-pointer border-0 transition-all"
                            style={{
                              background: apartmentDetails.condition === c ? 'rgba(91,141,238,0.2)' : 'rgba(255,255,255,0.06)',
                              border: `1px solid ${apartmentDetails.condition === c ? 'rgba(91,141,238,0.4)' : 'rgba(255,255,255,0.1)'}`,
                              color: apartmentDetails.condition === c ? '#5b8dee' : 'var(--fg-dim)',
                            }}
                          >
                            {c === 'preserved' ? t('שמור', 'Preserved') : c === 'old' ? t('ישן', 'Old') : t('משופץ', 'Renovated')}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <div className="flex flex-wrap gap-4">
                      <Checkbox label={t('חניה', 'Parking')} checked={apartmentDetails.hasParking} onChange={v => setApartmentDetails(d => ({ ...d, hasParking: v }))} />
                      <Checkbox label={t('מחסן', 'Storage')} checked={apartmentDetails.hasStorage} onChange={v => setApartmentDetails(d => ({ ...d, hasStorage: v }))} />
                      <Checkbox label={t('מעלית', 'Elevator')} checked={apartmentDetails.hasElevator} onChange={v => setApartmentDetails(d => ({ ...d, hasElevator: v }))} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label={t('מחיר מבוקש (₪)', 'Asking Price (₪)')}>
                        <input type="number" value={apartmentDetails.askingPrice || ''} onChange={e => setApartmentDetails(d => ({ ...d, askingPrice: Number(e.target.value) }))} className="form-input" placeholder="2,500,000" />
                      </Field>
                      <Field label={t('שכ"ד חודשי (₪)', 'Monthly Rent (₪)')} required>
                        <input type="number" value={apartmentDetails.monthlyRent || ''} onChange={e => setApartmentDetails(d => ({ ...d, monthlyRent: Number(e.target.value) }))} className="form-input" placeholder="5,000" />
                      </Field>
                    </div>

                    <Field label={t('סכום משכנתה (₪)', 'Mortgage Amount (₪)')}>
                      <input type="number" value={apartmentDetails.mortgageAmount || ''} onChange={e => setApartmentDetails(d => ({ ...d, mortgageAmount: Number(e.target.value) }))} className="form-input" placeholder="1,400,000" />
                    </Field>

                    {/* is_single_apartment — MANDATORY */}
                    <Field label={t('סוג רכישה', 'Purchase Type')} required>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setApartmentDetails(d => ({ ...d, isSingleApartment: true })); setSingleApartmentError(false); }}
                          className="flex-1 py-3 px-3 rounded-lg text-sm cursor-pointer border-0 transition-all"
                          style={{
                            background: apartmentDetails.isSingleApartment === true ? 'rgba(63,185,80,0.2)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${apartmentDetails.isSingleApartment === true ? 'rgba(63,185,80,0.4)' : singleApartmentError ? 'rgba(248,81,73,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            color: apartmentDetails.isSingleApartment === true ? '#3fb950' : 'var(--fg-dim)',
                          }}
                        >
                          {t('דירה יחידה', 'Single Apartment')}
                        </button>
                        <button
                          onClick={() => { setApartmentDetails(d => ({ ...d, isSingleApartment: false })); setSingleApartmentError(false); }}
                          className="flex-1 py-3 px-3 rounded-lg text-sm cursor-pointer border-0 transition-all"
                          style={{
                            background: apartmentDetails.isSingleApartment === false ? 'rgba(248,81,73,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${apartmentDetails.isSingleApartment === false ? 'rgba(248,81,73,0.4)' : singleApartmentError ? 'rgba(248,81,73,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            color: apartmentDetails.isSingleApartment === false ? '#f85149' : 'var(--fg-dim)',
                          }}
                        >
                          {t('דירה נוספת / משקיע', 'Additional / Investor')}
                        </button>
                      </div>
                      {singleApartmentError && (
                        <p className="text-xs mt-1" style={{ color: '#f85149' }}>
                          {t('חובה לבחור סוג רכישה', 'Purchase type is required')}
                        </p>
                      )}
                    </Field>
                  </>
                )}

                {/* ── Renewal-specific fields ── */}
                {hasRenewalPotential && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Field label={t('שנת בנייה', 'Build Year')} required>
                        <input type="number" value={renewalDetails.buildingYear || ''} onChange={e => setRenewalDetails(d => ({ ...d, buildingYear: Number(e.target.value) }))} className="form-input" placeholder="1965" />
                      </Field>
                      <Field label={t('יח"ד בבניין', 'Total Units')} required>
                        <input type="number" value={renewalDetails.totalUnits || ''} onChange={e => setRenewalDetails(d => ({ ...d, totalUnits: Number(e.target.value) }))} className="form-input" placeholder="24" />
                      </Field>
                      <Field label={t('כניסות', 'Entrances')}>
                        <input type="number" value={renewalDetails.entrances || ''} onChange={e => setRenewalDetails(d => ({ ...d, entrances: Number(e.target.value) }))} className="form-input" placeholder="1" />
                      </Field>
                    </div>

                    <Field label={t('שטח מגרש (מ"ר)', 'Plot Area (sqm)')}>
                      <input type="number" value={renewalDetails.plotAreaSqm || ''} onChange={e => setRenewalDetails(d => ({ ...d, plotAreaSqm: Number(e.target.value) }))} className="form-input" placeholder="2000" />
                    </Field>

                    <Checkbox label={t('חניה קיימת', 'Existing Parking')} checked={renewalDetails.hasParking} onChange={v => setRenewalDetails(d => ({ ...d, hasParking: v }))} />

                    <Field label={t('סטטוס התחדשות', 'Renewal Status')} required>
                      <select
                        value={renewalDetails.renewalStatus}
                        onChange={e => setRenewalDetails(d => ({ ...d, renewalStatus: e.target.value as RenewalDetails['renewalStatus'] }))}
                        className="form-input"
                      >
                        <option value="no_developer">{t('ללא יזם', 'No Developer')}</option>
                        <option value="developer_signed">{t('יזם חתם', 'Developer Signed')}</option>
                        <option value="planning_underway">{t('תכנון בהליך', 'Planning Underway')}</option>
                        <option value="plan_approved">{t('תוכנית אושרה', 'Plan Approved')}</option>
                      </select>
                    </Field>

                    <Field label={t('% דיירים חתומים', 'Signed Tenants %')}>
                      <input type="number" min="0" max="100" value={renewalDetails.signedTenantsPct || ''} onChange={e => setRenewalDetails(d => ({ ...d, signedTenantsPct: Number(e.target.value) }))} className="form-input" placeholder="67" />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label={t('שם יזם', 'Developer Name')}>
                        <input value={renewalDetails.developerName} onChange={e => setRenewalDetails(d => ({ ...d, developerName: e.target.value }))} className="form-input" placeholder={t('אופציונלי', 'Optional')} />
                      </Field>
                      <Field label={t('מספר תוכנית', 'Plan Number')}>
                        <input value={renewalDetails.planNumber} onChange={e => setRenewalDetails(d => ({ ...d, planNumber: e.target.value }))} className="form-input" placeholder={t('אופציונלי', 'Optional')} />
                      </Field>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep('renewal_choice')} className="px-4 py-2.5 rounded-lg text-sm cursor-pointer border-0 transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--fg-dim)' }}>
                    {t('← חזרה', '← Back')}
                  </button>
                  <button
                    onClick={computeResults}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-0 transition-all flex items-center justify-center gap-2"
                    style={{ background: '#5b8dee', color: '#fff' }}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {t('חשב תוצאות', 'Calculate Results')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 4: Results ══ */}
          {step === 'results' && !hasRenewalPotential && (
            <ResultsNoRenewal
              address={address}
              details={apartmentDetails}
              taxResult={taxResult}
              costsResult={costsResult}
              yieldResult={yieldResult}
              priceData={priceData}
              t={t}
              lang={lang}
              onBack={() => setStep('details')}
            />
          )}

          {step === 'results' && hasRenewalPotential && (
            <ResultsWithRenewal
              address={address}
              renewalDetails={renewalDetails}
              t={t}
              lang={lang}
              onBack={() => setStep('details')}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #e6edf3;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: rgba(91,141,238,0.5);
        }
        .form-input::placeholder {
          color: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  );
}

// ── Shared UI Components ──

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-foreground-muted mb-1.5">
        {label} {required && <span style={{ color: '#f85149' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm cursor-pointer bg-transparent border-0 transition-colors"
      style={{ color: checked ? '#5b8dee' : 'var(--fg-dim)' }}
    >
      <div className="w-4 h-4 rounded border flex items-center justify-center text-[10px]" style={{
        background: checked ? 'rgba(91,141,238,0.2)' : 'transparent',
        borderColor: checked ? '#5b8dee' : 'rgba(255,255,255,0.2)',
      }}>
        {checked && '✓'}
      </div>
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-sm font-bold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Results: No Renewal ──

function ResultsNoRenewal({
  address, details, taxResult, costsResult, yieldResult, priceData, t, lang, onBack,
}: {
  address: PropertyAddress | null;
  details: ApartmentDetails;
  taxResult: PurchaseTaxResult | null;
  costsResult: ComputeResult<AcquisitionCostResult> | null;
  yieldResult: ComputeResult<YieldResult> | null;
  priceData: Record<string, unknown> | null;
  t: (he: string, en: string) => string;
  lang: string;
  onBack: () => void;
}) {
  const price = details.askingPrice;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          {t('תוצאות ניתוח', 'Analysis Results')}
        </h1>
        <button onClick={onBack} className="text-xs text-foreground-muted hover:text-foreground cursor-pointer bg-transparent border-0">
          {t('← עריכה', '← Edit')}
        </button>
      </div>

      <div className="text-sm text-foreground-muted">
        {address?.city}{address?.street && ` — ${address.street}`} | {details.sqm} {t('מ"ר', 'sqm')} | {details.rooms} {t('חד\'', 'rooms')}
      </div>

      {/* A. Neighborhood Pricing */}
      {priceData && (
        <Section title={t('א. מחירי שכונה', 'A. Neighborhood Pricing')}>
          <PriceDataDisplay priceData={priceData} city={address?.city || ''} t={t} />
        </Section>
      )}

      {/* C. Purchase Tax */}
      {taxResult && price > 0 && (
        <Section title={t('ג. מס רכישה', 'C. Purchase Tax')}>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">{t('מחיר רכישה', 'Purchase Price')}</span>
              <span className="text-foreground font-medium">₪{fmt(price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">
                {details.isSingleApartment ? t('דירה יחידה', 'Single Apartment') : t('דירה נוספת / משקיע', 'Additional / Investor')}
              </span>
              <span className="text-foreground-muted text-xs">
                {t('מדרגות 2026', '2026 brackets')}
              </span>
            </div>
            <div className="border-t border-[var(--border)] pt-3 space-y-1">
              {taxResult.brackets.map((b, i) => (
                <div key={i} className="flex justify-between text-xs text-foreground-muted">
                  <span>{(b.rate * 100).toFixed(1)}% {t('על', 'on')} ₪{fmt(b.taxableAmount)}</span>
                  <span>₪{fmt(Math.round(b.tax))}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)] pt-3 flex justify-between">
              <span className="text-sm font-semibold text-foreground">{t('סה"כ מס רכישה', 'Total Purchase Tax')}</span>
              <span className="text-sm font-bold text-foreground">₪{fmt(taxResult.total)} ({fmtPct(taxResult.effectiveRatePct)})</span>
            </div>
          </div>
        </Section>
      )}

      {/* D. Acquisition Costs */}
      {costsResult && costsResult.status === 'OK' && (
        <Section title={t('ד. עלויות רכישה', 'D. Acquisition Costs')}>
          <div className="space-y-2 text-sm">
            <CostRow label={t('עמלת תיווך (2%+מע"מ)', 'Agent Fee (2%+VAT)')} value={costsResult.data.agentFee} note={costsResult.data.agentFeeNote} t={t} />
            <CostRow label={t('עו"ד', 'Attorney')} value={`${fmt(costsResult.data.attorneyEstimate.min)}–${fmt(costsResult.data.attorneyEstimate.max)}`} note={costsResult.data.attorneyNote} t={t} />
            <CostRow label={t('אגרת רישום משכנתה', 'Mortgage Registration')} value={costsResult.data.mortgageRegistration} note={costsResult.data.mortgageRegistrationNote} t={t} />
            <div className="border-t border-[var(--border)] pt-3 flex justify-between">
              <span className="font-semibold text-foreground">{t('סה"כ עלות רכישה', 'Total Acquisition Cost')}</span>
              <span className="font-bold text-foreground">₪{fmt(costsResult.data.totalAcquisitionCost)}</span>
            </div>
          </div>
        </Section>
      )}

      {/* E. Yield */}
      {yieldResult && yieldResult.status === 'OK' && (
        <Section title={t('ה. תשואה', 'E. Yield')}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <YieldCard label={t('תשואה ברוטו', 'Gross Yield')} value={fmtPct(yieldResult.data.grossYieldPct)} />
            <YieldCard label={t('תשואה נטו', 'Net Yield')} value={fmtPct(yieldResult.data.netYieldPct)} />
            {yieldResult.data.cashOnCashPct !== null && (
              <YieldCard label={t('תשואה על הון עצמי', 'Cash-on-Cash')} value={fmtPct(yieldResult.data.cashOnCashPct)} />
            )}
          </div>
          <div className="space-y-1 text-xs text-foreground-muted">
            <div className="flex justify-between"><span>{t('הכנסה שנתית ברוטו', 'Annual Gross')}</span><span>₪{fmt(yieldResult.data.annualGrossIncome)}</span></div>
            <div className="flex justify-between"><span>{t('הוצאות שנתיות (הערכה)', 'Annual Expenses (est.)')}</span><span>₪{fmt(yieldResult.data.annualExpenses)}</span></div>
            <div className="flex justify-between"><span>{t('הכנסה שנתית נטו', 'Annual Net')}</span><span>₪{fmt(yieldResult.data.annualNetIncome)}</span></div>
          </div>
          {/* Rent tax */}
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-xs font-semibold text-foreground mb-2">{t('מס שכירות', 'Rent Tax')}</div>
            {yieldResult.data.rentTaxOptions.exemptUnderThreshold ? (
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                {t(`פטור — מתחת לסף ₪${fmt(yieldResult.data.rentTaxOptions.threshold)}/חודש`, `Exempt — below ₪${fmt(yieldResult.data.rentTaxOptions.threshold)}/month threshold`)}
              </div>
            ) : (
              <div className="space-y-1 text-xs text-foreground-muted">
                <div className="flex justify-between"><span>{t('אפשרות 1: 10% שטוח', 'Option 1: 10% flat')}</span><span>₪{fmt(yieldResult.data.rentTaxOptions.option10PctFlat)}/{t('שנה', 'yr')}</span></div>
                <div className="flex justify-between"><span>{t('אפשרות 2: 10% על עודף', 'Option 2: 10% on excess')}</span><span>₪{fmt(yieldResult.data.rentTaxOptions.option10PctOnExcess)}/{t('שנה', 'yr')}</span></div>
              </div>
            )}
          </div>
          {yieldResult.warnings.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-foreground-muted">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#d29922' }} />
              <span>{yieldResult.warnings.join(' | ')}</span>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function CostRow({ label, value, note, t }: { label: string; value: number | string; note: string; t: (he: string, en: string) => string }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <span className="text-foreground-muted">{label}</span>
        <span className="text-[10px] text-foreground-muted ml-2">({note})</span>
      </div>
      <span className="text-foreground font-medium">{typeof value === 'number' ? `₪${fmt(value)}` : `₪${value}`}</span>
    </div>
  );
}

function YieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-foreground-muted mt-1">{label}</div>
    </div>
  );
}

function PriceDataDisplay({ priceData, city, t }: { priceData: Record<string, unknown>; city: string; t: (he: string, en: string) => string }) {
  const pd = priceData as { priceData?: { city_estimate?: { price_per_sqm?: number; confidence?: string; source?: string; disclaimer?: string }; national_index?: { latest_value?: number } } };
  const estimate = pd?.priceData?.city_estimate;

  if (!estimate) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#d29922' }} />
        {t('אין נתוני מחירים זמינים לעיר זו', 'No price data available for this city')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-foreground-muted">{t('מחיר ממוצע למ"ר', 'Average Price/sqm')}</span>
        <div className="text-right">
          <span className="text-foreground font-medium">₪{fmt(estimate.price_per_sqm || 0)}</span>
          <span className="text-[10px] text-foreground-muted block">
            {estimate.confidence === 'HIGH' ? t('ביטחון גבוה', 'High confidence') : t('ביטחון נמוך', 'Low confidence')}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-2 text-[10px] text-foreground-muted p-2 rounded" style={{ background: 'rgba(210,153,34,0.08)' }}>
        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#d29922' }} />
        <span>{estimate.disclaimer || t('הערכה בלבד', 'Estimate only')}</span>
      </div>
      <div className="text-[10px] text-foreground-muted">
        {t('מקור: ', 'Source: ')}{estimate.source || 'CBS 2024'}
        {' | '}
        <a href="https://www.nadlan.gov.il" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#5b8dee' }}>
          nadlan.gov.il {t('— לנתוני עסקאות אמיתיים', '— for real transaction data')}
        </a>
      </div>
    </div>
  );
}

// ── Results: With Renewal ──

function ResultsWithRenewal({
  address, renewalDetails, t, lang, onBack,
}: {
  address: PropertyAddress | null;
  renewalDetails: RenewalDetails;
  t: (he: string, en: string) => string;
  lang: string;
  onBack: () => void;
}) {
  // Timeline estimate based on status
  const timelineEstimate = (): { label: string; note: string } => {
    switch (renewalDetails.renewalStatus) {
      case 'no_developer':
        return { label: t('לא ניתן להערכה', 'Cannot estimate'), note: t('צפי לא ניתן להערכה ללא יזם פעיל', 'No estimate possible without an active developer') };
      case 'developer_signed':
        return { label: t('5–10 שנים', '5–10 years'), note: t('הערכה: 5–10 שנים עד מסירה, בהתאם לסטטוס מינהלי', 'Estimate: 5–10 years until delivery, depending on administrative status') };
      case 'planning_underway':
        return { label: t('3–7 שנים', '3–7 years'), note: t('הערכה: 3–7 שנים — תוכנית בהליך', 'Estimate: 3–7 years — plan in process') };
      case 'plan_approved':
        return { label: t('2–5 שנים', '2–5 years'), note: t('הערכה: 2–5 שנים — תוכנית מאושרת', 'Estimate: 2–5 years — plan approved') };
    }
  };

  const timeline = timelineEstimate();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          {t('תוצאות — מסלול התחדשות', 'Results — Renewal Path')}
        </h1>
        <button onClick={onBack} className="text-xs text-foreground-muted hover:text-foreground cursor-pointer bg-transparent border-0">
          {t('← עריכה', '← Edit')}
        </button>
      </div>

      <div className="text-sm text-foreground-muted">
        {address?.city}{address?.street && ` — ${address.street}`}
      </div>

      {/* Building Info */}
      <Section title={t('פרטי בניין', 'Building Details')}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-foreground-muted">{t('שנת בנייה', 'Build Year')}</div>
          <div className="text-foreground">{renewalDetails.buildingYear || '—'}</div>
          <div className="text-foreground-muted">{t('יח"ד', 'Units')}</div>
          <div className="text-foreground">{renewalDetails.totalUnits || '—'}</div>
          <div className="text-foreground-muted">{t('שטח מגרש', 'Plot Area')}</div>
          <div className="text-foreground">{renewalDetails.plotAreaSqm ? `${fmt(renewalDetails.plotAreaSqm)} מ"ר` : '—'}</div>
          <div className="text-foreground-muted">{t('כניסות', 'Entrances')}</div>
          <div className="text-foreground">{renewalDetails.entrances}</div>
        </div>
      </Section>

      {/* Status */}
      <Section title={t('סטטוס התחדשות', 'Renewal Status')}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{
              background: renewalDetails.renewalStatus === 'plan_approved' ? '#3fb950' :
                renewalDetails.renewalStatus === 'planning_underway' ? '#d29922' :
                renewalDetails.renewalStatus === 'developer_signed' ? '#5b8dee' : '#8b949e',
            }} />
            <span className="text-sm text-foreground font-medium">
              {renewalDetails.renewalStatus === 'no_developer' ? t('ללא יזם', 'No Developer') :
               renewalDetails.renewalStatus === 'developer_signed' ? t('יזם חתם', 'Developer Signed') :
               renewalDetails.renewalStatus === 'planning_underway' ? t('תכנון בהליך', 'Planning Underway') :
               t('תוכנית אושרה', 'Plan Approved')}
            </span>
          </div>
          {renewalDetails.signedTenantsPct > 0 && (
            <div className="text-xs text-foreground-muted">{t('חתימות', 'Signatures')}: {renewalDetails.signedTenantsPct}%</div>
          )}
        </div>
      </Section>

      {/* Developer */}
      {renewalDetails.developerName ? (
        <Section title={t('יזם', 'Developer')}>
          <div className="text-sm text-foreground">{renewalDetails.developerName}</div>
          <div className="text-xs text-foreground-muted mt-2">
            {t('בדקו את היזם בכלי בדיקת יזמים', 'Check the developer in our developer assessment tool')}
          </div>
        </Section>
      ) : (
        <Section title={t('יזם', 'Developer')}>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#d29922' }} />
            {t('לא נמצאו תוכניות על שם היזם — אין אפשרות לאמת ניסיון.', 'No plans found under developer name — cannot verify experience.')}
          </div>
        </Section>
      )}

      {/* Timeline */}
      <Section title={t('הערכת לו"ז', 'Timeline Estimate')}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl font-bold text-foreground">{timeline.label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(210,153,34,0.15)', color: '#d29922' }}>
            {t('הערכה בלבד', 'Estimate Only')}
          </span>
        </div>
        <p className="text-xs text-foreground-muted">{timeline.note}</p>
      </Section>
    </div>
  );
}
