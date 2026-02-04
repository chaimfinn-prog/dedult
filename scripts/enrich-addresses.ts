#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const MAPI_GEOCODE_URL =
  process.env.MAPI_GEOCODE_URL ??
  'https://es.govmap.gov.il/TldSearch/api/DetailsByQuery';

const MAPI_PARCEL_URL =
  process.env.MAPI_PARCEL_URL ??
  'https://ags.govmap.gov.il/Gis/ArcGIS/rest/services/Parcels/MapServer/0/query';

const GOVMAP_API_TOKEN = process.env.GOVMAP_API_TOKEN;

type CsvRow = Record<string, string>;

function parseCsv(raw: string): CsvRow[] {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return headers.reduce<CsvRow>((acc, header, idx) => {
      acc[header] = cols[idx] ?? '';
      return acc;
    }, {});
  });
}

function toCsv(rows: CsvRow[], headers: string[]): string {
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const line = headers.map((h) => row[h] ?? '').join(',');
    lines.push(line);
  });
  return lines.join('\n');
}

async function geocodeAddress(address: string): Promise<{ x: number; y: number } | null> {
  const response = await fetch(MAPI_GEOCODE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      QueryType: 'ToponymSearch',
      Query: address,
      ResultType: 'Parcel',
      ...(GOVMAP_API_TOKEN ? { Token: GOVMAP_API_TOKEN } : {}),
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data?.ResultLyr?.length) return null;
  return { x: data.ResultLyr[0].X, y: data.ResultLyr[0].Y };
}

async function getParcelByCoordinates(x: number, y: number): Promise<{
  block: string;
  parcel: string;
  subParcel?: string;
  plotSize: string;
}> {
  const params = new URLSearchParams({
    f: 'json',
    geometry: JSON.stringify({ x, y, spatialReference: { wkid: 2039 } }),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'GUSH_NUM,PARCEL,SUB_PARCEL,SHETACH_RASHUM,SHAPE_Area',
    returnGeometry: 'false',
  });
  if (GOVMAP_API_TOKEN) {
    params.set('token', GOVMAP_API_TOKEN);
  }
  const response = await fetch(`${MAPI_PARCEL_URL}?${params}`);
  if (!response.ok) throw new Error('Parcel query failed');
  const data = await response.json();
  if (!data?.features?.length) throw new Error('No parcel found');
  const attr = data.features[0].attributes;
  return {
    block: String(attr.GUSH_NUM ?? ''),
    parcel: String(attr.PARCEL ?? ''),
    subParcel: attr.SUB_PARCEL ? String(attr.SUB_PARCEL) : undefined,
    plotSize: String(attr.SHETACH_RASHUM ?? Math.round(attr.SHAPE_Area ?? 0)),
  };
}

async function run() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath) {
    console.error('Usage: node scripts/enrich-addresses.ts <input.csv> [output.csv]');
    process.exit(1);
  }

  const raw = await fs.readFile(path.resolve(inputPath), 'utf8');
  const rows = parseCsv(raw);

  const enriched: CsvRow[] = [];
  for (const row of rows) {
    const address = row.address || row['כתובת'] || '';
    if (!address) continue;
    try {
      const geo = await geocodeAddress(address);
      if (!geo) throw new Error('Geocode failed');
      const parcel = await getParcelByCoordinates(geo.x, geo.y);
      enriched.push({
        address,
        block: parcel.block,
        parcel: parcel.parcel,
        plotSize: parcel.plotSize,
        existingArea: row.existingarea ?? '',
        existingFloors: row.existingfloors ?? '',
        existingUnits: row.existingunits ?? '',
        neighborhood: row.neighborhood ?? '',
      });
    } catch (error) {
      console.error(`Failed for ${address}:`, error);
    }
  }

  const headers = [
    'address',
    'block',
    'parcel',
    'plotSize',
    'existingArea',
    'existingFloors',
    'existingUnits',
    'neighborhood',
  ];
  const csv = toCsv(enriched, headers);
  if (outputPath) {
    await fs.writeFile(path.resolve(outputPath), csv);
  } else {
    console.log(csv);
  }
}

void run();
