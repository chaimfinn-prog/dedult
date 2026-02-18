import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase-client';

// ── Types ────────────────────────────────────────────────────

export interface DataRecord {
  [key: string]: string | number | boolean | null | undefined;
}

// ── Cache ────────────────────────────────────────────────────

const tableCache: Map<string, { data: DataRecord[]; ts: number }> = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── Fetch & Parse ────────────────────────────────────────────

async function fetchTable(fileName: string): Promise<DataRecord[]> {
  const cached = tableCache.get(fileName);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const storageRef = ref(storage, fileName);
    const url = await getDownloadURL(storageRef);
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Failed to fetch ${fileName}: ${res.status}`);
      return cached?.data ?? [];
    }

    const text = await res.text();
    const data = parseCSV(text);
    tableCache.set(fileName, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.error(`Error fetching table ${fileName}:`, err);
    return cached?.data ?? [];
  }
}

// ── CSV Parser ───────────────────────────────────────────────

function parseCSV(text: string): DataRecord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records: DataRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record: DataRecord = {};
    headers.forEach((h, idx) => {
      const val = values[idx]?.trim() ?? '';
      // Auto-detect numbers
      const num = Number(val);
      record[h.trim()] = val === '' ? null : !isNaN(num) && val !== '' ? num : val;
    });
    records.push(record);
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// ── Normalize Hebrew text for matching ───────────────────────

function normalize(text: string): string {
  return text
    .replace(/[\u0591-\u05C7]/g, '')  // strip niqqud
    .replace(/['"״׳]/g, '')           // strip quotes
    .replace(/[-–—]/g, ' ')           // normalize dashes
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ── Public API ───────────────────────────────────────────────

/** Fetch both data tables from Firebase Storage */
export async function loadTables(): Promise<{
  table1: DataRecord[];
  table2: DataRecord[];
}> {
  const [table1, table2] = await Promise.all([
    fetchTable('table1.csv'),
    fetchTable('table2.csv'),
  ]);
  return { table1, table2 };
}

/** Search by address/complex across both tables */
export async function searchByAddress(query: string): Promise<{
  matches: DataRecord[];
  source: string;
}> {
  const { table1, table2 } = await loadTables();
  const q = normalize(query);

  const matches: DataRecord[] = [];
  const allRecords = [
    ...table1.map((r) => ({ ...r, _source: 'table1' })),
    ...table2.map((r) => ({ ...r, _source: 'table2' })),
  ];

  for (const record of allRecords) {
    const values = Object.values(record)
      .filter((v): v is string => typeof v === 'string')
      .map(normalize);

    if (values.some((v) => v.includes(q) || q.includes(v))) {
      matches.push(record);
    }
  }

  return { matches, source: 'firebase-storage' };
}

/** Search by entrepreneur/developer name across both tables */
export async function searchByEntrepreneur(name: string): Promise<{
  matches: DataRecord[];
  source: string;
}> {
  const { table1, table2 } = await loadTables();
  const q = normalize(name);

  const matches: DataRecord[] = [];
  const allRecords = [
    ...table1.map((r) => ({ ...r, _source: 'table1' })),
    ...table2.map((r) => ({ ...r, _source: 'table2' })),
  ];

  for (const record of allRecords) {
    const values = Object.values(record)
      .filter((v): v is string => typeof v === 'string')
      .map(normalize);

    if (values.some((v) => v.includes(q))) {
      matches.push(record);
    }
  }

  return { matches, source: 'firebase-storage' };
}

/** Get a specific field value from matched records */
export function extractField(
  records: DataRecord[],
  fieldName: string
): (string | number | null)[] {
  return records
    .map((r) => {
      // Try exact match
      if (r[fieldName] !== undefined) return r[fieldName] as string | number | null;
      // Try normalized key match
      const normalizedField = normalize(fieldName);
      const key = Object.keys(r).find((k) => normalize(k) === normalizedField);
      return key ? (r[key] as string | number | null) : null;
    })
    .filter((v) => v !== null && v !== undefined);
}

/** Clear the in-memory cache (useful for forcing refresh) */
export function clearTableCache(): void {
  tableCache.clear();
}
