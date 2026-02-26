'use client';

import { useState, useMemo } from 'react';
import {
  Shield, Train, Ban, XCircle, Calendar, Hammer, Wrench,
  Plane, Landmark, Zap, Scale, Check, Info, AlertTriangle,
  Building2, Ruler,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── Exported Types ───────────────────────────────────────────

export type MetroZone = 'core_100m' | 'ring_1_300m' | 'ring_2_800m' | 'outside';
export type RenewalTrack = 'none' | 'tama38_extension' | 'shaked_alternative';
export type ProjectType = 'demolish_rebuild' | 'addition_existing';
export type RedFlagSeverity = 'hard_block' | 'strong_risk' | 'attention';

export interface RedFlag {
  code: string;
  severity: RedFlagSeverity;
  messageHe: string;
  messageEn: string;
  source: string;
}

export interface RightsAlternative {
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

export interface OverrideContext {
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

export interface StatutoryResult {
  metroZone: MetroZone;
  overrideContext: OverrideContext;
  alternatives: RightsAlternative[];
  redFlags: RedFlag[];
  areaModel: 'total_area' | 'principal_service';
}

// ── Props ────────────────────────────────────────────────────

interface CityConfig {
  tabaNumber: string;
  tabaLabel: string;
  tabaLabelEn: string;
}

interface Props {
  /** City name (Hebrew) — used to look up renewal track config */
  city: string;
  /** City TABA config for baseline alternative labels */
  cityConfig: CityConfig;
  /** Base TABA calculation results (from the calculator) */
  baseCalc: {
    totalRights: number;
    publicUseSpaces: number;
    coveragePercentage: number;
    buildingCoefficient: number;
    maxUnits: number;
    existingBuildArea: number;
  };
  /** Plot area in sqm */
  plotArea: number;
  /** Callback when statutory result changes */
  onResult?: (result: StatutoryResult | null) => void;
}

// ── Constants ────────────────────────────────────────────────

const PURPLE = '#a78bfa';

interface CityRenewalConfig {
  track: RenewalTrack;
  coreMultiplier: number;
  peripheryMultiplier: number;
  publicShare: number;
}

// 50+ Israeli cities — synced with rights_engine/config/city_renewal_config.py
const S: CityRenewalConfig = { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 };
const SP: CityRenewalConfig = { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.15 };
const T: CityRenewalConfig = { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.0, publicShare: 0.10 };
const TP: CityRenewalConfig = { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.0, publicShare: 0.10 };

const CITY_RENEWAL_CONFIG: Record<string, CityRenewalConfig> = {
  // Gush Dan
  'תל אביב': S, 'תל אביב-יפו': S,
  'רמת גן': S, 'גבעתיים': S, 'בני ברק': S,
  'חולון': S, 'בת ים': S,
  'פתח תקווה': S, 'פתח תקוה': S,
  'ראשון לציון': S,
  // Sharon
  'רעננה': S, 'הרצליה': S, 'כפר סבא': S, 'הוד השרון': S,
  'נתניה': S, 'רמת השרון': S,
  // Haifa metro
  'חיפה': S, 'קריית אתא': S, 'קריית ביאליק': S,
  'קריית מוצקין': S, 'קריית ים': S,
  'טירת כרמל': T, 'נשר': T,
  // Jerusalem
  'ירושלים': T,
  // South
  'באר שבע': SP, 'אשדוד': S, 'אשקלון': SP,
  'קריית גת': SP, 'שדרות': SP, 'אופקים': SP,
  'דימונה': SP, 'ערד': SP, 'אילת': SP,
  // Central
  'רחובות': S, 'נס ציונה': S, 'לוד': S, 'רמלה': S, 'יבנה': S,
  'מודיעין-מכבים-רעות': S, 'מודיעין': S, 'שוהם': S,
  // North
  'נצרת': TP, 'נצרת עילית': SP, 'נוף הגליל': SP,
  'עפולה': SP, 'טבריה': SP, 'צפת': SP,
  'קריית שמונה': SP, 'עכו': SP, 'נהריה': SP,
  'כרמיאל': SP, 'יקנעם': S,
  // Judea & Samaria
  'אריאל': TP, 'מעלה אדומים': TP, 'ביתר עילית': TP,
  // Additional central
  'אור יהודה': S, 'קריית אונו': S, 'ראש העין': S,
  'אלעד': S, 'חדרה': S,
};

const DEFAULT_RENEWAL_CONFIG: CityRenewalConfig = {
  track: 'tama38_extension',
  coreMultiplier: 3.5,
  peripheryMultiplier: 5.0,
  publicShare: 0.10,
};

const SHAKED_TOTAL_AREA_CUTOFF = new Date('2025-10-30');
const METRO_LEVY_RATE_PCT = 60;
const STANDARD_LEVY_RATE_PCT = 50;
const METRO_LEVY_START = new Date('2024-01-01');
const METRO_LEVY_END = new Date('2028-12-31');

// ── Helpers ──────────────────────────────────────────────────

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

function parseNum(raw: string): number {
  return parseFloat(raw.replace(/,/g, '')) || 0;
}

function commaFormat(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('he-IL');
}

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

// ── Input style factory ──────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'rgba(255,255,255,0.7)',
  fontSize: '15px',
  fontFamily: "'Space Grotesk', monospace",
  color: '#1a1a2e',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = { color: '#4a4a6a' };

// ── Component ────────────────────────────────────────────────

export default function StatutoryEnginePanel({
  city,
  cityConfig,
  baseCalc,
  plotArea,
  onResult,
}: Props) {
  const { lang } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  // ── State: Statutory inputs (NOT in a collapsible) ──
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

  // ── Decision Engine ──
  const statutory: StatutoryResult | null = useMemo(() => {
    if (!baseCalc) return null;

    const metroDistance = metroDistanceRaw ? parseFloat(metroDistanceRaw) : null;
    const metroZone = classifyMetroZone(metroDistance);
    const existingBuiltArea = parseNum(existingBuiltAreaRaw) || baseCalc.existingBuildArea;
    const submissionDate = new Date(submissionDateRaw || '2026-01-01');
    const densityCapValue = hasDensityCap ? (parseFloat(densityCapValueRaw) || 30) : null;

    const cityRenewal = CITY_RENEWAL_CONFIG[city] || DEFAULT_RENEWAL_CONFIG;

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

    // ── Step 2: Apply National Vetoes ──

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

    if (metroZone === 'ring_1_300m') {
      redFlags.push({
        code: 'METRO_RING1_APPROVAL',
        severity: 'attention',
        messageHe: 'המגרש בטווח 100-300 מ\' מתחנת מטרו. היתרי בנייה דורשים אישור מיוחד של נת"ע.',
        messageEn: 'Parcel is within 100-300m of Metro station. Building permits require special NTA approval.',
        source: 'TAMA 70',
      });
    }

    if (metroZone === 'ring_2_800m') {
      redFlags.push({
        code: 'METRO_RING2_TOD',
        severity: 'attention',
        messageHe: 'המגרש בטווח 800 מ\' מתחנת מטרו. חובת עמידה בתקני TOD — צפיפות גבוהה, חניה מופחתת, קומת מסחר.',
        messageEn: 'Parcel is within 800m of Metro station. Must comply with TOD standards: higher density, reduced parking, active ground floor.',
        source: 'TAMA 70',
      });
    }

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

    // Alternative 1: Baseline TABA
    alternatives.push({
      name: `תב"ע ${cityConfig.tabaNumber}`,
      nameEn: `TABA ${cityConfig.tabaNumber}`,
      residentialSqm: baseCalc.totalRights,
      publicBuiltSqm: baseCalc.publicUseSpaces,
      serviceSqm: 0,
      totalSqm: baseCalc.totalRights,
      estimatedUnits: baseCalc.maxUnits,
      notesHe: `זכויות מאושרות לפי ${cityConfig.tabaLabel}. כיסוי ${Math.round(baseCalc.coveragePercentage * 100)}%, מקדם ${baseCalc.buildingCoefficient}.`,
      notesEn: `Approved rights per ${cityConfig.tabaLabelEn}. Coverage ${Math.round(baseCalc.coveragePercentage * 100)}%, coefficient ${baseCalc.buildingCoefficient}.`,
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
        serviceSqm = 0;
      } else {
        if (projectType === 'addition_existing') {
          serviceSqm = existingBuiltArea * 0.15;
        } else {
          serviceSqm = residentialSqm * 0.15;
        }
        residentialSqm -= serviceSqm;
      }

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
        residentialSqm: 0, publicBuiltSqm: 0, serviceSqm: 0, totalSqm: 0,
        estimatedUnits: null,
        notesHe: 'חסום עקב הקפאה מלאה או שימור.',
        notesEn: 'Blocked due to full freeze or preservation.',
        blocked: true,
        blockReasonHe: hasFullFreeze ? 'הקפאה מלאה' : 'שימור מחמיר',
        blockReasonEn: hasFullFreeze ? 'Full freeze' : 'Strict preservation',
      });
    } else {
      alternatives.push({
        name: 'חלופת שקד (תיקון 139)',
        nameEn: 'Shaked Alternative (Amendment 139)',
        residentialSqm: 0, publicBuiltSqm: 0, serviceSqm: 0, totalSqm: 0,
        estimatedUnits: null,
        notesHe: 'לא זמין — העיר פועלת במסלול תמ"א 38.',
        notesEn: 'Not available — city is on TAMA 38 track.',
        blocked: true,
        blockReasonHe: 'העיר לא אימצה חלופת שקד',
        blockReasonEn: 'City has not adopted Shaked Alternative',
      });
    }

    // ── Step 6: Additional Red Flags ──
    if (hasDensityCap && densityCapValue !== null) {
      const plotDunam = plotArea / 1000;
      const maxFromCap = Math.floor(densityCapValue * plotDunam);
      if (baseCalc.maxUnits > maxFromCap) {
        redFlags.push({
          code: 'DENSITY_EXCEEDS_CAP',
          severity: 'strong_risk',
          messageHe: `תקרת צפיפות ${densityCapValue} יח"ד/דונם × ${fmtDec(plotDunam)} דונם = ${maxFromCap} יח"ד מקס. החישוב מציע ${baseCalc.maxUnits} — חריגה.`,
          messageEn: `Density cap ${densityCapValue} units/dunam × ${fmtDec(plotDunam)} dunam = ${maxFromCap} max units. Calculation suggests ${baseCalc.maxUnits} — exceeds cap.`,
          source: '§77 Density',
        });
      }
    }

    if (isPeripheryOrSeismic) {
      redFlags.push({
        code: 'SEISMIC_ZONE',
        severity: 'attention',
        messageHe: 'אזור פריפריה/סייסמי — מכפיל מוגבר (עד 550%) זמין. חובת תכנון עמיד רעידות אדמה.',
        messageEn: 'Periphery/seismic zone — increased multiplier (up to 550%) available. Earthquake-resistant design required.',
        source: 'Seismic',
      });
    }

    const result: StatutoryResult = {
      metroZone,
      overrideContext: ctx,
      alternatives,
      redFlags,
      areaModel,
    };

    // Notify parent
    onResult?.(result);

    return result;
  }, [baseCalc, metroDistanceRaw, submissionDateRaw, existingBuiltAreaRaw, city, projectType,
      hasFullFreeze, hasTama38Freeze, hasDensityCap, densityCapValueRaw, hasRataHeightCone,
      hasStrictPreservation, hasSection23Override, isPeripheryOrSeismic, cityConfig, plotArea, onResult]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          <Shield className="w-4 h-4" style={{ color: '#7c3aed' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
            {t('מנוע סטטוטורי — ניתוח תכנוני מתקדם', 'Statutory Engine — Advanced Planning Analysis')}
          </h3>
          <p className="text-[10px]" style={{ color: '#6b7280' }}>
            {t(
              'היררכיית תוכניות, הקפאות, מגבלות ו-3 חלופות זכויות',
              'Plan hierarchy, freezes, constraints & 3 rights alternatives'
            )}
          </p>
        </div>
      </div>

      {/* ── Inputs (always visible — NOT in a collapsible) ── */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
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
                onClick={() => setProjectType('demolish_rebuild')}
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
                onClick={() => setProjectType('addition_existing')}
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
              onChange={(e) => setSubmissionDateRaw(e.target.value)}
              style={inputStyle}
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
              onChange={(e) => setExistingBuiltAreaRaw(commaFormat(e.target.value))}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
            />
          </div>
        </div>

        {/* Metro Distance & Density Cap */}
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
              }}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
            />
            {metroDistanceRaw && (
              <p className="text-[10px] mt-1 flex items-center gap-1" style={{
                color: classifyMetroZone(parseFloat(metroDistanceRaw)) === 'core_100m' ? '#dc2626' :
                  classifyMetroZone(parseFloat(metroDistanceRaw)) === 'outside' ? '#9ca3af' : '#d97706'
              }}>
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
                onClick={() => setHasDensityCap(!hasDensityCap)}
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
                  onChange={(e) => setDensityCapValueRaw(e.target.value.replace(/[^\d.]/g, ''))}
                  className="flex-1"
                  style={{ ...inputStyle, padding: '6px 10px' }}
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
              { state: hasFullFreeze, setter: () => setHasFullFreeze(!hasFullFreeze), label: t('הקפאה מלאה (§78)', 'Full Freeze (§78)'), icon: Ban, color: '#ef4444' },
              { state: hasTama38Freeze, setter: () => setHasTama38Freeze(!hasTama38Freeze), label: t('הקפאת תמ"א 38', 'TAMA 38 Freeze'), icon: Ban, color: '#f59e0b' },
              { state: hasRataHeightCone, setter: () => setHasRataHeightCone(!hasRataHeightCone), label: t('מגבלת גובה רט"א', 'RATA Height Cone'), icon: Plane, color: '#ef4444' },
              { state: hasStrictPreservation, setter: () => setHasStrictPreservation(!hasStrictPreservation), label: t('שימור מחמיר', 'Strict Preservation'), icon: Landmark, color: '#ef4444' },
              { state: hasSection23Override, setter: () => setHasSection23Override(!hasSection23Override), label: t('תוכנית סעיף 23', 'Section 23 Plan'), icon: Shield, color: '#f59e0b' },
              { state: isPeripheryOrSeismic, setter: () => setIsPeripheryOrSeismic(!isPeripheryOrSeismic), label: t('פריפריה / אזור סייסמי', 'Periphery / Seismic Zone'), icon: Zap, color: '#3b82f6' },
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

      {/* ── Results (immediately visible after baseCalc) ── */}
      {statutory && (
        <>
          {/* Override Status Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
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

          {/* ── Rights Comparison (3 Alternatives) — ALWAYS visible ── */}
          {statutory.alternatives.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4" style={{ color: PURPLE }} />
                <h4 className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                  {t('השוואת חלופות זכויות', 'Rights Alternatives Comparison')}
                </h4>
              </div>

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

                      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: '#9ca3af' }}>
                        {t(alt.notesHe, alt.notesEn)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Red Flags Matrix ── */}
          {statutory.redFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" style={{ color: '#d97706' }} />
                <h4 className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                  {t('מפת דגלים אדומים', 'Red Flags Matrix')}
                </h4>
              </div>

              <div className="space-y-2 mb-3">
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

              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-2">
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
        </>
      )}
    </div>
  );
}
