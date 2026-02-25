import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/property-search
 * Accepts city, street, gush/helka and returns normalized property data.
 * Currently returns structured mock data; will connect to GovMap WFS in production.
 */

interface PropertySearchResult {
  city: string;
  street?: string;
  gush?: string;
  helka?: string;
  plotAreaSqm?: number;
  existingFloors?: number;
  existingBuiltSqm?: number;
  tabaNumber?: string;
  tabaLabel?: string;
  lat?: number;
  lon?: number;
}

// Known city → TABA mappings
const CITY_TABA: Record<string, { tabaNumber: string; tabaLabel: string }> = {
  'רעננה': { tabaNumber: '416-1060052', tabaLabel: 'תב"ע רע/רע/ב' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, street, gush, helka } = body;

    if (!city && !gush) {
      return NextResponse.json(
        { error: 'Must provide city or gush/helka' },
        { status: 400 }
      );
    }

    const result: PropertySearchResult = {
      city: city || '',
      street: street || undefined,
      gush: gush || undefined,
      helka: helka || undefined,
    };

    // Look up TABA config for the city
    if (city && CITY_TABA[city]) {
      result.tabaNumber = CITY_TABA[city].tabaNumber;
      result.tabaLabel = CITY_TABA[city].tabaLabel;
    }

    // In production, this would call GovMap WFS to get parcel geometry and area.
    // For now, return the structured search result.

    return NextResponse.json({
      success: true,
      property: result,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
