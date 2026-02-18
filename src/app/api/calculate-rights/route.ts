import { NextRequest, NextResponse } from 'next/server';

// ── TABA 416-1060052 — Ra'anana Urban Renewal Zoning Plan ────
// Building coefficient lookup by existing floors
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

    // Step 1: Coverage
    const coveragePercent = getCoveragePercent(area);
    const coverageArea = area * coveragePercent;

    // Step 2: Coefficient
    const coefficient = getCoefficient(floors);

    // Step 3: Base rights
    const baseRights = area * coveragePercent * coefficient;

    // Step 4: Bonuses
    const rooftopBonus = baseRights * 0.05;
    const sharedSpaces = 50;
    const publicUseSpaces = area > 2000 ? 450 : 0;

    // Step 5: Total rights
    const totalRights = baseRights + rooftopBonus + sharedSpaces + publicUseSpaces;

    // Step 6: Max units
    const plotDunam = area / 1000;
    const maxUnits = Math.floor(plotDunam * 45);

    // Step 7: Max floors
    const maxFloors = 1 + Math.round(coefficient) + 1; // ground + floors + basement

    // Step 8: Practical deductions
    const numResultFloors = Math.round(coefficient);
    const apt = Number(aptsPerFloor) || 7;
    const balconies = apt * numResultFloors * 15;
    const laundryRooms = 14;
    const spacesDeductions = 120;
    const totalDeductions = balconies + laundryRooms + spacesDeductions;
    const netBuildableArea = totalRights - totalDeductions;

    // Step 9: Apartment mix
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

    // Step 10: Parking
    const parkingSpaces = maxUnits;
    const parkingAreaPerSpace = 30; // ~30 sqm per space including circulation
    const parkingPerLevel = area * 0.85;
    const parkingLevelsNeeded = Math.min(
      Math.ceil((parkingSpaces * parkingAreaPerSpace) / parkingPerLevel),
      5
    );

    // Building setbacks
    const setbacks = {
      front: 3.0,
      side: isCornerPlot ? 4.0 : 3.0,
      rear: 3.0,
    };

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
      disclaimer: 'חישוב זה מבוסס על תב"ע 416-1060052 (רע/רע/ב). לקבלת חוות דעת מקצועית מדויקת, נא להתייעץ עם אדריכל/שמאי.',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
