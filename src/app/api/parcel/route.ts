import { NextRequest, NextResponse } from 'next/server';
import { getParcelByAddress, getParcelByCoordinates } from '@/services/govil-api';
import { findPlanByAddress } from '@/data/zoning-plans';

/**
 * API Route: /api/parcel
 * Resolves address → block, parcel, area from MAPI GIS
 * Falls back to local DB if API is unavailable
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const x = searchParams.get('x');
  const y = searchParams.get('y');

  if (!address && (!x || !y)) {
    return NextResponse.json(
      { error: 'Missing address or coordinates' },
      { status: 400 }
    );
  }

  // Try real MAPI GIS API first
  let parcelData = null;
  try {
    if (x && y) {
      parcelData = await getParcelByCoordinates(parseFloat(x), parseFloat(y));
    } else if (address) {
      parcelData = await getParcelByAddress(address);
    }
  } catch {
    console.log('[API/parcel] MAPI API unavailable, falling back to local DB');
  }

  // Fallback to local database
  if (!parcelData && address) {
    const localMapping = findPlanByAddress(address);
    if (localMapping) {
      parcelData = {
        block: localMapping.block,
        parcel: localMapping.parcel,
        area: localMapping.plotSize,
        perimeter: (localMapping.plotWidth + localMapping.plotDepth) * 2,
        x: 0,
        y: 0,
        address,
        municipality: 'רעננה',
        source: 'local_db' as const,
      };
    }
  }

  if (!parcelData) {
    return NextResponse.json(
      { error: 'Parcel not found', address },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: parcelData,
    source: parcelData.source,
    timestamp: new Date().toISOString(),
  });
}
