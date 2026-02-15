'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2, ArrowRight, Globe, Search, ChevronLeft, Shield,
  Gavel, TrendingDown, Scale, Building, Landmark, AlertTriangle,
  DollarSign, Users, FileText, Lock, X, ArrowLeft,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { COUNTRIES, SYSTEMIC_RISKS, CountryRisk, RiskModule } from '@/data/foreign-risks';

// =============================================
// Constants
// =============================================

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

// =============================================
// Icon Mapping
// =============================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Gavel,
  Globe,
  TrendingDown,
  Scale,
  Building,
  Shield,
  Landmark,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Lock,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Shield;
}

// =============================================
// Severity Helpers
// =============================================

function severityColor(severity: string): string {
  switch (severity) {
    case 'low': return 'var(--green)';
    case 'medium': return 'var(--gold)';
    case 'high': return 'var(--red)';
    case 'critical': return '#ff3333';
    default: return 'var(--fg-muted)';
  }
}

function severityPercent(severity: string): number {
  switch (severity) {
    case 'low': return 25;
    case 'medium': return 50;
    case 'high': return 75;
    case 'critical': return 100;
    default: return 0;
  }
}

function severityLabel(severity: string, lang: string): string {
  const map: Record<string, [string, string]> = {
    low: ['נמוך', 'Low'],
    medium: ['בינוני', 'Medium'],
    high: ['גבוה', 'High'],
    critical: ['קריטי', 'Critical'],
  };
  const entry = map[severity];
  return entry ? (lang === 'he' ? entry[0] : entry[1]) : severity;
}

function overallBadgeStyle(risk: string) {
  switch (risk) {
    case 'low':
      return { background: 'rgba(63, 185, 80, 0.15)', color: 'var(--green-light)', border: '1px solid rgba(63, 185, 80, 0.3)' };
    case 'medium':
      return { background: 'rgba(210, 153, 34, 0.15)', color: 'var(--gold-light)', border: '1px solid rgba(210, 153, 34, 0.3)' };
    case 'high':
      return { background: 'rgba(248, 81, 73, 0.15)', color: '#FF7B72', border: '1px solid rgba(248, 81, 73, 0.3)' };
    case 'critical':
      return { background: 'rgba(255, 51, 51, 0.18)', color: '#ff6666', border: '1px solid rgba(255, 51, 51, 0.4)' };
    default:
      return {};
  }
}

// =============================================
// Main Page Component
// =============================================

export default function ForeignPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const [selectedCountry, setSelectedCountry] = useState<CountryRisk | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.nameHe.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.flag.includes(q)
    );
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Select a country with loading animation
  function selectCountry(country: CountryRisk) {
    setShowDropdown(false);
    setSearchQuery('');
    setLoading(true);
    setTimeout(() => {
      setSelectedCountry(country);
      setLoading(false);
    }, 1200);
  }

  // Back to selector
  function goBack() {
    setSelectedCountry(null);
    setSearchQuery('');
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
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
            <span className="font-bold text-sm tracking-tight">PROPCHECK</span>
            <span className="text-foreground-muted text-xs hidden sm:inline">{t('| נכס בחו"ל', '| Foreign Property')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : '\u05E2\u05D1'}
            </button>
            {selectedCountry && (
              <button onClick={goBack} className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0">
                {lang === 'he' ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                {t('חזרה', 'Back')}
              </button>
            )}
            <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('ראשי', 'Home')}
              {lang === 'he' && <ArrowRight className="w-3 h-3" />}
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1">
        {loading ? (
          <LoadingState t={t} />
        ) : selectedCountry ? (
          <ReportView country={selectedCountry} lang={lang} t={t} onBack={goBack} />
        ) : (
          <CountrySelector
            lang={lang}
            t={t}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            filteredCountries={filteredCountries}
            onSelect={selectCountry}
            searchRef={searchRef}
            inputRef={inputRef}
          />
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('מודיעין סיכוני נדל"ן בחו"ל', 'Foreign Property Risk Intelligence')}</span>
      </div>
    </div>
  );
}

// =============================================
// Phase A: Country Selector
// =============================================

function CountrySelector({
  lang,
  t,
  searchQuery,
  setSearchQuery,
  showDropdown,
  setShowDropdown,
  filteredCountries,
  onSelect,
  searchRef,
  inputRef,
}: {
  lang: string;
  t: (he: string, en: string) => string;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
  filteredCountries: CountryRisk[];
  onSelect: (c: CountryRisk) => void;
  searchRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-112px)] px-6">
      <div className="w-full max-w-xl text-center fade-in-up">
        {/* Branding */}
        <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-4">
          PROPCHECK INTELLIGENCE
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {t('סיכוני השקעה בנכס בחו"ל', 'Foreign Property Risk Intelligence')}
        </h1>
        <p className="text-sm text-foreground-muted mb-8 max-w-md mx-auto">
          {t(
            'בחר מדינה לקבלת דוח מודיעין סיכונים מקיף — על בסיס ניתוח רגולטורי, כלכלי ומשפטי.',
            'Select a country to receive a comprehensive risk intelligence report — based on regulatory, economic, and legal analysis.'
          )}
        </p>

        {/* Search */}
        <div ref={searchRef} className="relative w-full max-w-md mx-auto">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: showDropdown ? '1px solid var(--accent)' : '1px solid var(--border)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('חפש מדינה...', 'Search country...')}
              className="bg-transparent border-0 outline-none text-sm text-foreground flex-1 placeholder:text-foreground-muted/50"
              style={{ direction: lang === 'he' ? 'rtl' : 'ltr' }}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
                className="bg-transparent border-0 cursor-pointer p-0 text-foreground-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-72 overflow-y-auto"
              style={{
                background: 'rgba(22,27,34,0.96)',
                border: '1px solid var(--border-light)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }}
            >
              {filteredCountries.length === 0 ? (
                <div className="px-4 py-6 text-sm text-foreground-muted text-center">
                  {t('לא נמצאו תוצאות', 'No results found')}
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => onSelect(country)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer bg-transparent border-0 hover:bg-white/5"
                    style={{ textAlign: lang === 'he' ? 'right' : 'left' }}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-foreground font-medium">
                      {lang === 'he' ? country.nameHe : country.nameEn}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        ...overallBadgeStyle(country.overallRisk),
                        marginInlineStart: 'auto',
                        fontSize: '10px',
                      }}
                    >
                      {severityLabel(country.overallRisk, lang)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick country chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {COUNTRIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-foreground-muted hover:text-foreground transition-all cursor-pointer bg-transparent border border-[var(--border)] hover:border-[var(--border-light)] hover:bg-white/5"
            >
              <span>{c.flag}</span>
              <span>{lang === 'he' ? c.nameHe : c.nameEn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================
// Loading State
// =============================================

function LoadingState({ t }: { t: (he: string, en: string) => string }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-112px)] px-6">
      <div className="text-center w-full max-w-sm">
        <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-6">
          PROPCHECK
        </div>
        <h2 className="text-lg font-bold text-foreground mb-6">
          {t('אוסף מודיעין...', 'Gathering Intelligence...')}
        </h2>
        <div className="space-y-3">
          {[85, 65, 45, 70].map((w, i) => (
            <div key={i} className="h-2.5 rounded-full shimmer" style={{ width: `${w}%`, margin: '0 auto', animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <p className="text-xs text-foreground-muted mt-6">
          {t('מנתח רגולציה, מיסוי וסיכונים משפטיים...', 'Analyzing regulation, taxation, and legal risks...')}
        </p>
      </div>
    </div>
  );
}

// =============================================
// Phase B: The Report
// =============================================

function ReportView({
  country,
  lang,
  t,
  onBack,
}: {
  country: CountryRisk;
  lang: string;
  t: (he: string, en: string) => string;
  onBack: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Report Document Container */}
      <div
        className="rounded-2xl overflow-hidden fade-in-up"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Header Section: The Verdict ── */}
        <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8 border-b border-gray-200">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 font-mono">
            PROPCHECK / RISK INTELLIGENCE REPORT
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t('פרופיל סיכון השקעה:', 'Investment Risk Profile:')}{' '}
            <span className="whitespace-nowrap">
              {country.flag} {lang === 'he' ? country.nameHe : country.nameEn}
            </span>
          </h1>

          <p className="text-sm text-gray-500 mb-4">
            {t('ניתוח בשלות שוק וחשיפה רגולטורית', 'Market Maturity & Regulatory Exposure Analysis')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={overallRiskBadgePrint(country.overallRisk)}
            >
              {severityLabel(country.overallRisk, lang)} {t('סיכון', 'Risk')}
            </span>
            <span className="text-xs text-gray-500">
              {lang === 'he' ? country.maturityHe : country.maturityEn}
            </span>
          </div>
        </div>

        {/* ── Section 1: Executive Summary (Systemic Risks) ── */}
        <div className="px-6 sm:px-10 py-6 sm:py-8" style={{ background: 'rgba(245,245,245,0.6)' }}>
          <div className="mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-1 font-mono">
              {t('חלק 1', 'SECTION 1')}
            </h2>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              {t('תמצית מנהלים — סיכונים מבניים', 'Executive Summary — Systemic Risks')}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {t(
                'סיכונים מבניים החלים על כל השקעת נדל"ן בחו"ל, ללא קשר למדינה הנבחרת.',
                'Structural risks that apply to all foreign real estate investments, regardless of the selected country.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SYSTEMIC_RISKS.map((risk) => {
              const Icon = getIcon(risk.icon);
              return (
                <div key={risk.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(91,141,238,0.1)' }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {lang === 'he' ? risk.titleHe : risk.titleEn}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                      {lang === 'he' ? risk.descHe : risk.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: Jurisdiction-Specific Intelligence ── */}
        <div className="px-6 sm:px-10 py-6 sm:py-8">
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-1 font-mono">
              {t('חלק 2', 'SECTION 2')}
            </h2>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              {t(`מודיעין ספציפי — ${country.nameHe}`, `Jurisdiction-Specific Intelligence — ${country.nameEn}`)}
            </h3>
          </div>

          <div className="space-y-0">
            {country.risks.map((risk, idx) => (
              <RiskModuleBlock
                key={risk.id}
                risk={risk}
                lang={lang}
                isLast={idx === country.risks.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ── Section 3: Conversion Bridge Footer ── */}
        <div className="px-6 sm:px-10 py-8 sm:py-10 border-t border-gray-200" style={{ background: 'rgba(245,245,245,0.4)' }}>
          <div className="text-center">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-1 font-mono">
              {t('חלק 3', 'SECTION 3')}
            </h2>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              {t('הקשר את הסיכון', 'Contextualize This Risk')}
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              {t(
                'שווקים זרים מציעים שונות גבוהה. השווה מול חלופות מקומיות.',
                'Foreign markets offer high variance. Compare against domestic alternatives.'
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/checkup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #5B8DEE 0%, #7C3AED 100%)',
                  boxShadow: '0 4px 16px rgba(91,141,238,0.3)',
                }}
              >
                <Shield className="w-4 h-4" />
                {t('השווה להתחדשות עירונית בישראל', 'Compare with Israeli Urban Renewal')}
                {lang === 'he' && <ChevronLeft className="w-4 h-4" />}
              </a>
              <a
                href="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-gray-700 transition-all hover:bg-gray-100 border border-gray-300"
              >
                {t(
                  `שוחח עם אנליסט על ${country.nameHe}`,
                  `Speak to an Analyst about ${country.nameEn}`
                )}
              </a>
            </div>
          </div>
        </div>

        {/* Report footer */}
        <div className="px-6 sm:px-10 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-mono">
            PROPCHECK RISK REPORT / {new Date().toLocaleDateString('en-GB')}
          </span>
          <button
            onClick={onBack}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer bg-transparent border-0 flex items-center gap-1"
          >
            {lang === 'he' ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
            {t('בחר מדינה אחרת', 'Select Another Country')}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Risk Module Block
// =============================================

function RiskModuleBlock({
  risk,
  lang,
  isLast,
}: {
  risk: RiskModule;
  lang: string;
  isLast: boolean;
}) {
  const Icon = getIcon(risk.icon);
  const color = severityColor(risk.severity);
  const pct = severityPercent(risk.severity);

  return (
    <div
      className="fade-in-up"
      style={{ animationDelay: '0.1s' }}
    >
      <div className="py-5 sm:py-6">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-gray-900">
              {lang === 'he' ? risk.titleHe : risk.titleEn}
            </h4>
            <p className="text-xs mt-0.5" style={{ color }}>
              {lang === 'he' ? risk.contextHe : risk.contextEn}
            </p>
          </div>
        </div>

        {/* Risk intensity bar */}
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
        </div>

        {/* Bullet points */}
        <ul className="space-y-1.5 mb-3">
          {(lang === 'he' ? risk.detailsHe : risk.detailsEn).map((detail, i) => (
            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <span className="w-1 h-1 rounded-full flex-shrink-0 mt-2" style={{ background: color }} />
              {detail}
            </li>
          ))}
        </ul>

        {/* Bottom line */}
        <p className="text-xs sm:text-sm font-bold text-gray-900">
          {lang === 'he' ? risk.bottomLineHe : risk.bottomLineEn}
        </p>
      </div>

      {/* Hairline divider */}
      {!isLast && <div className="h-px bg-gray-200" />}
    </div>
  );
}

// =============================================
// Helper: Print-friendly badge style
// =============================================

function overallRiskBadgePrint(risk: string) {
  switch (risk) {
    case 'low':
      return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
    case 'medium':
      return { background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a' };
    case 'high':
      return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
    case 'critical':
      return { background: '#fecaca', color: '#991b1b', border: '1px solid #f87171' };
    default:
      return {};
  }
}
