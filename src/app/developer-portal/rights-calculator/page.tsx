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
  return Math.round(n).toLocaleString('he-IL');
}

function fmtDec(n: number, decimals = 1): string {
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(n * factor) / factor;
  return rounded.toLocaleString('he-IL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ── City configuration ───────────────────────────────────────

interface CityConfig {
  nameHe: string;
  nameEn: string;
  tabaLabel: string;
  tabaLabelEn: string;
  tabaNumber: string;
}

const CITY_OPTIONS: Record<string, CityConfig> = {
  'רעננה': {
    nameHe: 'רעננה',
    nameEn: "Ra'anana",
    tabaLabel: 'תב"ע רע/רע/ב',
    tabaLabelEn: 'Ra/Ra/B Plan',
    tabaNumber: '416-1060052',
  },
};

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
  coverageArea: number;
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
  misetorDeduction: number;
  spacesDeduction: number;
  storageDeduction: number;
  undergroundParkingArea: number;
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
  parkingAreaTotal: number;
  // Extra: existing building info
  existingBuildArea: number;
  newAddedArea: number;
  // Constraint flag
  constraintReduction: number;
}

// ── Component ────────────────────────────────────────────────

export default function RightsCalculatorPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const isHe = lang === 'he';

  // ── Mandatory inputs ──
  const [selectedCity, setSelectedCity] = useState('רעננה');
  const [addressRaw, setAddressRaw] = useState('');
  const [plotAreaRaw, setPlotAreaRaw] = useState('');
  const [existingFloorsRaw, setExistingFloorsRaw] = useState('');

  // ── City-derived config ──
  const cityConfig = CITY_OPTIONS[selectedCity] || CITY_OPTIONS['רעננה'];

  // ── Optional inputs ──
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [blockNumber, setBlockNumber] = useState('');
  const [parcelNumber, setParcelNumber] = useState('');
  const [plotWidthRaw, setPlotWidthRaw] = useState('');
  const [aptsPerFloorRaw, setAptsPerFloorRaw] = useState('');
  const [existingAptsRaw, setExistingAptsRaw] = useState('');
  const [existingPenthousesRaw, setExistingPenthousesRaw] = useState('');
  const [typicalFloorAreaRaw, setTypicalFloorAreaRaw] = useState('');
  const [isCornerPlot, setIsCornerPlot] = useState(false);
  const [mergeWithAdjacent, setMergeWithAdjacent] = useState(false);
  const [hasSpecialConstraint, setHasSpecialConstraint] = useState(false);

  // ── Calculation state ──
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  // ── Parsed values ──
  const plotArea = parseNum(plotAreaRaw);
  const existingFloors = parseInt(existingFloorsRaw, 10) || 0;
  const aptsPerFloor = parseInt(aptsPerFloorRaw, 10) || 7;
  const existingApts = parseInt(existingAptsRaw, 10) || 0;
  const existingPenthouses = parseInt(existingPenthousesRaw, 10) || 0;
  const typicalFloorArea = parseNum(typicalFloorAreaRaw) || 0;

  // ── Validation ──
  const plotAreaValid = plotArea >= 100 && plotArea <= 10000;
  const floorsValid = existingFloors >= 1 && existingFloors <= 10;
  const plotAreaTouched = plotAreaRaw.length > 0;
  const floorsTouched = existingFloorsRaw.length > 0;
  const formValid = plotAreaValid && floorsValid;

  // ── Calculation engine (useMemo) — TABA 416-1060052 precise ──
  const calc: CalcResult | null = useMemo(() => {
    if (!hasCalculated || !formValid) return null;

    const plotDunam = plotArea / 1000;

    // Step 1 — Coverage Percentage (§ coverage rules)
    // ≤2 dunam → 55%, >2 dunam → 50%
    const coveragePercentage = plotArea <= 2000 ? 0.55 : 0.50;
    const coverageArea = plotArea * coveragePercentage;

    // Step 2 — Building Coefficient (§ coefficient table)
    // 1fl→5.5, 2fl→6.5, 3fl→7.5, 4fl→8.5, 5fl→9.5, 6+→10.5
    const buildingCoefficient = getBuildingCoefficient(existingFloors);

    // Step 3 — Base Rights = Plot Area × Coverage% × Coefficient
    const baseRights = plotArea * coveragePercentage * buildingCoefficient;

    // Step 4 — Bonuses
    // Rooftop balconies: 5% of base rights (not included in base)
    const rooftopBonus = baseRights * 0.05;
    // Shared spaces: fixed 50 sqm
    const sharedSpaces = 50;
    // Public use: 450 sqm only if plot > 2 dunam
    const publicUseSpaces = plotArea > 2000 ? 450 : 0;

    // Step 5 — Total Building Rights
    let totalRights = baseRights + rooftopBonus + sharedSpaces + publicUseSpaces;

    // Special constraint reduction (preservation/protected tree/infrastructure): -5%
    const constraintReduction = hasSpecialConstraint ? totalRights * 0.05 : 0;
    totalRights -= constraintReduction;

    // Step 6 — Max Units = plot dunam × 45
    const maxUnits = Math.floor(plotDunam * 45);

    // Step 7 — Max Floors: coefficient determines above-ground floors
    // Formula: ground floor + (coefficient rounded) residential floors + rooftop/technical
    const numFloors = Math.round(buildingCoefficient);
    const maxFloors = numFloors + 2; // +1 ground/pilotis + 1 rooftop/technical

    // Step 8 — Practical Deductions (not counted in building rights)
    // Balconies: max 14 sqm per apartment (per TABA), so per floor: aptsPerFloor × 14
    const balconiesPerApt = 14; // max 14 sqm per apartment
    const balconiesDeduction = aptsPerFloor * numFloors * balconiesPerApt;
    // Misetor (service/AC hideout): 3.5 sqm per apartment
    const misetorDeduction = aptsPerFloor * numFloors * 3.5;
    // Spaces & deductions (lobbies, stairs, shafts, walls): estimated
    // More precise: ~18% of typical floor area × numFloors for circulation
    const typFloor = typicalFloorArea > 0 ? typicalFloorArea : coverageArea;
    const spacesDeduction = Math.round(typFloor * 0.18 * numFloors / numFloors) * numFloors;
    // Storage rooms: 6 sqm per unit
    const storageDeduction = maxUnits * 6;
    // Underground parking area: 55 sqm per space (including circulation)
    const parkingSpaces = maxUnits; // 1 space per unit (Ring 2)
    const parkingAreaPerSpace = 55; // sqm per space including ramps/circulation
    const parkingAreaTotal = parkingSpaces * parkingAreaPerSpace;
    const parkingPerLevel = plotArea * 0.85; // 85% max underground coverage
    const undergroundLevels = Math.min(
      Math.ceil(parkingAreaTotal / parkingPerLevel),
      5
    );
    const undergroundParkingArea = parkingAreaTotal;

    const totalDeductions = balconiesDeduction + misetorDeduction + spacesDeduction + storageDeduction;
    const netBuildableArea = totalRights - totalDeductions;

    // Existing building area estimation
    const existingBuildArea = existingApts > 0 && typicalFloorArea > 0
      ? typicalFloorArea * existingFloors
      : (typicalFloorArea > 0 ? typicalFloorArea * existingFloors : coverageArea * existingFloors * 0.85);
    const newAddedArea = totalRights - existingBuildArea;

    // Step 9 — Apartment Mix (TABA requires 25-35% small ≤3 rooms)
    const smallPct = 0.30; // 30% target (within 25-35% range)
    const smallUnits = Math.round(maxUnits * smallPct);
    const penthouseUnits = existingPenthouses > 0 ? existingPenthouses : Math.max(Math.round(maxUnits * 0.05), 1);
    const remainingAfterSmallPH = maxUnits - smallUnits - penthouseUnits;
    const mediumUnits = Math.round(remainingAfterSmallPH * 0.55);
    const largeUnits = Math.max(remainingAfterSmallPH - mediumUnits, 0);

    const smallArea = smallUnits * 65;
    const mediumArea = mediumUnits * 95;
    const largeArea = largeUnits * 115;
    const penthouseArea = penthouseUnits * 130;

    return {
      coveragePercentage,
      coverageArea,
      buildingCoefficient,
      baseRights,
      rooftopBonus,
      sharedSpaces,
      publicUseSpaces,
      totalRights,
      maxUnits,
      maxFloors,
      balconiesDeduction,
      misetorDeduction,
      spacesDeduction,
      storageDeduction,
      undergroundParkingArea,
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
      parkingAreaTotal,
      existingBuildArea,
      newAddedArea,
      constraintReduction,
    };
  }, [hasCalculated, formValid, plotArea, existingFloors, aptsPerFloor, existingApts, existingPenthouses, typicalFloorArea, hasSpecialConstraint]);

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
    // Brief animation flash
    setTimeout(() => {
      setIsComputing(false);
      setHasCalculated(true);
    }, 200);
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
            <a href="/" className="flex items-center gap-2 no-underline text-inherit hover:opacity-80 transition-opacity">
              <Building2 className="w-4 h-4" style={{ color: PURPLE }} />
              <span className="font-bold text-sm">PROPCHECK</span>
            </a>
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
              `מחשבון זכויות בנייה — ${cityConfig.tabaLabel}`,
              `Building Rights Calculator — ${cityConfig.tabaLabelEn}`
            )}
          </h1>
          <p className="text-sm text-foreground-muted max-w-xl mx-auto">
            {t(
              `תב"ע ${cityConfig.tabaNumber} | התחדשות עירונית ${cityConfig.nameHe} | אושרה 25.02.2025`,
              `Zoning Plan ${cityConfig.tabaNumber} | ${cityConfig.nameEn} Urban Renewal | Approved 25.02.2025`
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
            {/* Primary Inputs — Row 1: City + Plot Area */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              {/* City */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={labelStyle}
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {t('עיר', 'City')}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => { setSelectedCity(e.target.value); setHasCalculated(false); }}
                  style={{
                    ...inputStyle(false),
                    cursor: 'pointer',
                    appearance: 'auto' as React.CSSProperties['appearance'],
                  }}
                  onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                >
                  {Object.entries(CITY_OPTIONS).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {isHe ? cfg.nameHe : cfg.nameEn}
                    </option>
                  ))}
                </select>
              </div>

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

            {/* Primary Inputs — Row 2: Address */}
            <div className="mb-6">
              <label
                className="block text-xs font-semibold mb-1.5"
                style={labelStyle}
              >
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  {t('כתובת', 'Address')}
                </span>
              </label>
              <input
                type="text"
                dir={isHe ? 'rtl' : 'ltr'}
                placeholder={t('לדוגמה: הר סיני 22 רעננה', 'e.g. Har Sinai 22, Raanana')}
                value={addressRaw}
                onChange={(e) => setAddressRaw(e.target.value)}
                style={inputStyle(false)}
                onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
              />
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
                      <label className="block text-[11px] font-semibold mb-1" style={labelStyle}>
                        {t('גוש', 'Block Number')}
                      </label>
                      <input
                        type="text" dir="ltr"
                        placeholder={t('מספר גוש', 'Block #')}
                        value={blockNumber}
                        onChange={(e) => setBlockNumber(e.target.value)}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>

                    {/* Parcel Number */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={labelStyle}>
                        {t('חלקה', 'Parcel Number')}
                      </label>
                      <input
                        type="text" dir="ltr"
                        placeholder={t('מספר חלקה', 'Parcel #')}
                        value={parcelNumber}
                        onChange={(e) => setParcelNumber(e.target.value)}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>

                    {/* Plot Width */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={labelStyle}>
                        {t('רוחב מגרש (מ\')', 'Plot Width (m)')}
                      </label>
                      <input
                        type="text" inputMode="numeric" dir="ltr"
                        placeholder={t('מטרים', 'meters')}
                        value={plotWidthRaw}
                        onChange={(e) => setPlotWidthRaw(commaFormat(e.target.value))}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>

                    {/* Apartments Per Floor */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={labelStyle}>
                        {t('דירות בקומה', 'Apartments Per Floor')}
                      </label>
                      <input
                        type="text" inputMode="numeric" dir="ltr"
                        placeholder="7"
                        value={aptsPerFloorRaw}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d]/g, '');
                          setAptsPerFloorRaw(v);
                          setHasCalculated(false);
                        }}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>
                  </div>

                  {/* Row 2: New fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* Existing Apartments */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={labelStyle}>
                        {t('דירות קיימות בבניין', 'Existing Apartments')}
                      </label>
                      <input
                        type="text" inputMode="numeric" dir="ltr"
                        placeholder={t('לדוגמה: 16', 'e.g. 16')}
                        value={existingAptsRaw}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d]/g, '');
                          setExistingAptsRaw(v);
                          setHasCalculated(false);
                        }}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>

                    {/* Existing Penthouses */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={labelStyle}>
                        {t('מספר דירות גג קיימות', 'Existing Penthouses')}
                      </label>
                      <input
                        type="text" inputMode="numeric" dir="ltr"
                        placeholder={t('לדוגמה: 2', 'e.g. 2')}
                        value={existingPenthousesRaw}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d]/g, '');
                          setExistingPenthousesRaw(v);
                          setHasCalculated(false);
                        }}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>

                    {/* Typical Floor Area */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={labelStyle}>
                        {t('שטח טיפוסי קומה רגילה (מ"ר)', 'Typical Floor Area (sqm)')}
                      </label>
                      <input
                        type="text" inputMode="numeric" dir="ltr"
                        placeholder={t('לדוגמה: 200', 'e.g. 200')}
                        value={typicalFloorAreaRaw}
                        onChange={(e) => {
                          setTypicalFloorAreaRaw(commaFormat(e.target.value));
                          setHasCalculated(false);
                        }}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>
                  </div>

                  {/* Checkboxes row */}
                  <div className="mt-4 flex flex-wrap items-center gap-5">
                    {[
                      { state: isCornerPlot, setter: () => setIsCornerPlot(!isCornerPlot), label: t('מגרש פינתי', 'Corner Plot') },
                      { state: mergeWithAdjacent, setter: () => { setMergeWithAdjacent(!mergeWithAdjacent); setHasCalculated(false); }, label: t('כוונה לאיחוד עם חלקה סמוכה', 'Merge with Adjacent Plot') },
                      { state: hasSpecialConstraint, setter: () => { setHasSpecialConstraint(!hasSpecialConstraint); setHasCalculated(false); }, label: t('אילוץ מיוחד (שימור/עץ מוגן/תשתית)', 'Special Constraint (preservation/tree/infra)') },
                    ].map((cb, i) => (
                      <button
                        key={i}
                        onClick={cb.setter}
                        className="flex items-center gap-2 cursor-pointer bg-transparent border-0 text-xs font-medium"
                        style={{ color: '#4a4a6a' }}
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0"
                          style={{
                            background: cb.state ? PURPLE : 'rgba(0,0,0,0.06)',
                            border: `1px solid ${cb.state ? PURPLE : 'rgba(0,0,0,0.15)'}`,
                          }}
                        >
                          {cb.state && <Check className="w-3 h-3" style={{ color: '#fff' }} />}
                        </div>
                        {cb.label}
                      </button>
                    ))}
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
                      `מחשב לפי תב"ע ${cityConfig.tabaNumber} | כיסוי, מקדם בנייה, בונוסים וניכויים`,
                      `Computing per Plan ${cityConfig.tabaNumber} | Coverage, coefficient, bonuses & deductions`
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
                              Math.round(calc.coveragePercentage * 100)
                            }%`,
                            `Area ${plotArea <= 2000 ? '≤' : '>'} 2,000 sqm → ${
                              Math.round(calc.coveragePercentage * 100)
                            }%`
                          ),
                          value: `${Math.round(calc.coveragePercentage * 100)}%`,
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
                            Math.round(calc.coveragePercentage * 100)
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
                        ...(calc.constraintReduction > 0 ? [{
                          label: t('הפחתת אילוץ מיוחד (-5%)', 'Special Constraint (-5%)'),
                          formula: t('שימור / עץ מוגן / תשתית מגבילה', 'Preservation / tree / limiting infra'),
                          value: `-${fmtNum(Math.round(calc.constraintReduction))}`,
                        }] : []),
                        {
                          label: t('סה"כ זכויות בנייה', 'Total Building Rights'),
                          formula: t(
                            'בסיס + מרפסות + משותפים + ציבור' + (calc.constraintReduction > 0 ? ' - אילוץ' : ''),
                            'Base + Rooftop + Shared + Public' + (calc.constraintReduction > 0 ? ' - Constraint' : '')
                          ),
                          value: fmtNum(Math.round(calc.totalRights)),
                          isTotal: true,
                        },
                        ...(calc.existingBuildArea > 0 ? [{
                          label: t('שטח בנוי קיים (הערכה)', 'Existing Built Area (est.)'),
                          formula: `${existingFloors} ${t('קומות', 'floors')} × ${fmtNum(Math.round(calc.coverageArea * 0.85))} ${t('מ"ר', 'sqm')}`,
                          value: fmtNum(Math.round(calc.existingBuildArea)),
                          isMeta: true,
                        },
                        {
                          label: t('תוספת שטח חדש', 'New Added Area'),
                          formula: t('סה"כ זכויות - קיים', 'Total Rights - Existing'),
                          value: fmtNum(Math.round(calc.newAddedArea)),
                          isMeta: true,
                        }] : []),
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
                    'שטחים נוספים מעבר לזכויות',
                    'Additional Areas (Beyond Rights)'
                  )}
                  subtitle={t(
                    'שטחים המותרים מעבר לזכויות הבנייה העיקריות',
                    'Areas permitted beyond the main building rights'
                  )}
                />
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      label: t('מרפסות', 'Balconies'),
                      formula: `${aptsPerFloor} × ${calc.numFloors} × 14`,
                      value: calc.balconiesDeduction,
                    },
                    {
                      label: t('מסתור שירות / מזגן', 'Service/AC Hideout'),
                      formula: `${aptsPerFloor} × ${calc.numFloors} × 3.5`,
                      value: calc.misetorDeduction,
                    },
                    {
                      label: t('לובי, מדרגות, פירים', 'Lobbies, Stairs, Shafts'),
                      formula: `18% × ${fmtNum(Math.round(calc.coverageArea))} × ${calc.numFloors}`,
                      value: calc.spacesDeduction,
                    },
                    {
                      label: t('מחסנים', 'Storage Rooms'),
                      formula: `${calc.maxUnits} × 6 ${t('מ"ר', 'sqm')}`,
                      value: calc.storageDeduction,
                    },
                    ...(calc.constraintReduction > 0 ? [{
                      label: t('הפחתת אילוץ מיוחד (5%)', 'Special Constraint (-5%)'),
                      formula: t('שימור/עץ מוגן/תשתית', 'Preservation/tree/infra'),
                      value: Math.round(calc.constraintReduction),
                    }] : []),
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
                          pct: `${Math.round(calc.mediumUnits / calc.maxUnits * 100)}%`,
                        },
                        {
                          type: t('גדולות (5 חדרים)', 'Large (5 rooms)'),
                          count: calc.largeUnits,
                          avg: 115,
                          total: calc.largeArea,
                          pct: `${Math.round(calc.largeUnits / calc.maxUnits * 100)}%`,
                        },
                        {
                          type: t('פנטהאוזים', 'Penthouses'),
                          count: calc.penthouseUnits,
                          avg: 130,
                          total: calc.penthouseArea,
                          pct: `${Math.round(calc.penthouseUnits / calc.maxUnits * 100)}%`,
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
                        `עד 5 קומות, 85% כיסוי | ${fmtNum(calc.parkingAreaTotal)} מ"ר`,
                        `Up to 5 levels, 85% coverage | ${fmtNum(calc.parkingAreaTotal)} sqm`
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
                      `חישוב זה מבוסס על תב"ע ${cityConfig.tabaNumber} (${cityConfig.tabaLabel.replace('תב"ע ', '')}). לקבלת חוות דעת מקצועית מדויקת, נא להתייעץ עם אדריכל/שמאי.`,
                      `This calculation is based on zoning plan ${cityConfig.tabaNumber} (${cityConfig.tabaLabelEn}). For precise professional opinion, consult an architect/appraiser.`
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

              {/* ── Merge note ── */}
              {mergeWithAdjacent && (
                <div className="px-6 sm:px-8 pb-4 fade-in-up" style={{ animationDelay: '0.55s' }}>
                  <div className="p-4 rounded-lg flex items-start gap-3"
                    style={{ background: `${PURPLE}08`, border: `1px solid ${PURPLE}15` }}>
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: PURPLE }} />
                    <p className="text-[11px] leading-relaxed" style={{ color: '#4a4a6a' }}>
                      {t(
                        'סומן כוונה לאיחוד עם חלקה סמוכה. יש לחשב מחדש עם השטח המאוחד הכולל. איחוד חלקות עשוי לשנות את אחוז הכיסוי (מעל 2 דונם → 50%) ולאפשר שטחי ציבור נוספים.',
                        'Merge with adjacent plot is indicated. Recalculate with combined total area. Plot merger may change coverage % (above 2 dunam → 50%) and enable additional public spaces.'
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '0 24px' }} />

              {/* ── CTA: Economic Feasibility ── */}
              <div className="p-6 sm:p-8 text-center fade-in-up" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>
                  {t('המשך לניתוח כלכלי', 'Continue to Economic Analysis')}
                </h3>
                <p className="text-xs mb-4 max-w-md mx-auto" style={{ color: '#6b7280' }}>
                  {t(
                    'על בסיס חישוב הזכויות, הפק דו"ח היתכנות כלכלי מלא הכולל עלויות בנייה, הכנסות, מיסים, היטלים ורווחיות צפויה.',
                    'Based on the rights calculation, generate a full economic feasibility report including construction costs, revenue, taxes, levies, and projected profitability.'
                  )}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      // Store rights data in sessionStorage for the economic feasibility page
                      if (calc) {
                        sessionStorage.setItem('rightsCalcData', JSON.stringify({
                          city: selectedCity,
                          plotArea,
                          existingFloors,
                          existingApts,
                          existingPenthouses,
                          typicalFloorArea,
                          address: addressRaw,
                          blockNumber,
                          parcelNumber,
                          ...calc,
                        }));
                        window.location.href = '/developer-portal/economic-feasibility';
                      }
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-0"
                    style={{
                      background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`,
                      color: '#fff',
                      boxShadow: `0 4px 20px ${PURPLE}40`,
                    }}
                  >
                    <Calculator className="w-4 h-4" />
                    {t('ניתוח כדאיות כלכלית', 'Economic Feasibility')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="/booking"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.05)',
                      color: '#4a4a6a',
                      border: '1px solid rgba(0,0,0,0.1)',
                      textDecoration: 'none',
                    }}
                  >
                    {t('פגישת ייעוץ מקצועית', 'Professional Consultation')}
                  </a>
                </div>
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
            `מחשבון זכויות בנייה — ${cityConfig.tabaLabel}`,
            `Building Rights Calculator — ${cityConfig.tabaLabelEn}`
          )}
        </span>
      </div>
    </div>
  );
}
