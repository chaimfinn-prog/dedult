import { NextRequest, NextResponse } from 'next/server';
import { addressMappings } from '@/data/zoning-plans';
import { getRaananaBuildingFile } from '@/services/raanana-gis';

/**
 * API Route: /api/building-file
 * Gets built-area data from Raanana GIS / building files
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

  let buildingFile = null;
  if (block && parcel) {
    buildingFile = await getRaananaBuildingFile(block, parcel);
  }

  if (!buildingFile) {
    const mapping = address
      ? addressMappings.find((m) => m.address.includes(address))
      : addressMappings.find(
          (m) => m.block === block && m.parcel === parcel
        );

    if (mapping) {
      buildingFile = {
        builtArea: mapping.existingArea,
        floors: mapping.existingFloors,
        units: mapping.existingUnits,
        fileNumber: mapping.yearBuilt ? `RN-${mapping.yearBuilt}-${mapping.block}-${mapping.parcel}` : undefined,
        source: 'local_db' as const,
      };
    }
  }

  if (!buildingFile) {
    return NextResponse.json(
      { error: 'No building file found', block, parcel },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: buildingFile,
    source: buildingFile.source,
    timestamp: new Date().toISOString(),
  });
}
