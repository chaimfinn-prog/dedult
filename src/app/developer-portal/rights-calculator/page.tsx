'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Building2,
  Globe,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Ruler,
  Calculator,
  Car,
  Home,
  Users,
  Layers,
  AlertTriangle,
  Check,
  Info,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── Constants ────────────────────────────────────────────────

const VIDEO_SRC =
  'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80';

const PURPLE = '#a78bfa';

// ── Helpers ──────────────────────────────────────────────────

function parseNum(raw: string): number {
  return parseFloat(raw.replace(/,/g, '')) || 0;
}

function commaFormat(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('he-IL');
}

function fmtNum(n: number): string {
  return n.toLocaleString('he-IL');
}

function fmtDec(n: number, decimals = 1): string {
  return n.toLocaleString('he-IL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ── Building coefficient lookup ──────────────────────────────

function getBuildingCoefficient(floors: number): number {
  if (floors <= 1) return 5.5;
  if (floors === 2) return 6.5;
  if (floors === 3) return 7.5;
  if (floors === 4) return 8.5;
  if (floors === 5) return 9.5;
  return 10.5; // 6+
}

// ── Types ────────────────────────────────────────────────────

interface CalcResult {
  // Step 1
  coveragePercentage: number;
  // Step 2
  buildingCoefficient: number;
  // Step 3
  baseRights: number;
  // Step 4
  rooftopBonus: number;
  sharedSpaces: number;
  publicUseSpaces: number;
  // Step 5
  totalRights: number;
  // Step 6
  maxUnits: number;
  // Step 7
  maxFloors: number;
  // Step 8
  balconiesDeduction: number;
  laundryDeduction: number;
  spacesDeduction: number;
  totalDeductions: number;
  netBuildableArea: number;
  numFloors: number;
  // Step 9
  smallUnits: number;
  mediumUnits: number;
  largeUnits: number;
  penthouseUnits: number;
  smallArea: number;
  mediumArea: number;
  largeArea: number;
  penthouseArea: number;
  // Step 10
  parkingSpaces: number;
  undergroundLevels: number;
}

// ── Component ────────────────────────────────────────────────

export default function RightsCalculatorPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const isHe = lang === 'he';

  // ── Mandatory inputs ──
  const [plotAreaRaw, setPlotAreaRaw] = useState('');
  const [existingFloorsRaw, setExistingFloorsRaw] = useState('');

  // ── Optional inputs ──
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [blockNumber, setBlockNumber] = useState('');
  const [parcelNumber, setParcelNumber] = useState('');
  const [plotWidthRaw, setPlotWidthRaw] = useState('');
  const [aptsPerFloorRaw, setAptsPerFloorRaw] = useState('');
  const [isCornerPlot, setIsCornerPlot] = useState(false);

  // ── Calculation state ──
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  // ── Parsed values ──
  const plotArea = parseNum(plotAreaRaw);
  const existingFloors = parseInt(existingFloorsRaw, 10) || 0;
  const aptsPerFloor = parseInt(aptsPerFloorRaw, 10) || 7;

  // ── Validation ──
  const plotAreaValid = plotArea >= 100 && plotArea <= 10000;
  const floorsValid = existingFloors >= 1 && existingFloors <= 10;
  const plotAreaTouched = plotAreaRaw.length > 0;
  const floorsTouched = existingFloorsRaw.length > 0;
  const formValid = plotAreaValid && floorsValid;

  // ── Calculation engine (useMemo) ──
  const calc: CalcResult | null = useMemo(() => {
    if (!hasCalculated || !formValid) return null;

    // Step 1 — Coverage Percentage
    const coveragePercentage = plotArea <= 2000 ? 0.55 : 0.50;

    // Step 2 — Building Coefficient
    const buildingCoefficient = getBuildingCoefficient(existingFloors);

    // Step 3 — Base Rights
    const baseRights = plotArea * coveragePercentage * buildingCoefficient;

    // Step 4 — Bonuses
    const rooftopBonus = baseRights * 0.05;
    const sharedSpaces = 50;
    const publicUseSpaces = plotArea > 2000 ? 450 : 0;

    // Step 5 — Total Building Rights
    const totalRights = baseRights + rooftopBonus + sharedSpaces + publicUseSpaces;

    // Step 6 — Max Units
    const maxUnits = Math.floor((plotArea / 1000) * 45);

    // Step 7 — Max Floors
    const maxFloors = 1 + Math.round(buildingCoefficient) + 1;

    // Step 8 — Practical Deductions
    const numFloors = Math.round(buildingCoefficient);
    const balconiesDeduction = aptsPerFloor * numFloors * 15;
    const laundryDeduction = 14;
    const spacesDeduction = 120;
    const totalDeductions = balconiesDeduction + laundryDeduction + spacesDeduction;
    const netBuildableArea = totalRights - totalDeductions;

    // Step 9 — Apartment Mix
    const smallUnits = Math.round(maxUnits * 0.30);
    const mediumUnits = Math.round(maxUnits * 0.40);
    const largeUnits = Math.round(maxUnits * 0.20);
    const penthouseUnits = Math.max(maxUnits - smallUnits - mediumUnits - largeUnits, 0);
    const smallArea = smallUnits * 65;
    const mediumArea = mediumUnits * 95;
    const largeArea = largeUnits * 115;
    const penthouseArea = penthouseUnits * 90;

    // Step 10 — Parking
    const parkingSpaces = maxUnits * 1;
    const undergroundLevels = Math.min(
      Math.ceil(parkingSpaces / ((plotArea * 0.85) / 25)),
      5
    );

    return {
      coveragePercentage,
      buildingCoefficient,
      baseRights,
      rooftopBonus,
      sharedSpaces,
      publicUseSpaces,
      totalRights,
      maxUnits,
      maxFloors,
      balconiesDeduction,
      laundryDeduction,
      spacesDeduction,
      totalDeductions,
      netBuildableArea,
      numFloors,
      smallUnits,
      mediumUnits,
      largeUnits,
      penthouseUnits,
      smallArea,
      mediumArea,
      largeArea,
      penthouseArea,
      parkingSpaces,
      undergroundLevels,
    };
  }, [hasCalculated, formValid, plotArea, existingFloors, aptsPerFloor]);

  // ── Handlers ──
  const handlePlotArea = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPlotAreaRaw(commaFormat(e.target.value));
    setHasCalculated(false);
  }, []);

  const handleFloors = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d]/g, '');
    if (v.length <= 2) {
      setExistingFloorsRaw(v);
      setHasCalculated(false);
    }
  }, []);

  const handleCalculate = useCallback(() => {
    if (!formValid) return;
    setIsComputing(true);
    setHasCalculated(false);
    // Simulate cinematic computation delay
    setTimeout(() => {
      setIsComputing(false);
      setHasCalculated(true);
    }, 1800);
  }, [formValid]);

  // ── Input style factory ──
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(0,0,0,0.12)'}`,
    background: 'rgba(255,255,255,0.7)',
    fontSize: '15px',
    fontFamily: "'Space Grotesk', monospace",
    color: '#1a1a2e',
    outline: 'none',
    transition: 'border-color 0.15s',
  });

  const labelStyle: React.CSSProperties = { color: '#4a4a6a' };

  // ── Section header component ──
  const SectionHeader = ({
    icon: Icon,
    title,
    subtitle,
  }: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
  }) => (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${PURPLE}18`, border: `1px solid ${PURPLE}30` }}
      >
        <Icon className="w-4 h-4" style={{ color: PURPLE }} />
      </div>
      <div>
        <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px]" style={{ color: '#6b7280' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  // ── Metric card component ──
  const MetricCard = ({
    label,
    value,
    unit,
    icon: Icon,
    highlight,
  }: {
    label: string;
    value: string;
    unit: string;
    icon: React.ElementType;
    highlight?: boolean;
  }) => (
    <div
      className="text-center p-5 rounded-xl relative overflow-hidden"
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${PURPLE}12, ${PURPLE}06)`
          : 'rgba(0,0,0,0.03)',
        border: highlight
          ? `1px solid ${PURPLE}30`
          : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {highlight && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)`,
          }}
        />
      )}
      <Icon
        className="w-5 h-5 mx-auto mb-2"
        style={{ color: highlight ? PURPLE : '#9ca3af' }}
      />
      <div className="text-xs font-semibold mb-1" style={{ color: '#6b7280' }}>
        {label}
      </div>
      <div
        className="text-3xl sm:text-4xl font-black"
        style={{
          fontFamily: "'Space Grotesk', monospace",
          color: highlight ? PURPLE : '#1a1a2e',
        }}
      >
        {value}
      </div>
      <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
        {unit}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="bg-video bg-cinematic"
          poster={FALLBACK_IMG}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-cinematic bg-cover bg-center"
          style={{ backgroundImage: `url('${FALLBACK_IMG}')` }}
        />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* ── Header ── */}
      <div
        className="relative z-10 border-b border-[var(--border)] sticky top-0"
        style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4" style={{ color: PURPLE }} />
            <span className="font-bold text-sm">PROPCHECK</span>
            <span className="text-foreground-muted text-xs">
              {t('| מחשבון זכויות בנייה', '| Building Rights Calculator')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : '\u05E2\u05D1'}
            </button>
            <a
              href="/developer-portal"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              {t('\u05D7\u05D6\u05E8\u05D4', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t(
              'מחשבון זכויות בנייה — תב"ע רע/רע/ב',
              'Building Rights Calculator — Ra/Ra/B Plan'
            )}
          </h1>
          <p className="text-sm text-foreground-muted max-w-xl mx-auto">
            {t(
              'תב"ע 416-1060052 | התחדשות עירונית רעננה | אושרה 25.02.2025',
              'Zoning Plan 416-1060052 | Ra\'anana Urban Renewal | Approved 25.02.2025'
            )}
          </p>
        </div>

        {/* ── Glass Calculator Card ── */}
        <div
          className="mx-auto max-w-4xl"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 'var(--radius)',
            color: '#1a1a2e',
            padding: 0,
          }}
        >
          {/* ── Input Form Section ── */}
          <div className="p-6 sm:p-8">
            {/* Mandatory Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* Plot Area */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    {t('שטח מגרש (מ"ר)', 'Plot Area (sqm)')}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={t('לדוגמה: 3,000', 'e.g. 3,000')}
                  value={plotAreaRaw}
                  onChange={handlePlotArea}
                  style={inputStyle(plotAreaTouched && !plotAreaValid)}
                  onFocus={(e) => {
                    e.target.style.borderColor = PURPLE;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      plotAreaTouched && !plotAreaValid
                        ? '#ef4444'
                        : 'rgba(0,0,0,0.12)';
                  }}
                />
                {plotAreaTouched && !plotAreaValid && (
                  <p
                    className="text-[11px] mt-1 flex items-center gap-1"
                    style={{ color: '#ef4444' }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {t(
                      'שטח מגרש חייב להיות בין 100 ל-10,000 מ"ר',
                      'Plot area must be between 100 and 10,000 sqm'
                    )}
                  </p>
                )}
              </div>

              {/* Existing Floors */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    {t('קומות קיימות', 'Existing Floors')}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={t('לדוגמה: 3', 'e.g. 3')}
                  value={existingFloorsRaw}
                  onChange={handleFloors}
                  style={inputStyle(floorsTouched && !floorsValid)}
                  onFocus={(e) => {
                    e.target.style.borderColor = PURPLE;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      floorsTouched && !floorsValid
                        ? '#ef4444'
                        : 'rgba(0,0,0,0.12)';
                  }}
                />
                {floorsTouched && !floorsValid && (
                  <p
                    className="text-[11px] mt-1 flex items-center gap-1"
                    style={{ color: '#ef4444' }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {t(
                      'מספר קומות חייב להיות בין 1 ל-10',
                      'Floors must be between 1 and 10'
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* ── Advanced Settings (Collapsible) ── */}
            <div
              className="rounded-lg overflow-hidden mb-6"
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.02)',
              }}
            >
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold cursor-pointer bg-transparent border-0"
                style={{ color: '#4a4a6a' }}
              >
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" style={{ color: PURPLE }} />
                  {t('הגדרות מתקדמות', 'Advanced Settings')}
                </span>
                {advancedOpen ? (
                  <ChevronUp className="w-4 h-4" style={{ color: '#9ca3af' }} />
                ) : (
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ color: '#9ca3af' }}
                  />
                )}
              </button>

              {advancedOpen && (
                <div className="px-4 pb-4">
                  <div
                    style={{
                      height: 1,
                      background: 'rgba(0,0,0,0.06)',
                      marginBottom: '16px',
                    }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Block Number */}
                    <div>
                      <label
                        className="block text-[11px] font-semibold mb-1"
                        style={labelStyle}
                      >
                        {t('גוש', 'Block Number')}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder={t('מספר גוש', 'Block #')}
                        value={blockNumber}
                        onChange={(e) => setBlockNumber(e.target.value)}
                        style={inputStyle(false)}
                        onFocus={(e) => {
                          e.target.style.borderColor = PURPLE;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(0,0,0,0.12)';
                        }}
                      />
                    </div>

                    {/* Parcel Number */}
                    <div>
                      <label
                        className="block text-[11px] font-semibold mb-1"
                        style={labelStyle}
                      >
                        {t('חלקה', 'Parcel Number')}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder={t('מספר חלקה', 'Parcel #')}
                        value={parcelNumber}
                        onChange={(e) => setParcelNumber(e.target.value)}
                        style={inputStyle(false)}
                        onFocus={(e) => {
                          e.target.style.borderColor = PURPLE;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(0,0,0,0.12)';
                        }}
                      />
                    </div>

                    {/* Plot Width */}
                    <div>
                      <label
                        className="block text-[11px] font-semibold mb-1"
                        style={labelStyle}
                      >
                        {t('רוחב מגרש (מ\')', 'Plot Width (m)')}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder={t('מטרים', 'meters')}
                        value={plotWidthRaw}
                        onChange={(e) =>
                          setPlotWidthRaw(commaFormat(e.target.value))
                        }
                        style={inputStyle(false)}
                        onFocus={(e) => {
                          e.target.style.borderColor = PURPLE;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(0,0,0,0.12)';
                        }}
                      />
                    </div>

                    {/* Apartments Per Floor */}
                    <div>
                      <label
                        className="block text-[11px] font-semibold mb-1"
                        style={labelStyle}
                      >
                        {t('דירות בקומה', 'Apartments Per Floor')}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder="7"
                        value={aptsPerFloorRaw}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d]/g, '');
                          setAptsPerFloorRaw(v);
                          setHasCalculated(false);
                        }}
                        style={inputStyle(false)}
                        onFocus={(e) => {
                          e.target.style.borderColor = PURPLE;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(0,0,0,0.12)';
                        }}
                      />
                    </div>
                  </div>

                  {/* Corner Plot Toggle */}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => setIsCornerPlot(!isCornerPlot)}
                      className="flex items-center gap-2 cursor-pointer bg-transparent border-0 text-xs font-medium"
                      style={{ color: '#4a4a6a' }}
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center transition-all"
                        style={{
                          background: isCornerPlot ? PURPLE : 'rgba(0,0,0,0.06)',
                          border: `1px solid ${
                            isCornerPlot ? PURPLE : 'rgba(0,0,0,0.15)'
                          }`,
                        }}
                      >
                        {isCornerPlot && (
                          <Check className="w-3 h-3" style={{ color: '#fff' }} />
                        )}
                      </div>
                      {t('מגרש פינתי', 'Corner Plot')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Calculate Button ── */}
            <button
              onClick={handleCalculate}
              disabled={!formValid || isComputing}
              className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer border-0 transition-all flex items-center justify-center gap-2"
              style={{
                background:
                  formValid && !isComputing
                    ? `linear-gradient(135deg, ${PURPLE}, #7c3aed)`
                    : 'rgba(0,0,0,0.08)',
                color: formValid && !isComputing ? '#fff' : '#9ca3af',
                boxShadow:
                  formValid && !isComputing
                    ? `0 4px 20px ${PURPLE}40`
                    : 'none',
                opacity: isComputing ? 0.7 : 1,
              }}
            >
              <Calculator className="w-4 h-4" />
              {isComputing
                ? t('מחשב...', 'Computing...')
                : t('חשב זכויות', 'Calculate Rights')}
            </button>
          </div>

          {/* ── Computing State ── */}
          {isComputing && (
            <div className="px-6 sm:px-8 pb-8">
              <div
                className="rounded-xl p-8 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)',
                  border: '1px solid rgba(167,139,250,0.2)',
                }}
              >
                {/* Shimmer bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }}
                />
                {/* Scan line */}
                <div className="scan-line" />

                <div className="relative z-10">
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{
                      background: `${PURPLE}15`,
                      border: `2px solid ${PURPLE}40`,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  >
                    <Building2 className="w-7 h-7" style={{ color: PURPLE }} />
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: '#F8FAFD' }}
                  >
                    {t(
                      'מנתח זכויות בנייה...',
                      'Analyzing Building Rights...'
                    )}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: '#7D8590' }}>
                    {t(
                      'מחשב לפי תב"ע 416-1060052 | כיסוי, מקדם בנייה, בונוסים וניכויים',
                      'Computing per Plan 416-1060052 | Coverage, coefficient, bonuses & deductions'
                    )}
                  </p>
                  <div className="flex items-center justify-center gap-6 text-[10px]" style={{ color: '#525A65' }}>
                    <span className="flex items-center gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: PURPLE,
                          animation:
                            'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                      {t('שטחים ומקדמים', 'Areas & coefficients')}
                    </span>
                    <span className="flex items-center gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: '#3FB950',
                          animation:
                            'pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                      {t('תמהיל דירות', 'Apartment mix')}
                    </span>
                    <span className="flex items-center gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: '#D29922',
                          animation:
                            'pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                      {t('חניה ותשתיות', 'Parking & infrastructure')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Results Dashboard ── */}
          {calc && !isComputing && (
            <>
              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                  margin: '0 24px',
                }}
              />

              {/* ── Section A — Key Results ── */}
              <div className="p-6 sm:p-8 fade-in-up">
                <SectionHeader
                  icon={Calculator}
                  title={t('תוצאות ראשיות', 'Key Results')}
                  subtitle={t(
                    'סיכום זכויות בנייה לפי התב"ע',
                    'Building rights summary per zoning plan'
                  )}
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    label={t('סה"כ זכויות בנייה', 'Total Building Rights')}
                    value={fmtNum(Math.round(calc.totalRights))}
                    unit={t('מ"ר', 'sqm')}
                    icon={Building2}
                    highlight
                  />
                  <MetricCard
                    label={t('יחידות דיור מרביות', 'Max Housing Units')}
                    value={fmtNum(calc.maxUnits)}
                    unit={t('דירות', 'units')}
                    icon={Home}
                  />
                  <MetricCard
                    label={t('קומות מרביות', 'Max Floors Allowed')}
                    value={fmtNum(calc.maxFloors)}
                    unit={t('קומות (כולל קרקע + מרתף)', 'floors (incl. ground + basement)')}
                    icon={Layers}
                  />
                  <MetricCard
                    label={t('שטח בניה נטו', 'Net Buildable Area')}
                    value={fmtNum(Math.round(calc.netBuildableArea))}
                    unit={t('מ"ר', 'sqm')}
                    icon={Ruler}
                  />
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                  margin: '0 24px',
                }}
              />

              {/* ── Section B — Calculation Breakdown ── */}
              <div className="p-6 sm:p-8 fade-in-up" style={{ animationDelay: '0.1s' }}>
                <SectionHeader
                  icon={Info}
                  title={t('פירוט החישוב', 'Calculation Breakdown')}
                  subtitle={t(
                    'שלב אחר שלב — מהבסיס ועד הסיכום',
                    'Step by step — from base to total'
                  )}
                />
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: 'rgba(0,0,0,0.04)',
                          borderBottom: '1px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        <th
                          className="text-start px-4 py-2.5 text-[11px] font-semibold"
                          style={{ color: '#6b7280' }}
                        >
                          {t('פריט', 'Item')}
                        </th>
                        <th
                          className="text-start px-4 py-2.5 text-[11px] font-semibold"
                          style={{ color: '#6b7280' }}
                        >
                          {t('נוסחה', 'Formula')}
                        </th>
                        <th
                          className="text-start px-4 py-2.5 text-[11px] font-semibold"
                          style={{ color: '#6b7280' }}
                        >
                          {t('תוצאה (מ"ר)', 'Result (sqm)')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: t('אחוז כיסוי', 'Coverage %'),
                          formula: t(
                            `שטח ${plotArea <= 2000 ? '≤' : '>'} 2,000 מ"ר → ${
                              calc.coveragePercentage * 100
                            }%`,
                            `Area ${plotArea <= 2000 ? '≤' : '>'} 2,000 sqm → ${
                              calc.coveragePercentage * 100
                            }%`
                          ),
                          value: `${calc.coveragePercentage * 100}%`,
                          isMeta: true,
                        },
                        {
                          label: t('מקדם בנייה', 'Building Coefficient'),
                          formula: t(
                            `${existingFloors} קומות → ${calc.buildingCoefficient}`,
                            `${existingFloors} floors → ${calc.buildingCoefficient}`
                          ),
                          value: `${calc.buildingCoefficient}`,
                          isMeta: true,
                        },
                        {
                          label: t('זכויות בסיס', 'Base Rights'),
                          formula: `${fmtNum(plotArea)} × ${
                            calc.coveragePercentage * 100
                          }% × ${calc.buildingCoefficient}`,
                          value: fmtNum(Math.round(calc.baseRights)),
                        },
                        {
                          label: t('בונוס מרפסות גג (5%)', 'Rooftop Bonus (5%)'),
                          formula: `${fmtNum(Math.round(calc.baseRights))} × 5%`,
                          value: fmtNum(Math.round(calc.rooftopBonus)),
                        },
                        {
                          label: t('שטחים משותפים', 'Shared Spaces'),
                          formula: t('קבוע — 50 מ"ר', 'Fixed — 50 sqm'),
                          value: fmtNum(calc.sharedSpaces),
                        },
                        {
                          label: t('שטחים לצורכי ציבור', 'Public Use Spaces'),
                          formula:
                            plotArea > 2000
                              ? t('שטח > 2,000 מ"ר → 450 מ"ר', 'Area > 2,000 sqm → 450 sqm')
                              : t('שטח ≤ 2,000 מ"ר → 0', 'Area ≤ 2,000 sqm → 0'),
                          value: fmtNum(calc.publicUseSpaces),
                        },
                        {
                          label: t('סה"כ זכויות בנייה', 'Total Building Rights'),
                          formula: t(
                            'בסיס + מרפסות + משותפים + ציבור',
                            'Base + Rooftop + Shared + Public'
                          ),
                          value: fmtNum(Math.round(calc.totalRights)),
                          isTotal: true,
                        },
                      ].map((row, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            background: row.isTotal
                              ? `${PURPLE}08`
                              : 'transparent',
                          }}
                        >
                          <td
                            className="px-4 py-2.5"
                            style={{
                              fontWeight: row.isTotal ? 700 : 500,
                              color: row.isTotal ? PURPLE : '#1a1a2e',
                            }}
                          >
                            {row.label}
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{
                              fontFamily: "'Space Grotesk', monospace",
                              fontSize: '12px',
                              color: '#6b7280',
                            }}
                          >
                            {row.formula}
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{
                              fontFamily: "'Space Grotesk', monospace",
                              fontWeight: row.isTotal ? 800 : 600,
                              color: row.isTotal ? PURPLE : '#1a1a2e',
                            }}
                          >
                            {row.isMeta ? row.value : `${row.value}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                  margin: '0 24px',
                }}
              />

              {/* ── Section C — Deductions ── */}
              <div className="p-6 sm:p-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
                <SectionHeader
                  icon={AlertTriangle}
                  title={t(
                    'ניכויים (לא בזכויות)',
                    'Deductions (Not in Rights)'
                  )}
                  subtitle={t(
                    'שטחים שאינם נכללים בזכויות הבנייה',
                    'Areas not included in building rights'
                  )}
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: t('מרפסות', 'Balconies'),
                      formula: `${aptsPerFloor} × ${calc.numFloors} × 15`,
                      value: calc.balconiesDeduction,
                    },
                    {
                      label: t('חדרי כביסה', 'Laundry Rooms'),
                      formula: t('קבוע — 14 מ"ר', 'Fixed — 14 sqm'),
                      value: calc.laundryDeduction,
                    },
                    {
                      label: t('מרחבים וניכויים', 'Spaces & Deductions'),
                      formula: t('קבוע — 120 מ"ר', 'Fixed — 120 sqm'),
                      value: calc.spacesDeduction,
                    },
                    {
                      label: t('סה"כ ניכויים', 'Total Deductions'),
                      formula: '',
                      value: calc.totalDeductions,
                      isTotal: true,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg"
                      style={{
                        background: item.isTotal
                          ? 'rgba(239,68,68,0.06)'
                          : 'rgba(0,0,0,0.03)',
                        border: item.isTotal
                          ? '1px solid rgba(239,68,68,0.15)'
                          : '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <div
                        className="text-[10px] font-semibold mb-1"
                        style={{ color: '#6b7280' }}
                      >
                        {item.label}
                      </div>
                      {item.formula && (
                        <div
                          className="text-[10px] mb-1.5"
                          style={{
                            fontFamily: "'Space Grotesk', monospace",
                            color: '#9ca3af',
                          }}
                        >
                          {item.formula}
                        </div>
                      )}
                      <div
                        className="text-lg font-bold"
                        style={{
                          fontFamily: "'Space Grotesk', monospace",
                          color: item.isTotal ? '#ef4444' : '#1a1a2e',
                        }}
                      >
                        {fmtNum(item.value)}{' '}
                        <span className="text-[10px] font-normal" style={{ color: '#9ca3af' }}>
                          {t('מ"ר', 'sqm')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                  margin: '0 24px',
                }}
              />

              {/* ── Section D — Apartment Mix ── */}
              <div className="p-6 sm:p-8 fade-in-up" style={{ animationDelay: '0.3s' }}>
                <SectionHeader
                  icon={Users}
                  title={t('תמהיל דירות מוצע', 'Suggested Apartment Mix')}
                  subtitle={t(
                    'לפי דרישות התב"ע לדירות קטנות ובינוניות',
                    'Per zoning requirements for small and medium apartments'
                  )}
                />
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: 'rgba(0,0,0,0.04)',
                          borderBottom: '1px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        <th
                          className="text-start px-4 py-2.5 text-[11px] font-semibold"
                          style={{ color: '#6b7280' }}
                        >
                          {t('סוג', 'Type')}
                        </th>
                        <th
                          className="text-start px-4 py-2.5 text-[11px] font-semibold"
                          style={{ color: '#6b7280' }}
                        >
                          {t('כמות', 'Count')}
                        </th>
                        <th
                          className="text-start px-4 py-2.5 text-[11px] font-semibold"
                          style={{ color: '#6b7280' }}
                        >
                          {t('גודל ממוצע', 'Avg Size')}
                        </th>
                        <th
                          className="text-start px-4 py-2.5 text-[11px] font-semibold"
                          style={{ color: '#6b7280' }}
                        >
                          {t('שטח כולל', 'Total Area')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          type: t('קטנות (≤3 חדרים)', 'Small (≤3 rooms)'),
                          count: calc.smallUnits,
                          avg: 65,
                          total: calc.smallArea,
                          pct: '30%',
                        },
                        {
                          type: t('בינוניות (4 חדרים)', 'Medium (4 rooms)'),
                          count: calc.mediumUnits,
                          avg: 95,
                          total: calc.mediumArea,
                          pct: '40%',
                        },
                        {
                          type: t('גדולות (5 חדרים)', 'Large (5 rooms)'),
                          count: calc.largeUnits,
                          avg: 115,
                          total: calc.largeArea,
                          pct: '20%',
                        },
                        {
                          type: t('פנטהאוזים', 'Penthouses'),
                          count: calc.penthouseUnits,
                          avg: 90,
                          total: calc.penthouseArea,
                          pct: '10%',
                        },
                      ].map((row, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                          }}
                        >
                          <td className="px-4 py-2.5 font-medium" style={{ color: '#1a1a2e' }}>
                            {row.type}
                            <span
                              className="text-[10px] mr-1.5"
                              style={{ color: '#9ca3af' }}
                            >
                              ({row.pct})
                            </span>
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{
                              fontFamily: "'Space Grotesk', monospace",
                              fontWeight: 600,
                              color: '#1a1a2e',
                            }}
                          >
                            {fmtNum(row.count)}
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{
                              fontFamily: "'Space Grotesk', monospace",
                              color: '#6b7280',
                            }}
                          >
                            ~{row.avg} {t('מ"ר', 'sqm')}
                          </td>
                          <td
                            className="px-4 py-2.5"
                            style={{
                              fontFamily: "'Space Grotesk', monospace",
                              fontWeight: 600,
                              color: PURPLE,
                            }}
                          >
                            {fmtNum(row.total)} {t('מ"ר', 'sqm')}
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr
                        style={{
                          borderTop: '2px solid rgba(0,0,0,0.08)',
                          background: `${PURPLE}06`,
                        }}
                      >
                        <td
                          className="px-4 py-2.5 font-bold"
                          style={{ color: '#1a1a2e' }}
                        >
                          {t('סה"כ', 'Total')}
                        </td>
                        <td
                          className="px-4 py-2.5 font-bold"
                          style={{
                            fontFamily: "'Space Grotesk', monospace",
                            color: '#1a1a2e',
                          }}
                        >
                          {fmtNum(
                            calc.smallUnits +
                              calc.mediumUnits +
                              calc.largeUnits +
                              calc.penthouseUnits
                          )}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: '#9ca3af' }}>
                          —
                        </td>
                        <td
                          className="px-4 py-2.5 font-bold"
                          style={{
                            fontFamily: "'Space Grotesk', monospace",
                            color: PURPLE,
                          }}
                        >
                          {fmtNum(
                            calc.smallArea +
                              calc.mediumArea +
                              calc.largeArea +
                              calc.penthouseArea
                          )}{' '}
                          {t('מ"ר', 'sqm')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Small apartment note */}
                <div
                  className="mt-3 flex items-start gap-2 p-3 rounded-lg"
                  style={{
                    background: `${PURPLE}08`,
                    border: `1px solid ${PURPLE}15`,
                  }}
                >
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: PURPLE }} />
                  <p className="text-[11px]" style={{ color: '#4a4a6a' }}>
                    {t(
                      'לפי דרישות התב"ע, 25%-35% מסך הדירות חייבות להיות דירות קטנות (עד 3 חדרים).',
                      'Per zoning requirements, 25%-35% of total units must be small apartments (up to 3 rooms).'
                    )}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                  margin: '0 24px',
                }}
              />

              {/* ── Section E — Parking ── */}
              <div className="p-6 sm:p-8 fade-in-up" style={{ animationDelay: '0.4s' }}>
                <SectionHeader
                  icon={Car}
                  title={t('חניה', 'Parking')}
                  subtitle={t(
                    'תקן חניה — טבעת 2',
                    'Parking standard — Ring zone 2'
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="p-5 rounded-lg"
                    style={{
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div
                      className="text-[10px] font-semibold mb-1"
                      style={{ color: '#6b7280' }}
                    >
                      {t('מקומות חניה נדרשים', 'Required Parking Spaces')}
                    </div>
                    <div
                      className="text-[10px] mb-2"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: '#9ca3af',
                      }}
                    >
                      {t(
                        '1 מקום חניה ליחידת דיור (טבעת 2)',
                        '1 parking space per housing unit (ring 2)'
                      )}
                    </div>
                    <div
                      className="text-3xl font-black"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: '#1a1a2e',
                      }}
                    >
                      {fmtNum(calc.parkingSpaces)}
                      <span
                        className="text-sm font-normal mr-1"
                        style={{ color: '#9ca3af' }}
                      >
                        {t(' מקומות', ' spaces')}
                      </span>
                    </div>
                  </div>

                  <div
                    className="p-5 rounded-lg"
                    style={{
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div
                      className="text-[10px] font-semibold mb-1"
                      style={{ color: '#6b7280' }}
                    >
                      {t(
                        'קומות חניה תת-קרקעיות (הערכה)',
                        'Underground Parking Levels (estimate)'
                      )}
                    </div>
                    <div
                      className="text-[10px] mb-2"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: '#9ca3af',
                      }}
                    >
                      {t(
                        'עד 5 קומות, 85% כיסוי',
                        'Up to 5 levels, 85% coverage'
                      )}
                    </div>
                    <div
                      className="text-3xl font-black"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: '#1a1a2e',
                      }}
                    >
                      {calc.undergroundLevels}
                      <span
                        className="text-sm font-normal mr-1"
                        style={{ color: '#9ca3af' }}
                      >
                        {t(' קומות', ' levels')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                  margin: '0 24px',
                }}
              />

              {/* ── Section F — Disclaimer ── */}
              <div className="px-6 sm:px-8 py-6 fade-in-up" style={{ animationDelay: '0.5s' }}>
                <div
                  className="p-4 rounded-lg flex items-start gap-3"
                  style={{
                    background: 'rgba(210,153,34,0.06)',
                    border: '1px solid rgba(210,153,34,0.15)',
                  }}
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: '#D29922' }}
                  />
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: '#6b7280' }}
                  >
                    {t(
                      'חישוב זה מבוסס על תב"ע 416-1060052 (רע/רע/ב). לקבלת חוות דעת מקצועית מדויקת, נא להתייעץ עם אדריכל/שמאי.',
                      'This calculation is based on zoning plan 416-1060052 (Ra/Ra/B). For precise professional opinion, consult an architect/appraiser.'
                    )}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                  margin: '0 24px',
                }}
              />

              {/* ── CTA ── */}
              <div className="p-6 sm:p-8 text-center fade-in-up" style={{ animationDelay: '0.6s' }}>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: '#1a1a2e' }}
                >
                  {t(
                    'רוצים ניתוח מקצועי מלא?',
                    'Want a full professional analysis?'
                  )}
                </h3>
                <p
                  className="text-xs mb-4 max-w-md mx-auto"
                  style={{ color: '#6b7280' }}
                >
                  {t(
                    'צוות המומחים שלנו יכין עבורכם דו"ח היתכנות מפורט הכולל ניתוח כלכלי, תמהיל אופטימלי וליווי מול הרשויות.',
                    'Our expert team will prepare a detailed feasibility report including economic analysis, optimal mix, and regulatory guidance.'
                  )}
                </p>
                <a
                  href="/booking"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`,
                    color: '#fff',
                    boxShadow: `0 4px 20px ${PURPLE}40`,
                    textDecoration: 'none',
                  }}
                >
                  <Calculator className="w-4 h-4" />
                  {t('קבעו פגישת ייעוץ', 'Book a Consultation')}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </>
          )}

          {/* ── Empty State (before calculation) ── */}
          {!calc && !isComputing && (
            <div className="p-10 text-center">
              <Building2
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: '#d1d5db', opacity: 0.5 }}
              />
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {t(
                  'הזן שטח מגרש ומספר קומות קיימות כדי לחשב זכויות בנייה',
                  'Enter plot area and existing floors to calculate building rights'
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto"
        style={{ background: 'rgba(13,17,23,0.9)' }}
      >
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>
          {t(
            'מחשבון זכויות בנייה — תב"ע רע/רע/ב',
            'Building Rights Calculator — Ra/Ra/B Plan'
          )}
        </span>
      </div>
    </div>
  );
}
