import { NextRequest, NextResponse } from 'next/server';

// Server-side data lookup using Firebase Storage
// Fetches CSV tables from gs://propcheck-6fa7c.firebasestorage.app
// and searches by address or entrepreneur name.

const STORAGE_BASE = 'https://firebasestorage.googleapis.com/v0/b/propcheck-6fa7c.firebasestorage.app/o';

interface DataRecord {
  [key: string]: string | number | null;
}

// ── Server-side cache ────────────────────────────────────────

const cache: Map<string, { data: DataRecord[]; ts: number }> = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchTable(fileName: string): Promise<DataRecord[]> {
  const cached = cache.get(fileName);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const encodedName = encodeURIComponent(fileName);
    const url = `${STORAGE_BASE}/${encodedName}?alt=media`;
    const res = await fetch(url, { next: { revalidate: 1800 } });

    if (!res.ok) {
      console.error(`Failed to fetch ${fileName}: ${res.status}`);
      return cached?.data ?? [];
    }

    const text = await res.text();
    const data = parseCSV(text);
    cache.set(fileName, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.error(`Error fetching ${fileName}:`, err);
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

// ── Normalize Hebrew ─────────────────────────────────────────

function normalize(text: string): string {
  return text
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/['"״׳]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ── Search ───────────────────────────────────────────────────

function searchRecords(
  records: DataRecord[],
  query: string,
  source: string
): (DataRecord & { _source: string })[] {
  const q = normalize(query);
  if (!q) return [];

  return records
    .filter((record) => {
      const values = Object.values(record)
        .filter((v): v is string => typeof v === 'string')
        .map(normalize);
      return values.some((v) => v.includes(q) || q.includes(v));
    })
    .map((r) => ({ ...r, _source: source }));
}

// ── API Handler ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const entrepreneur = searchParams.get('entrepreneur');
  const query = address || entrepreneur || '';

  if (!query.trim()) {
    return NextResponse.json(
      { error: 'Provide ?address=... or ?entrepreneur=... parameter' },
      { status: 400 }
    );
  }

  const [table1, table2] = await Promise.all([
    fetchTable('table1.csv'),
    fetchTable('table2.csv'),
  ]);

  const matches = [
    ...searchRecords(table1, query, 'table1'),
    ...searchRecords(table2, query, 'table2'),
  ];

  return NextResponse.json({
    query,
    type: address ? 'address' : 'entrepreneur',
    matchCount: matches.length,
    matches,
    tables: {
      table1Count: table1.length,
      table2Count: table2.length,
    },
  });
}
