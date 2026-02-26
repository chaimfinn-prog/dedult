import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

// ── Verified city price estimates from CBS 2024 annual report ──
// Source: דירות בעסקאות נדל"ן סיכום שנת 2024, הלמ"ס פברואר 2025
// These are ESTIMATES based on average transaction data — NOT live prices
const CITY_PRICE_ESTIMATES_2024: Record<string, number> = {
  'תל אביב': 60000,
  'תל אביב-יפו': 60000,
  'ירושלים': 45000,
  'חיפה': 22000,
  'רמת גן': 45000,
  'פתח תקווה': 28000,
  'פתח תקוה': 28000,
  'ראשון לציון': 32000,
  'נתניה': 25000,
  'אשדוד': 20000,
  'באר שבע': 15000,
  'חולון': 35000,
  'בת ים': 33000,
  'הרצליה': 45000,
  'כפר סבא': 32000,
  'רעננה': 40000,
  'נהריה': 18000,
  'עפולה': 12000,
  'בני ברק': 30000,
  'ראש העין': 32000,
  'רחובות': 28000,
  'גבעתיים': 42000,
  'הוד השרון': 33000,
  'רמת השרון': 48000,
  'כרמיאל': 16000,
  'לוד': 22000,
  'רמלה': 18000,
  'אשקלון': 17000,
  'קריית גת': 14000,
  'מודיעין': 30000,
  'אלעד': 25000,
  'קריית אונו': 38000,
};

const DEFAULT_PRICE_PER_SQM = 25000; // National average fallback

function getPriceConfidence(city: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (CITY_PRICE_ESTIMATES_2024[city] !== undefined) return 'HIGH';
  // Cities not in our list
  return 'LOW';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const city: string = body.city || '';

    if (!city) {
      return NextResponse.json(
        { error: 'Missing required field: city' },
        { status: 400 }
      );
    }

    // ── A) National CBS index (real data) ──
    let cbsIndex: Record<string, unknown> = {};
    try {
      const projectRoot = path.resolve(process.cwd());
      const pythonCode = [
        'import sys, json',
        `sys.path.insert(0, ${JSON.stringify(projectRoot)})`,
        'from rights_engine.adapters.cbs_price_adapter import get_cbs_price_index',
        'result = get_cbs_price_index()',
        'print(json.dumps(result, ensure_ascii=False))',
      ].join('; ');

      const { stdout } = await execFileAsync('python3', ['-c', pythonCode], {
        timeout: 15000,
        env: { ...process.env, PYTHONPATH: projectRoot },
      });
      if (stdout.trim()) {
        cbsIndex = JSON.parse(stdout.trim());
      }
    } catch {
      cbsIndex = { error: 'CBS API unavailable' };
    }

    // ── B) City price estimate (derived, not live) ──
    const pricePerSqm = CITY_PRICE_ESTIMATES_2024[city] ?? DEFAULT_PRICE_PER_SQM;
    const confidence = getPriceConfidence(city);

    return NextResponse.json({
      city,
      priceData: {
        national_index: {
          ...(cbsIndex as object),
          source_label: 'הלמ"ס רשמי',
        },
        city_estimate: {
          price_per_sqm: pricePerSqm,
          confidence,
          source: 'הלמ"ס 2024 — ממוצע שנתי — אינו מחיר עסקה ספציפי',
          disclaimer:
            'נתון זה הוא הערכה המבוססת על דוח הלמ"ס השנתי 2024. ' +
            'לנתוני עסקאות ספציפיות בקר ב-nadlan.gov.il',
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch price data', details: message },
      { status: 500 }
    );
  }
}
