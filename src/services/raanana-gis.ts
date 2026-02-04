export interface BuildingFileData {
  builtArea: number;
  floors: number;
  units: number;
  fileNumber?: string;
  source: 'raanana_gis';
}

const RAANANA_GIS_BASE_URL = process.env.RAANANA_GIS_BASE_URL;

export async function getRaananaBuildingFile(
  block: string,
  parcel: string
): Promise<BuildingFileData | null> {
  if (!RAANANA_GIS_BASE_URL) return null;

  try {
    const response = await fetch(
      `${RAANANA_GIS_BASE_URL}/building-files?gush=${block}&helka=${parcel}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data) return null;

    return {
      builtArea: data.builtArea ?? 0,
      floors: data.floors ?? 0,
      units: data.units ?? 0,
      fileNumber: data.fileNumber,
      source: 'raanana_gis',
    };
  } catch {
    console.error('[RAANANA GIS] Building file query failed');
    return null;
  }
}
