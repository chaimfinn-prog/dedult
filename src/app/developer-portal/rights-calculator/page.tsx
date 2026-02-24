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
  Shield,
  Train,
  Ban,
  XCircle,
  Calendar,
  Hammer,
  Wrench,
  TreePine,
  Plane,
  Landmark,
  Zap,
  Scale,
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

// ── Statutory Decision Engine Types ──────────────────────────

type MetroZone = 'core_100m' | 'ring_1_300m' | 'ring_2_800m' | 'outside';
type RenewalTrack = 'none' | 'tama38_extension' | 'shaked_alternative';
type ProjectType = 'demolish_rebuild' | 'addition_existing';
type RedFlagSeverity = 'hard_block' | 'strong_risk' | 'attention';

interface RedFlag {
  code: string;
  severity: RedFlagSeverity;
  messageHe: string;
  messageEn: string;
  source: string;
}

interface RightsAlternative {
  name: string;
  nameEn: string;
  residentialSqm: number;
  publicBuiltSqm: number;
  serviceSqm: number;
  totalSqm: number;
  estimatedUnits: number | null;
  notesHe: string;
  notesEn: string;
  blocked: boolean;
  blockReasonHe?: string;
  blockReasonEn?: string;
}

interface OverrideContext {
  canBuildTama38: boolean;
  canBuildBaseline: boolean;
  canAddFloors: boolean;
  canAddUnits: boolean;
  nationalHeightCapM: number | null;
  nationalMaxFloors: number | null;
  renewalTrack: RenewalTrack;
  maxMultiplierCore: number;
  maxMultiplierPeriphery: number;
  publicBuiltShare: number;
}

interface StatutoryResult {
  metroZone: MetroZone;
  overrideContext: OverrideContext;
  alternatives: RightsAlternative[];
  redFlags: RedFlag[];
  areaModel: 'total_area' | 'principal_service';
}

// ── City Renewal Configuration (30+ Israeli cities) ─────────

interface CityRenewalConfig {
  track: RenewalTrack;
  coreMultiplier: number;
  peripheryMultiplier: number;
  publicShare: number;
}

const CITY_RENEWAL_CONFIG: Record<string, CityRenewalConfig> = {
  'תל אביב': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'תל אביב-יפו': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'רעננה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'ירושלים': { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.0, publicShare: 0.10 },
  'חיפה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'באר שבע': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.15 },
  'נתניה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'ראשון לציון': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'פתח תקוה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'אשדוד': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'הרצליה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'בת ים': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'חולון': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'רמת גן': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'גבעתיים': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'בני ברק': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'כפר סבא': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'הוד השרון': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'אשקלון': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'לוד': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'רמלה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'מודיעין': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'קריית אונו': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'עפולה': { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.5, publicShare: 0.10 },
  'צפת': { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.5, publicShare: 0.10 },
  'טבריה': { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.5, publicShare: 0.10 },
  'אילת': { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.5, publicShare: 0.10 },
};

const DEFAULT_RENEWAL_CONFIG: CityRenewalConfig = {
  track: 'tama38_extension',
  coreMultiplier: 3.5,
  peripheryMultiplier: 5.0,
  publicShare: 0.10,
};

// ── Metro Zone Classification ───────────────────────────────

function classifyMetroZone(distanceM: number | null): MetroZone {
  if (distanceM === null || distanceM < 0) return 'outside';
  if (distanceM <= 100) return 'core_100m';
  if (distanceM <= 300) return 'ring_1_300m';
  if (distanceM <= 800) return 'ring_2_800m';
  return 'outside';
}

function getMetroZoneLabel(zone: MetroZone, he: boolean): string {
  const labels: Record<MetroZone, [string, string]> = {
    core_100m: ['ליבה (0-100 מ\')', 'Core (0-100m)'],
    ring_1_300m: ['טבעת 1 (100-300 מ\')', 'Ring 1 (100-300m)'],
    ring_2_800m: ['טבעת 2 (300-800 מ\')', 'Ring 2 (300-800m)'],
    outside: ['מחוץ לטווח מטרו', 'Outside Metro Range'],
  };
  return he ? labels[zone][0] : labels[zone][1];
}

// ── Shaked Total Area Cutoff (Oct 30, 2025) ─────────────────

const SHAKED_TOTAL_AREA_CUTOFF = new Date('2025-10-30');

// ── Metro Levy Config ───────────────────────────────────────

const METRO_LEVY_RATE_PCT = 60;
const STANDARD_LEVY_RATE_PCT = 50;
const METRO_LEVY_START = new Date('2024-01-01');
const METRO_LEVY_END = new Date('2028-12-31');

// ── Severity colors and labels ──────────────────────────────

function getSeverityStyle(severity: RedFlagSeverity): { bg: string; border: string; text: string; icon: typeof Ban } {
  switch (severity) {
    case 'hard_block':
      return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#dc2626', icon: XCircle };
    case 'strong_risk':
      return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#d97706', icon: AlertTriangle };
    case 'attention':
      return { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: '#2563eb', icon: Info };
  }
}

function getSeverityLabel(severity: RedFlagSeverity, he: boolean): string {
  switch (severity) {
    case 'hard_block': return he ? 'חסימה מוחלטת' : 'Hard Block';
    case 'strong_risk': return he ? 'סיכון חמור' : 'Strong Risk';
    case 'attention': return he ? 'דגש תשומת לב' : 'Attention';
  }
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

  // ── Statutory Analysis inputs ──
  const [statutoryOpen, setStatutoryOpen] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>('demolish_rebuild');
  const [metroDistanceRaw, setMetroDistanceRaw] = useState('');
  const [submissionDateRaw, setSubmissionDateRaw] = useState('2026-01-01');
  const [existingBuiltAreaRaw, setExistingBuiltAreaRaw] = useState('');
  const [hasFullFreeze, setHasFullFreeze] = useState(false);
  const [hasTama38Freeze, setHasTama38Freeze] = useState(false);
  const [hasDensityCap, setHasDensityCap] = useState(false);
  const [densityCapValueRaw, setDensityCapValueRaw] = useState('');
  const [hasRataHeightCone, setHasRataHeightCone] = useState(false);
  const [hasStrictPreservation, setHasStrictPreservation] = useState(false);
  const [hasSection23Override, setHasSection23Override] = useState(false);
  const [isPeripheryOrSeismic, setIsPeripheryOrSeismic] = useState(false);

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

    // Step 8 — Additional Areas (beyond building rights, not deducted)
    // Balconies: max 14 sqm per apartment (per TABA)
    const balconiesPerApt = 14; // max 14 sqm per apartment
    const balconiesDeduction = aptsPerFloor * numFloors * balconiesPerApt;
    // Misetor (service/AC hideout): 3.5 sqm per apartment
    const misetorDeduction = aptsPerFloor * numFloors * 3.5;
    // Circulation (lobbies, stairs, shafts, walls): ~18% of typical floor area
    const typFloor = typicalFloorArea > 0 ? typicalFloorArea : coverageArea;
    const spacesDeduction = Math.round(typFloor * 0.18) * numFloors;
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

    // Total additional areas (built beyond the rights envelope)
    const totalDeductions = balconiesDeduction + misetorDeduction + spacesDeduction + storageDeduction;
    // Net buildable area = main building (apartments + circulation)
    // = baseRights minus any constraint, since rooftop/shared/public are costed separately
    const netBuildableArea = baseRights - constraintReduction;

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

  // ── Statutory Decision Engine (useMemo) ──
  const statutory: StatutoryResult | null = useMemo(() => {
    if (!calc || !hasCalculated) return null;

    const metroDistance = metroDistanceRaw ? parseFloat(metroDistanceRaw) : null;
    const metroZone = classifyMetroZone(metroDistance);
    const existingBuiltArea = parseNum(existingBuiltAreaRaw) || calc.existingBuildArea;
    const submissionDate = new Date(submissionDateRaw || '2026-01-01');
    const densityCapValue = hasDensityCap ? (parseFloat(densityCapValueRaw) || 30) : null;

    // Hegemony layers
    const hegemonyLayers: string[] = [];
    if (hasRataHeightCone) hegemonyLayers.push('RATA_HEIGHT_CONE');
    if (hasStrictPreservation) hegemonyLayers.push('STRICT_PRESERVATION');

    // City renewal config
    const cityRenewal = CITY_RENEWAL_CONFIG[selectedCity] || DEFAULT_RENEWAL_CONFIG;

    // ── Step 1: Build Override Context ──
    const ctx: OverrideContext = {
      canBuildTama38: true,
      canBuildBaseline: true,
      canAddFloors: true,
      canAddUnits: true,
      nationalHeightCapM: null,
      nationalMaxFloors: null,
      renewalTrack: cityRenewal.track,
      maxMultiplierCore: cityRenewal.coreMultiplier,
      maxMultiplierPeriphery: cityRenewal.peripheryMultiplier,
      publicBuiltShare: cityRenewal.publicShare,
    };

    const redFlags: RedFlag[] = [];

    // ── Step 2: Apply National Vetoes (TAMA 70, Freeze, RATA, Heritage) ──

    // Metro core → TAMA 38 absolutely blocked
    if (metroZone === 'core_100m') {
      ctx.canBuildTama38 = false;
      redFlags.push({
        code: 'METRO_CORE_BLOCK',
        severity: 'hard_block',
        messageHe: 'המגרש נמצא בטווח 100 מ\' מתחנת מטרו (ליבת תמ"א 70). היתרי תמ"א 38 חסומים לחלוטין.',
        messageEn: 'Parcel is within 100m of Metro station (TAMA 70 core). TAMA 38 permits are absolutely blocked.',
        source: 'TAMA 70',
      });
    }

    // Metro ring 1 → special approval required
    if (metroZone === 'ring_1_300m') {
      redFlags.push({
        code: 'METRO_RING1_APPROVAL',
        severity: 'attention',
        messageHe: 'המגרש בטווח 100-300 מ\' מתחנת מטרו. היתרי בנייה דורשים אישור מיוחד של נת"ע.',
        messageEn: 'Parcel is within 100-300m of Metro station. Building permits require special NTA approval.',
        source: 'TAMA 70',
      });
    }

    // Metro ring 2 → TOD compliance
    if (metroZone === 'ring_2_800m') {
      redFlags.push({
        code: 'METRO_RING2_TOD',
        severity: 'attention',
        messageHe: 'המגרש בטווח 800 מ\' מתחנת מטרו. חובת עמידה בתקני TOD — צפיפות גבוהה, חניה מופחתת, קומת מסחר.',
        messageEn: 'Parcel is within 800m of Metro station. Must comply with TOD standards: higher density, reduced parking, active ground floor.',
        source: 'TAMA 70',
      });
    }

    // Full freeze → block all
    if (hasFullFreeze) {
      ctx.canBuildBaseline = false;
      ctx.canBuildTama38 = false;
      ctx.canAddFloors = false;
      ctx.canAddUnits = false;
      redFlags.push({
        code: 'FULL_FREEZE',
        severity: 'hard_block',
        messageHe: 'הקפאה מלאה פעילה (סעיף 78) — כל היתרי הבנייה חסומים.',
        messageEn: 'Active §78 full freeze — all building permits are blocked.',
        source: '§78',
      });
    }

    // TAMA 38 freeze
    if (hasTama38Freeze && !hasFullFreeze) {
      ctx.canBuildTama38 = false;
      redFlags.push({
        code: 'TAMA38_FREEZE',
        severity: 'hard_block',
        messageHe: 'הקפאה פעילה החוסמת היתרי תמ"א 38.',
        messageEn: 'Active freeze blocking TAMA 38 permits.',
        source: '§77-78',
      });
    }

    // Density cap from freeze
    if (hasDensityCap && densityCapValue !== null) {
      ctx.canAddUnits = false;
      redFlags.push({
        code: 'DENSITY_CAP',
        severity: 'strong_risk',
        messageHe: `מגבלת צפיפות פעילה: מקסימום ${densityCapValue} יח"ד לדונם. לא ניתן להוסיף יחידות מעבר לתקרה.`,
        messageEn: `Active density cap: max ${densityCapValue} units/dunam. Cannot add units beyond cap.`,
        source: '§77',
      });
    }

    // RATA height cone
    if (hasRataHeightCone) {
      ctx.canAddFloors = false;
      redFlags.push({
        code: 'RATA_HEIGHT_VETO',
        severity: 'hard_block',
        messageHe: 'מגבלת גובה רט"א (חרוט נתיב טיסה). לא ניתן להוסיף קומות מעבר לגבול הגובה הנוכחי.',
        messageEn: 'RATA airport height-cone restriction. Cannot add floors beyond current height limit.',
        source: 'RATA NOP',
      });
    }

    // Strict preservation
    if (hasStrictPreservation) {
      ctx.canBuildBaseline = false;
      ctx.canBuildTama38 = false;
      ctx.canAddFloors = false;
      ctx.canAddUnits = false;
      redFlags.push({
        code: 'HERITAGE_STRICT',
        severity: 'hard_block',
        messageHe: 'אזור שימור מחמיר — אין היתר להריסה או בנייה נוספת. כל שינוי דורש אישור מועצת השימור.',
        messageEn: 'Strict heritage preservation — no demolition or additional construction. Any modification requires Conservation Council approval.',
        source: 'Heritage',
      });
    }

    // Section 23 override
    if (hasSection23Override) {
      ctx.canBuildTama38 = false;
      redFlags.push({
        code: 'SECTION_23_NO_STACKING',
        severity: 'attention',
        messageHe: 'תוכנית סעיף 23 פעילה — דורסת זכויות תמ"א 38. המקור הבלעדי לזכויות הוא התוכנית המפורטת.',
        messageEn: 'Section 23 plan active — overrides TAMA 38 stacking. The detailed plan is the sole authority for rights.',
        source: 'Section 23',
      });
    }

    // ── Step 3: Tax Exposure Flags ──
    if (metroZone !== 'outside') {
      const now = submissionDate;
      if (now >= METRO_LEVY_START && now <= METRO_LEVY_END) {
        redFlags.push({
          code: 'METRO_LEVY',
          severity: 'strong_risk',
          messageHe: `היטל השבחה מטרו: ~${METRO_LEVY_RATE_PCT}% (לעומת ${STANDARD_LEVY_RATE_PCT}% רגיל). המגרש באזור השפעת מטרו — חשיפת מס משמעותית.`,
          messageEn: `Metro betterment levy: ~${METRO_LEVY_RATE_PCT}% (vs standard ${STANDARD_LEVY_RATE_PCT}%). Parcel is in Metro influence zone — significant tax exposure.`,
          source: 'Metro Levy',
        });
      }
    }

    // ── Step 4: Area Model Determination ──
    const areaModel: 'total_area' | 'principal_service' =
      submissionDate >= SHAKED_TOTAL_AREA_CUTOFF && projectType === 'demolish_rebuild'
        ? 'total_area'
        : 'principal_service';

    // ── Step 5: Compute 3 Rights Alternatives ──
    const alternatives: RightsAlternative[] = [];

    // Alternative 1: Baseline TABA (existing calculation results)
    alternatives.push({
      name: `תב"ע ${cityConfig.tabaNumber}`,
      nameEn: `TABA ${cityConfig.tabaNumber}`,
      residentialSqm: calc.totalRights,
      publicBuiltSqm: calc.publicUseSpaces,
      serviceSqm: 0,
      totalSqm: calc.totalRights,
      estimatedUnits: calc.maxUnits,
      notesHe: `זכויות מאושרות לפי ${cityConfig.tabaLabel}. כיסוי ${Math.round(calc.coveragePercentage * 100)}%, מקדם ${calc.buildingCoefficient}.`,
      notesEn: `Approved rights per ${cityConfig.tabaLabelEn}. Coverage ${Math.round(calc.coveragePercentage * 100)}%, coefficient ${calc.buildingCoefficient}.`,
      blocked: !ctx.canBuildBaseline,
      blockReasonHe: !ctx.canBuildBaseline ? 'חסום — הקפאה מלאה או שימור מחמיר' : undefined,
      blockReasonEn: !ctx.canBuildBaseline ? 'Blocked — full freeze or strict preservation' : undefined,
    });

    // Alternative 2: TAMA 38 Extension
    if (ctx.canBuildTama38) {
      const tama38Addition = existingBuiltArea * 0.50;
      const tama38Residential = existingBuiltArea + tama38Addition;
      const tama38Service = existingBuiltArea * 0.12;
      const tama38Units = Math.max(1, Math.round(tama38Residential / 80));
      alternatives.push({
        name: 'תמ"א 38 הרחבה',
        nameEn: 'TAMA 38 Extension',
        residentialSqm: Math.round(tama38Residential),
        publicBuiltSqm: 0,
        serviceSqm: Math.round(tama38Service),
        totalSqm: Math.round(tama38Residential + tama38Service),
        estimatedUnits: tama38Units,
        notesHe: `תמ"א 38: +50% משטח קיים ${fmtNum(Math.round(existingBuiltArea))} מ"ר = ${fmtNum(Math.round(tama38Addition))} מ"ר תוספת. תקף עד מאי 2026.`,
        notesEn: `TAMA 38: +50% of existing ${fmtNum(Math.round(existingBuiltArea))} sqm = ${fmtNum(Math.round(tama38Addition))} sqm addition. Valid until May 2026.`,
        blocked: false,
      });
    } else {
      const reasons: string[] = [];
      const reasonsEn: string[] = [];
      if (metroZone === 'core_100m') { reasons.push('ליבת מטרו (תמ"א 70)'); reasonsEn.push('Metro core (TAMA 70)'); }
      if (hasFullFreeze) { reasons.push('הקפאה מלאה (§78)'); reasonsEn.push('Full freeze (§78)'); }
      if (hasTama38Freeze) { reasons.push('הקפאת תמ"א 38'); reasonsEn.push('TAMA 38 freeze'); }
      if (hasStrictPreservation) { reasons.push('שימור מחמיר'); reasonsEn.push('Strict preservation'); }
      if (hasSection23Override) { reasons.push('דריסת סעיף 23'); reasonsEn.push('Section 23 override'); }
      alternatives.push({
        name: 'תמ"א 38 הרחבה',
        nameEn: 'TAMA 38 Extension',
        residentialSqm: 0,
        publicBuiltSqm: 0,
        serviceSqm: 0,
        totalSqm: 0,
        estimatedUnits: null,
        notesHe: 'חסום.',
        notesEn: 'Blocked.',
        blocked: true,
        blockReasonHe: reasons.join(', '),
        blockReasonEn: reasonsEn.join(', '),
      });
    }

    // Alternative 3: Shaked Alternative (Amendment 139)
    if (cityRenewal.track === 'shaked_alternative' && !hasFullFreeze && !hasStrictPreservation) {
      const multiplier = isPeripheryOrSeismic
        ? cityRenewal.peripheryMultiplier
        : cityRenewal.coreMultiplier;
      const totalPermitted = existingBuiltArea * multiplier;
      const publicSqm = totalPermitted * cityRenewal.publicShare;
      let residentialSqm = totalPermitted - publicSqm;
      let serviceSqm = 0;

      if (areaModel === 'total_area') {
        // Post-Oct 2025: total area model — service included in total
        serviceSqm = 0;
      } else {
        // Pre-cutoff: separate service area
        if (projectType === 'addition_existing') {
          serviceSqm = existingBuiltArea * 0.15;
        } else {
          serviceSqm = residentialSqm * 0.15;
        }
        residentialSqm -= serviceSqm;
      }

      // National caps still apply to Shaked (RATA, etc.)
      if (hasRataHeightCone && ctx.nationalMaxFloors !== null) {
        const maxFromFloors = ctx.nationalMaxFloors * 4 * 80;
        residentialSqm = Math.min(residentialSqm, maxFromFloors);
      }

      const estimatedUnits = Math.max(1, Math.round(residentialSqm / 80));
      const modelLabelHe = areaModel === 'total_area' ? 'מודל שטח כולל (רפורמה 30.10.2025)' : 'מודל שטח עיקרי + שירות (טרם רפורמה)';
      const modelLabelEn = areaModel === 'total_area' ? 'Total area model (post-30.10.2025 reform)' : 'Principal + service model (pre-reform)';

      alternatives.push({
        name: 'חלופת שקד (תיקון 139)',
        nameEn: 'Shaked Alternative (Amendment 139)',
        residentialSqm: Math.round(residentialSqm),
        publicBuiltSqm: Math.round(publicSqm),
        serviceSqm: Math.round(serviceSqm),
        totalSqm: Math.round(residentialSqm + publicSqm + serviceSqm),
        estimatedUnits,
        notesHe: `מכפיל ${multiplier}× של ${fmtNum(Math.round(existingBuiltArea))} מ"ר קיימים = ${fmtNum(Math.round(totalPermitted))} מ"ר. שטח ציבורי ${Math.round(cityRenewal.publicShare * 100)}%. ${modelLabelHe}.`,
        notesEn: `${multiplier}× of existing ${fmtNum(Math.round(existingBuiltArea))} sqm = ${fmtNum(Math.round(totalPermitted))} sqm. Public share ${Math.round(cityRenewal.publicShare * 100)}%. ${modelLabelEn}.`,
        blocked: false,
      });
    } else if (cityRenewal.track === 'shaked_alternative') {
      alternatives.push({
        name: 'חלופת שקד (תיקון 139)',
        nameEn: 'Shaked Alternative (Amendment 139)',
        residentialSqm: 0,
        publicBuiltSqm: 0,
        serviceSqm: 0,
        totalSqm: 0,
        estimatedUnits: null,
        notesHe: 'חסום עקב הקפאה מלאה או שימור.',
        notesEn: 'Blocked due to full freeze or preservation.',
        blocked: true,
        blockReasonHe: hasFullFreeze ? 'הקפאה מלאה' : 'שימור מחמיר',
        blockReasonEn: hasFullFreeze ? 'Full freeze' : 'Strict preservation',
      });
    } else {
      // City is on TAMA 38 track, not Shaked — show as N/A
      alternatives.push({
        name: 'חלופת שקד (תיקון 139)',
        nameEn: 'Shaked Alternative (Amendment 139)',
        residentialSqm: 0,
        publicBuiltSqm: 0,
        serviceSqm: 0,
        totalSqm: 0,
        estimatedUnits: null,
        notesHe: 'לא זמין — העיר פועלת במסלול תמ"א 38.',
        notesEn: 'Not available — city is on TAMA 38 track.',
        blocked: true,
        blockReasonHe: 'העיר לא אימצה חלופת שקד',
        blockReasonEn: 'City has not adopted Shaked Alternative',
      });
    }

    // ── Step 6: Additional Red Flags ──

    // Density cap detail
    if (hasDensityCap && densityCapValue !== null) {
      const plotDunam = plotArea / 1000;
      const maxFromCap = Math.floor(densityCapValue * plotDunam);
      if (calc.maxUnits > maxFromCap) {
        redFlags.push({
          code: 'DENSITY_EXCEEDS_CAP',
          severity: 'strong_risk',
          messageHe: `תקרת צפיפות ${densityCapValue} יח"ד/דונם × ${fmtDec(plotDunam)} דונם = ${maxFromCap} יח"ד מקס. החישוב מציע ${calc.maxUnits} — חריגה.`,
          messageEn: `Density cap ${densityCapValue} units/dunam × ${fmtDec(plotDunam)} dunam = ${maxFromCap} max units. Calculation suggests ${calc.maxUnits} — exceeds cap.`,
          source: '§77 Density',
        });
      }
    }

    // Seismic zone note
    if (isPeripheryOrSeismic) {
      redFlags.push({
        code: 'SEISMIC_ZONE',
        severity: 'attention',
        messageHe: 'אזור פריפריה/סייסמי — מכפיל מוגבר (עד 550%) זמין. חובת תכנון עמיד רעידות אדמה.',
        messageEn: 'Periphery/seismic zone — increased multiplier (up to 550%) available. Earthquake-resistant design required.',
        source: 'Seismic',
      });
    }

    return {
      metroZone,
      overrideContext: ctx,
      alternatives,
      redFlags,
      areaModel,
    };
  }, [calc, hasCalculated, metroDistanceRaw, submissionDateRaw, existingBuiltAreaRaw, selectedCity, projectType,
      hasFullFreeze, hasTama38Freeze, hasDensityCap, densityCapValueRaw, hasRataHeightCone,
      hasStrictPreservation, hasSection23Override, isPeripheryOrSeismic, cityConfig, plotArea]);

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

            {/* ── Statutory Analysis Settings (Collapsible) ── */}
            <div
              className="rounded-lg overflow-hidden mb-6"
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.02)',
              }}
            >
              <button
                onClick={() => setStatutoryOpen(!statutoryOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold cursor-pointer bg-transparent border-0"
                style={{ color: '#4a4a6a' }}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
                  {t('מנוע סטטוטורי — ניתוח תכנוני מתקדם', 'Statutory Engine — Advanced Planning Analysis')}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: '#7c3aed', color: '#fff' }}
                  >
                    {t('חדש', 'NEW')}
                  </span>
                </span>
                {statutoryOpen ? (
                  <ChevronUp className="w-4 h-4" style={{ color: '#9ca3af' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: '#9ca3af' }} />
                )}
              </button>

              {statutoryOpen && (
                <div className="px-4 pb-4">
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: '16px' }} />

                  {/* Project Type & Submission Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <Hammer className="w-3 h-3" />
                          {t('סוג פרויקט', 'Project Type')}
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setProjectType('demolish_rebuild'); setHasCalculated(false); }}
                          className="flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold cursor-pointer border-0 transition-all"
                          style={{
                            background: projectType === 'demolish_rebuild' ? `${PURPLE}15` : 'rgba(0,0,0,0.04)',
                            border: `1px solid ${projectType === 'demolish_rebuild' ? PURPLE : 'rgba(0,0,0,0.08)'}`,
                            color: projectType === 'demolish_rebuild' ? PURPLE : '#6b7280',
                          }}
                        >
                          <Hammer className="w-3 h-3 mx-auto mb-1" />
                          {t('פינוי בינוי', 'Demolish & Rebuild')}
                        </button>
                        <button
                          onClick={() => { setProjectType('addition_existing'); setHasCalculated(false); }}
                          className="flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold cursor-pointer border-0 transition-all"
                          style={{
                            background: projectType === 'addition_existing' ? `${PURPLE}15` : 'rgba(0,0,0,0.04)',
                            border: `1px solid ${projectType === 'addition_existing' ? PURPLE : 'rgba(0,0,0,0.08)'}`,
                            color: projectType === 'addition_existing' ? PURPLE : '#6b7280',
                          }}
                        >
                          <Wrench className="w-3 h-3 mx-auto mb-1" />
                          {t('תוספת בנייה', 'Addition')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {t('תאריך הגשה', 'Submission Date')}
                        </span>
                      </label>
                      <input
                        type="date"
                        value={submissionDateRaw}
                        onChange={(e) => { setSubmissionDateRaw(e.target.value); setHasCalculated(false); }}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                      <p className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                        {t(
                          'רפורמת שטחים: הגשה מ-30.10.2025 → מודל שטח כולל',
                          'Area reform: submissions from 30.10.2025 → total area model'
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" />
                          {t('שטח בנוי קיים (מ"ר)', 'Existing Built Area (sqm)')}
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder={t('לחישוב מכפיל שקד', 'For Shaked multiplier')}
                        value={existingBuiltAreaRaw}
                        onChange={(e) => { setExistingBuiltAreaRaw(commaFormat(e.target.value)); setHasCalculated(false); }}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                    </div>
                  </div>

                  {/* Metro Distance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <Train className="w-3 h-3" />
                          {t('מרחק לתחנת מטרו קרובה (מ\')', 'Distance to Nearest Metro (m)')}
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        placeholder={t('לדוגמה: 250', 'e.g. 250')}
                        value={metroDistanceRaw}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d]/g, '');
                          setMetroDistanceRaw(v);
                          setHasCalculated(false);
                        }}
                        style={inputStyle(false)}
                        onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                      />
                      {metroDistanceRaw && (
                        <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: classifyMetroZone(parseFloat(metroDistanceRaw)) === 'core_100m' ? '#dc2626' : classifyMetroZone(parseFloat(metroDistanceRaw)) === 'outside' ? '#9ca3af' : '#d97706' }}>
                          <Train className="w-3 h-3" />
                          {t('אזור תמ"א 70: ', 'TAMA 70 zone: ')}
                          {getMetroZoneLabel(classifyMetroZone(parseFloat(metroDistanceRaw)), isHe)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={labelStyle}>
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-3 h-3" />
                          {t('תקרת צפיפות (יח"ד/דונם)', 'Density Cap (units/dunam)')}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setHasDensityCap(!hasDensityCap); setHasCalculated(false); }}
                          className="flex items-center gap-1.5 cursor-pointer bg-transparent border-0 text-[11px] font-medium flex-shrink-0"
                          style={{ color: '#4a4a6a' }}
                        >
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center transition-all"
                            style={{
                              background: hasDensityCap ? '#ef4444' : 'rgba(0,0,0,0.06)',
                              border: `1px solid ${hasDensityCap ? '#ef4444' : 'rgba(0,0,0,0.15)'}`,
                            }}
                          >
                            {hasDensityCap && <Check className="w-2.5 h-2.5" style={{ color: '#fff' }} />}
                          </div>
                          {t('פעיל', 'Active')}
                        </button>
                        {hasDensityCap && (
                          <input
                            type="text"
                            inputMode="numeric"
                            dir="ltr"
                            placeholder="30"
                            value={densityCapValueRaw}
                            onChange={(e) => { setDensityCapValueRaw(e.target.value.replace(/[^\d.]/g, '')); setHasCalculated(false); }}
                            className="flex-1"
                            style={{ ...inputStyle(false), padding: '6px 10px' }}
                            onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Freeze & Constraint Toggles */}
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold mb-2" style={{ color: '#6b7280' }}>
                      {t('סעיפי הקפאה §77-78 ושכבות דריסה', 'Freeze Notices §77-78 & Override Layers')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { state: hasFullFreeze, setter: () => { setHasFullFreeze(!hasFullFreeze); setHasCalculated(false); }, label: t('הקפאה מלאה (§78)', 'Full Freeze (§78)'), icon: Ban, color: '#ef4444' },
                        { state: hasTama38Freeze, setter: () => { setHasTama38Freeze(!hasTama38Freeze); setHasCalculated(false); }, label: t('הקפאת תמ"א 38', 'TAMA 38 Freeze'), icon: Ban, color: '#f59e0b' },
                        { state: hasRataHeightCone, setter: () => { setHasRataHeightCone(!hasRataHeightCone); setHasCalculated(false); }, label: t('מגבלת גובה רט"א', 'RATA Height Cone'), icon: Plane, color: '#ef4444' },
                        { state: hasStrictPreservation, setter: () => { setHasStrictPreservation(!hasStrictPreservation); setHasCalculated(false); }, label: t('שימור מחמיר', 'Strict Preservation'), icon: Landmark, color: '#ef4444' },
                        { state: hasSection23Override, setter: () => { setHasSection23Override(!hasSection23Override); setHasCalculated(false); }, label: t('תוכנית סעיף 23', 'Section 23 Plan'), icon: Shield, color: '#f59e0b' },
                        { state: isPeripheryOrSeismic, setter: () => { setIsPeripheryOrSeismic(!isPeripheryOrSeismic); setHasCalculated(false); }, label: t('פריפריה / אזור סייסמי', 'Periphery / Seismic Zone'), icon: Zap, color: '#3b82f6' },
                      ].map((cb, i) => (
                        <button
                          key={i}
                          onClick={cb.setter}
                          className="flex items-center gap-1.5 cursor-pointer bg-transparent border-0 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all"
                          style={{
                            color: cb.state ? cb.color : '#6b7280',
                            background: cb.state ? `${cb.color}10` : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${cb.state ? `${cb.color}30` : 'rgba(0,0,0,0.06)'}`,
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center transition-all flex-shrink-0"
                            style={{
                              background: cb.state ? cb.color : 'rgba(0,0,0,0.06)',
                              border: `1px solid ${cb.state ? cb.color : 'rgba(0,0,0,0.15)'}`,
                            }}
                          >
                            {cb.state && <Check className="w-2.5 h-2.5" style={{ color: '#fff' }} />}
                          </div>
                          <cb.icon className="w-3 h-3" />
                          {cb.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                    <p className="text-[10px]" style={{ color: '#4a4a6a' }}>
                      {t(
                        'המנוע הסטטוטורי מנתח היררכיית תוכניות (תמ"א 70 → תמ"א 38 → סעיף 23 → תב"ע → שקד), הקפאות §77-78, מגבלות רט"א ושימור, ומייצר 3 חלופות זכויות בנייה עם מפת דגלים אדומים.',
                        'The statutory engine analyzes plan hierarchy (TAMA 70 → TAMA 38 → Section 23 → TABA → Shaked), §77-78 freezes, RATA/heritage constraints, and produces 3 rights alternatives with a red flags matrix.'
                      )}
                    </p>
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
                  <div className="flex flex-wrap items-center justify-center gap-4 text-[10px]" style={{ color: '#525A65' }}>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: PURPLE, animation: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      {t('שטחים ומקדמים', 'Areas & coefficients')}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3FB950', animation: 'pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      {t('היררכיית תוכניות', 'Plan hierarchy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D29922', animation: 'pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      {t('הקפאות ומגבלות', 'Freezes & constraints')}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f97316', animation: 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      {t('3 חלופות זכויות', '3 rights alternatives')}
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

              {/* ── Section A2 — Override Status Badges ── */}
              {statutory && (
                <div className="px-6 sm:px-8 pb-2 fade-in-up" style={{ animationDelay: '0.05s' }}>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { ok: statutory.overrideContext.canBuildBaseline, labelHe: 'בנייה לפי תב"ע', labelEn: 'Baseline TABA' },
                      { ok: statutory.overrideContext.canBuildTama38, labelHe: 'תמ"א 38', labelEn: 'TAMA 38' },
                      { ok: statutory.overrideContext.canAddFloors, labelHe: 'תוספת קומות', labelEn: 'Floor Addition' },
                      { ok: statutory.overrideContext.canAddUnits, labelHe: 'תוספת יחידות', labelEn: 'Unit Addition' },
                    ].map((badge, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                        style={{
                          background: badge.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${badge.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                          color: badge.ok ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {badge.ok ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {t(badge.labelHe, badge.labelEn)}
                      </span>
                    ))}
                    {/* Metro zone badge */}
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      style={{
                        background: statutory.metroZone === 'core_100m' ? 'rgba(239,68,68,0.08)' :
                          statutory.metroZone === 'outside' ? 'rgba(107,114,128,0.08)' : 'rgba(245,158,11,0.08)',
                        border: `1px solid ${statutory.metroZone === 'core_100m' ? 'rgba(239,68,68,0.25)' :
                          statutory.metroZone === 'outside' ? 'rgba(107,114,128,0.15)' : 'rgba(245,158,11,0.25)'}`,
                        color: statutory.metroZone === 'core_100m' ? '#dc2626' :
                          statutory.metroZone === 'outside' ? '#6b7280' : '#d97706',
                      }}
                    >
                      <Train className="w-3 h-3" />
                      {getMetroZoneLabel(statutory.metroZone, isHe)}
                    </span>
                    {/* Area model badge */}
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                      style={{
                        background: 'rgba(139,92,246,0.08)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        color: '#7c3aed',
                      }}
                    >
                      <Ruler className="w-3 h-3" />
                      {statutory.areaModel === 'total_area'
                        ? t('מודל שטח כולל', 'Total Area Model')
                        : t('מודל עיקרי + שירות', 'Principal + Service')
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '0 24px' }} />

              {/* ── Section A3 — Rights Comparison (3 Alternatives) ── */}
              {statutory && statutory.alternatives.length > 0 && (
                <div className="p-6 sm:p-8 fade-in-up" style={{ animationDelay: '0.08s' }}>
                  <SectionHeader
                    icon={Scale}
                    title={t('השוואת חלופות זכויות', 'Rights Alternatives Comparison')}
                    subtitle={t(
                      'תב"ע מאושרת vs תמ"א 38 vs חלופת שקד (תיקון 139)',
                      'Approved TABA vs TAMA 38 vs Shaked Alternative (Amendment 139)'
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statutory.alternatives.map((alt, i) => {
                      const isBlocked = alt.blocked;
                      const isBest = !isBlocked && alt.totalSqm === Math.max(
                        ...statutory.alternatives.filter(a => !a.blocked).map(a => a.totalSqm)
                      );
                      return (
                        <div
                          key={i}
                          className="relative rounded-xl p-5 overflow-hidden"
                          style={{
                            background: isBlocked ? 'rgba(239,68,68,0.04)' : isBest ? `${PURPLE}08` : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.15)' : isBest ? `${PURPLE}30` : 'rgba(0,0,0,0.06)'}`,
                            opacity: isBlocked ? 0.65 : 1,
                          }}
                        >
                          {isBest && (
                            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }} />
                          )}
                          {isBlocked && (
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>
                                <XCircle className="w-2.5 h-2.5" />
                                {t('חסום', 'BLOCKED')}
                              </span>
                            </div>
                          )}
                          {isBest && (
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${PURPLE}18`, color: PURPLE }}>
                                <Check className="w-2.5 h-2.5" />
                                {t('מיטבי', 'BEST')}
                              </span>
                            </div>
                          )}

                          <h4 className="text-sm font-bold mt-2 mb-3" style={{ color: isBlocked ? '#9ca3af' : '#1a1a2e' }}>
                            {t(alt.name, alt.nameEn)}
                          </h4>

                          {!isBlocked ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px]">
                                <span style={{ color: '#6b7280' }}>{t('זכויות מגורים', 'Residential Rights')}</span>
                                <span className="font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>
                                  {fmtNum(alt.residentialSqm)} {t('מ"ר', 'sqm')}
                                </span>
                              </div>
                              {alt.publicBuiltSqm > 0 && (
                                <div className="flex justify-between text-[11px]">
                                  <span style={{ color: '#6b7280' }}>{t('שטח ציבורי', 'Public Built')}</span>
                                  <span className="font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>
                                    {fmtNum(alt.publicBuiltSqm)} {t('מ"ר', 'sqm')}
                                  </span>
                                </div>
                              )}
                              {alt.serviceSqm > 0 && (
                                <div className="flex justify-between text-[11px]">
                                  <span style={{ color: '#6b7280' }}>{t('שטח שירות', 'Service Area')}</span>
                                  <span className="font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>
                                    {fmtNum(alt.serviceSqm)} {t('מ"ר', 'sqm')}
                                  </span>
                                </div>
                              )}
                              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
                              <div className="flex justify-between text-[12px]">
                                <span className="font-bold" style={{ color: PURPLE }}>{t('סה"כ', 'Total')}</span>
                                <span className="font-black text-lg" style={{ fontFamily: "'Space Grotesk', monospace", color: PURPLE }}>
                                  {fmtNum(alt.totalSqm)}
                                </span>
                              </div>
                              {alt.estimatedUnits !== null && (
                                <div className="flex justify-between text-[11px]">
                                  <span style={{ color: '#6b7280' }}>{t('יחידות מוערכות', 'Est. Units')}</span>
                                  <span className="font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>
                                    ~{fmtNum(alt.estimatedUnits)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2">
                              <p className="text-[11px]" style={{ color: '#9ca3af' }}>
                                {t(alt.blockReasonHe || alt.notesHe, alt.blockReasonEn || alt.notesEn)}
                              </p>
                            </div>
                          )}

                          {/* Notes */}
                          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: '#9ca3af' }}>
                            {t(alt.notesHe, alt.notesEn)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '0 24px' }} />

              {/* ── Section A4 — Red Flags Matrix ── */}
              {statutory && statutory.redFlags.length > 0 && (
                <div className="p-6 sm:p-8 fade-in-up" style={{ animationDelay: '0.12s' }}>
                  <SectionHeader
                    icon={AlertTriangle}
                    title={t('מפת דגלים אדומים', 'Red Flags Matrix')}
                    subtitle={t(
                      'חסימות, סיכונים ודגשים לתשומת לב היזם',
                      'Blocks, risks, and attention items for the developer'
                    )}
                  />

                  <div className="space-y-2">
                    {statutory.redFlags.map((flag, i) => {
                      const style = getSeverityStyle(flag.severity);
                      const FlagIcon = style.icon;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3.5 rounded-lg"
                          style={{ background: style.bg, border: `1px solid ${style.border}` }}
                        >
                          <FlagIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: style.text }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${style.text}15`, color: style.text }}>
                                {getSeverityLabel(flag.severity, isHe)}
                              </span>
                              <span className="text-[9px] font-mono" style={{ color: '#9ca3af' }}>
                                {flag.code}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: '#4a4a6a' }}>
                              {t(flag.messageHe, flag.messageEn)}
                            </p>
                            <span className="text-[9px]" style={{ color: '#9ca3af' }}>
                              {t('מקור: ', 'Source: ')}{flag.source}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Red Flags Summary */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(['hard_block', 'strong_risk', 'attention'] as RedFlagSeverity[]).map(sev => {
                      const count = statutory.redFlags.filter(f => f.severity === sev).length;
                      const s = getSeverityStyle(sev);
                      return (
                        <div key={sev} className="text-center p-2.5 rounded-lg" style={{ background: count > 0 ? s.bg : 'rgba(0,0,0,0.02)', border: `1px solid ${count > 0 ? s.border : 'rgba(0,0,0,0.04)'}` }}>
                          <div className="text-xl font-black" style={{ fontFamily: "'Space Grotesk', monospace", color: count > 0 ? s.text : '#d1d5db' }}>
                            {count}
                          </div>
                          <div className="text-[9px] font-semibold" style={{ color: count > 0 ? s.text : '#9ca3af' }}>
                            {getSeverityLabel(sev, isHe)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
