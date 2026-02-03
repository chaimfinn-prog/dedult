import { NextRequest, NextResponse } from 'next/server';
import { getExistingPermits } from '@/services/govil-api';
import { addressMappings } from '@/data/zoning-plans';

/**
 * API Route: /api/permits
 * Gets existing building permits from Rishui Zamin
 * Falls back to local DB for known addresses
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const block = searchParams.get('block');
  const parcel = searchParams.get('parcel');
  const address = searchParams.get('address');

  if (!block && !address) {
    return NextResponse.json(
      { error: 'Missing block/parcel or address' },
      { status: 400 }
    );
  }

  // Try Rishui Zamin API first
  let permitData = null;
  if (block && parcel) {
    try {
      permitData = await getExistingPermits(block, parcel);
    } catch {
      console.log('[API/permits] Rishui Zamin unavailable, using local DB');
    }
  }

  // Fallback to local database
  if (!permitData) {
    const mapping = address
      ? addressMappings.find((m) => m.address.includes(address))
      : addressMappings.find(
          (m) => m.block === block && m.parcel === parcel
        );

    if (mapping) {
      permitData = {
        permitNumber: `${mapping.block}/${mapping.parcel}/001`,
        permitDate: mapping.yearBuilt ? `${mapping.yearBuilt}-01-01` : '',
        totalBuiltArea: mapping.existingArea,
        floors: mapping.existingFloors,
        units: mapping.existingUnits,
        status: 'מאושר',
        source: 'local_db' as const,
      };
    }
  }

  if (!permitData) {
    return NextResponse.json(
      { error: 'No permits found', block, parcel },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: permitData,
    source: permitData.source,
    timestamp: new Date().toISOString(),
  });
}
