import { NextRequest, NextResponse } from 'next/server';

// ── TABA 416-1060052 — Ra'anana Urban Renewal Zoning Plan ────
const BUILDING_COEFFICIENT: Record<number, number> = {
  1: 5.5,
  2: 6.5,
  3: 7.5,
  4: 8.5,
  5: 9.5,
};
const COEFFICIENT_6_PLUS = 10.5;

function getCoefficient(floors: number): number {
  if (floors >= 6) return COEFFICIENT_6_PLUS;
  return BUILDING_COEFFICIENT[floors] ?? COEFFICIENT_6_PLUS;
}

function getCoveragePercent(plotAreaSqm: number): number {
  return plotAreaSqm <= 2000 ? 0.55 : 0.50;
}

// ── Statutory Decision Engine Types ──────────────────────────

type MetroZone = 'core_100m' | 'ring_1_300m' | 'ring_2_800m' | 'outside';
type RenewalTrack = 'none' | 'tama38_extension' | 'shaked_alternative';
type ProjectType = 'demolish_rebuild' | 'addition_existing';
type RedFlagSeverity = 'hard_block' | 'strong_risk' | 'attention';

interface RedFlag {
  code: string;
  severity: RedFlagSeverity;
  message: string;
  source: string;
}

interface RightsAlternative {
  name: string;
  residentialSqm: number;
  publicBuiltSqm: number;
  serviceSqm: number;
  totalSqm: number;
  estimatedUnits: number | null;
  notes: string;
  blocked: boolean;
  blockReason?: string;
}

// ── City Renewal Config ─────────────────────────────────────

interface CityRenewalConfig {
  track: RenewalTrack;
  coreMultiplier: number;
  peripheryMultiplier: number;
  publicShare: number;
}

const CITY_RENEWAL_CONFIG: Record<string, CityRenewalConfig> = {
  'רעננה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'תל אביב': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'ירושלים': { track: 'tama38_extension', coreMultiplier: 3.5, peripheryMultiplier: 5.0, publicShare: 0.10 },
  'חיפה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'באר שבע': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.15 },
  'נתניה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'ראשון לציון': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'פתח תקוה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'הרצליה': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
  'רמת גן': { track: 'shaked_alternative', coreMultiplier: 4.0, peripheryMultiplier: 5.5, publicShare: 0.12 },
};

const DEFAULT_RENEWAL: CityRenewalConfig = {
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

const SHAKED_TOTAL_AREA_CUTOFF = new Date('2025-10-30');

// ── API Handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      plotArea,
      existingFloors,
      plotWidth,
      aptsPerFloor = 7,
      isCornerPlot = false,
      blockNumber,
      parcelNumber,
      // Statutory engine inputs
      city = 'רעננה',
      projectType = 'demolish_rebuild' as ProjectType,
      metroDistanceM = null as number | null,
      submissionDate = '2026-01-01',
      existingBuiltArea = null as number | null,
      hasFullFreeze = false,
      hasTama38Freeze = false,
      hasDensityCap = false,
      densityCapValue = null as number | null,
      hasRataHeightCone = false,
      hasStrictPreservation = false,
      hasSection23Override = false,
      isPeripheryOrSeismic = false,
    } = body;

    // Validate mandatory
    if (!plotArea || !existingFloors) {
      return NextResponse.json(
        { error: 'plotArea and existingFloors are required' },
        { status: 400 }
      );
    }

    const area = Number(plotArea);
    const floors = Math.round(Number(existingFloors));

    if (area < 100 || area > 10000) {
      return NextResponse.json(
        { error: 'plotArea must be between 100 and 10,000 sqm' },
        { status: 400 }
      );
    }
    if (floors < 1 || floors > 10) {
      return NextResponse.json(
        { error: 'existingFloors must be between 1 and 10' },
        { status: 400 }
      );
    }

    // ── TABA Calculation ──────────────────────────────────
    const coveragePercent = getCoveragePercent(area);
    const coverageArea = area * coveragePercent;
    const coefficient = getCoefficient(floors);
    const baseRights = area * coveragePercent * coefficient;
    const rooftopBonus = baseRights * 0.05;
    const sharedSpaces = 50;
    const publicUseSpaces = area > 2000 ? 450 : 0;
    const totalRights = baseRights + rooftopBonus + sharedSpaces + publicUseSpaces;
    const plotDunam = area / 1000;
    const maxUnits = Math.floor(plotDunam * 45);
    const maxFloors = 1 + Math.round(coefficient) + 1;
    const numResultFloors = Math.round(coefficient);
    const apt = Number(aptsPerFloor) || 7;
    const balconies = apt * numResultFloors * 15;
    const laundryRooms = 14;
    const spacesDeductions = 120;
    const totalDeductions = balconies + laundryRooms + spacesDeductions;
    const netBuildableArea = totalRights - totalDeductions;

    const smallCount = Math.round(maxUnits * 0.3);
    const mediumCount = Math.round(maxUnits * 0.4);
    const largeCount = Math.round(maxUnits * 0.2);
    const penthouseCount = Math.max(maxUnits - smallCount - mediumCount - largeCount, 0);
    const apartmentMix = {
      small: { count: smallCount, avgSize: 65, totalArea: smallCount * 65, rooms: '≤3' },
      medium: { count: mediumCount, avgSize: 95, totalArea: mediumCount * 95, rooms: '4' },
      large: { count: largeCount, avgSize: 115, totalArea: largeCount * 115, rooms: '5' },
      penthouses: { count: penthouseCount, avgSize: 90, totalArea: penthouseCount * 90, rooms: 'PH' },
    };

    const parkingSpaces = maxUnits;
    const parkingPerLevel = area * 0.85;
    const parkingLevelsNeeded = Math.min(Math.ceil((parkingSpaces * 30) / parkingPerLevel), 5);
    const setbacks = { front: 3.0, side: isCornerPlot ? 4.0 : 3.0, rear: 3.0 };

    // ── Statutory Decision Engine ─────────────────────────
    const metroZone = classifyMetroZone(metroDistanceM);
    const cityRenewal = CITY_RENEWAL_CONFIG[city] || DEFAULT_RENEWAL;
    const existingArea = existingBuiltArea || (coverageArea * floors * 0.85);
    const subDate = new Date(submissionDate);
    const areaModel = subDate >= SHAKED_TOTAL_AREA_CUTOFF && projectType === 'demolish_rebuild'
      ? 'total_area' : 'principal_service';

    // Override context
    let canBuildTama38 = true;
    let canBuildBaseline = true;
    let canAddFloors = true;
    let canAddUnits = true;
    const redFlags: RedFlag[] = [];

    // National vetoes
    if (metroZone === 'core_100m') {
      canBuildTama38 = false;
      redFlags.push({ code: 'METRO_CORE_BLOCK', severity: 'hard_block', message: 'Parcel within 100m of Metro station. TAMA 38 absolutely blocked.', source: 'TAMA 70' });
    }
    if (metroZone === 'ring_1_300m') {
      redFlags.push({ code: 'METRO_RING1_APPROVAL', severity: 'attention', message: 'Within 300m of Metro. Special NTA approval required.', source: 'TAMA 70' });
    }
    if (metroZone === 'ring_2_800m') {
      redFlags.push({ code: 'METRO_RING2_TOD', severity: 'attention', message: 'Within 800m of Metro. TOD compliance required.', source: 'TAMA 70' });
    }
    if (hasFullFreeze) {
      canBuildBaseline = false; canBuildTama38 = false; canAddFloors = false; canAddUnits = false;
      redFlags.push({ code: 'FULL_FREEZE', severity: 'hard_block', message: 'Active §78 full freeze — all permits blocked.', source: '§78' });
    }
    if (hasTama38Freeze && !hasFullFreeze) {
      canBuildTama38 = false;
      redFlags.push({ code: 'TAMA38_FREEZE', severity: 'hard_block', message: 'Active freeze blocking TAMA 38 permits.', source: '§77-78' });
    }
    if (hasDensityCap && densityCapValue) {
      canAddUnits = false;
      redFlags.push({ code: 'DENSITY_CAP', severity: 'strong_risk', message: `Density cap: max ${densityCapValue} units/dunam.`, source: '§77' });
    }
    if (hasRataHeightCone) {
      canAddFloors = false;
      redFlags.push({ code: 'RATA_HEIGHT_VETO', severity: 'hard_block', message: 'RATA height-cone restriction. Floor addition blocked.', source: 'RATA' });
    }
    if (hasStrictPreservation) {
      canBuildBaseline = false; canBuildTama38 = false; canAddFloors = false; canAddUnits = false;
      redFlags.push({ code: 'HERITAGE_STRICT', severity: 'hard_block', message: 'Strict preservation — no construction permitted.', source: 'Heritage' });
    }
    if (hasSection23Override) {
      canBuildTama38 = false;
      redFlags.push({ code: 'SECTION_23_NO_STACKING', severity: 'attention', message: 'Section 23 plan overrides TAMA 38.', source: 'Section 23' });
    }
    if (metroZone !== 'outside') {
      redFlags.push({ code: 'METRO_LEVY', severity: 'strong_risk', message: 'Metro betterment levy ~60% may apply.', source: 'Tax' });
    }

    // Rights alternatives
    const alternatives: RightsAlternative[] = [];

    // 1. Baseline TABA
    alternatives.push({
      name: 'Baseline TABA',
      residentialSqm: Math.round(totalRights),
      publicBuiltSqm: publicUseSpaces,
      serviceSqm: 0,
      totalSqm: Math.round(totalRights),
      estimatedUnits: maxUnits,
      notes: `Approved rights per TABA 416-1060052. Coverage ${Math.round(coveragePercent * 100)}%, coefficient ${coefficient}.`,
      blocked: !canBuildBaseline,
      blockReason: !canBuildBaseline ? 'Full freeze or strict preservation' : undefined,
    });

    // 2. TAMA 38 Extension
    if (canBuildTama38) {
      const tama38Add = existingArea * 0.50;
      const tama38Res = existingArea + tama38Add;
      const tama38Srv = existingArea * 0.12;
      alternatives.push({
        name: 'TAMA 38 Extension',
        residentialSqm: Math.round(tama38Res),
        publicBuiltSqm: 0,
        serviceSqm: Math.round(tama38Srv),
        totalSqm: Math.round(tama38Res + tama38Srv),
        estimatedUnits: Math.max(1, Math.round(tama38Res / 80)),
        notes: `+50% of existing ${Math.round(existingArea)} sqm. Valid until May 2026.`,
        blocked: false,
      });
    } else {
      alternatives.push({
        name: 'TAMA 38 Extension',
        residentialSqm: 0, publicBuiltSqm: 0, serviceSqm: 0, totalSqm: 0,
        estimatedUnits: null,
        notes: 'Blocked.',
        blocked: true,
        blockReason: 'Metro core / freeze / Section 23 / preservation',
      });
    }

    // 3. Shaked Alternative
    if (cityRenewal.track === 'shaked_alternative' && !hasFullFreeze && !hasStrictPreservation) {
      const mult = isPeripheryOrSeismic ? cityRenewal.peripheryMultiplier : cityRenewal.coreMultiplier;
      const totalPerm = existingArea * mult;
      const pubSqm = totalPerm * cityRenewal.publicShare;
      let resSqm = totalPerm - pubSqm;
      let srvSqm = 0;
      if (areaModel === 'principal_service') {
        srvSqm = projectType === 'addition_existing' ? existingArea * 0.15 : resSqm * 0.15;
        resSqm -= srvSqm;
      }
      alternatives.push({
        name: 'Shaked Alternative (Amendment 139)',
        residentialSqm: Math.round(resSqm),
        publicBuiltSqm: Math.round(pubSqm),
        serviceSqm: Math.round(srvSqm),
        totalSqm: Math.round(resSqm + pubSqm + srvSqm),
        estimatedUnits: Math.max(1, Math.round(resSqm / 80)),
        notes: `${mult}× of ${Math.round(existingArea)} sqm. Public share ${Math.round(cityRenewal.publicShare * 100)}%. ${areaModel === 'total_area' ? 'Total area model.' : 'Principal+service model.'}`,
        blocked: false,
      });
    } else {
      alternatives.push({
        name: 'Shaked Alternative (Amendment 139)',
        residentialSqm: 0, publicBuiltSqm: 0, serviceSqm: 0, totalSqm: 0,
        estimatedUnits: null,
        notes: cityRenewal.track !== 'shaked_alternative' ? 'City on TAMA 38 track.' : 'Blocked.',
        blocked: true,
        blockReason: cityRenewal.track !== 'shaked_alternative' ? 'City not on Shaked track' : 'Full freeze or preservation',
      });
    }

    return NextResponse.json({
      plan: {
        number: '416-1060052',
        name: 'תב"ע להתחדשות עירונית — רעננה',
        code: 'רע/רע/ב',
        status: 'מאושר',
        approvalDate: '2025-02-25',
      },
      input: {
        plotArea: area,
        plotDunam,
        existingFloors: floors,
        aptsPerFloor: apt,
        isCornerPlot,
        blockNumber: blockNumber || null,
        parcelNumber: parcelNumber || null,
        plotWidth: plotWidth || null,
      },
      calculation: {
        coveragePercent,
        coverageArea: Math.round(coverageArea * 100) / 100,
        coefficient,
        baseRights: Math.round(baseRights * 100) / 100,
        rooftopBonus: Math.round(rooftopBonus * 100) / 100,
        sharedSpaces,
        publicUseSpaces,
        totalRights: Math.round(totalRights * 100) / 100,
      },
      results: {
        totalBuildingRights: Math.round(totalRights),
        maxUnits,
        maxFloors,
        netBuildableArea: Math.round(netBuildableArea),
      },
      deductions: {
        balconies,
        laundryRooms,
        spacesDeductions,
        totalDeductions,
      },
      apartmentMix,
      parking: {
        spacesRequired: parkingSpaces,
        undergroundLevels: parkingLevelsNeeded,
        maxLevels: 5,
        maxCoverage: 0.85,
      },
      setbacks,
      // Statutory Decision Engine output
      statutory: {
        metroZone,
        areaModel,
        overrideContext: {
          canBuildTama38,
          canBuildBaseline,
          canAddFloors,
          canAddUnits,
          renewalTrack: cityRenewal.track,
        },
        alternatives,
        redFlags,
      },
      disclaimer: 'חישוב זה מבוסס על תב"ע 416-1060052 (רע/רע/ב). לקבלת חוות דעת מקצועית מדויקת, נא להתייעץ עם אדריכל/שמאי.',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
