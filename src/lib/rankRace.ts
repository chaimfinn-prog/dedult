// ============================================================
//  rankRace.ts — הופך תצלומי דירוג (score_snapshots) לסדרות לגרף "מירוץ".
//  פונקציה טהורה (נבדקת).
// ============================================================

export interface SnapshotRow {
  user_id: string;
  bucket: string; // ISO של תחילת השעה; מצטבר לדלי יומי (YYYY-MM-DD) ב-buildRankSeries
  total: number;
  rank: number;
}

export interface RankPoint {
  x: number; // אינדקס הדלי (ציר הזמן)
  rank: number;
  total: number;
}
export interface RankSeries {
  userId: string;
  points: RankPoint[];
  lastRank: number;
  lastTotal: number;
}

export interface RankRaceData {
  buckets: string[]; // רשימת הדליים הממוינת (ציר X)
  series: RankSeries[]; // סדרה לכל משתמש
  maxRank: number;
}

/** בונה סדרות מירוץ מקומות מתוך שורות התצלומים. */
export function buildRankSeries(rows: SnapshotRow[]): RankRaceData {
  // שלב 1: צמצם לדלי יומי — לכל (user_id, יום) שמור את התצלום עם השעה המאוחרת ביותר
  const dailyBest = new Map<string, SnapshotRow>();
  for (const r of rows) {
    const day = r.bucket.slice(0, 10); // YYYY-MM-DD
    const key = `${r.user_id}|${day}`;
    const existing = dailyBest.get(key);
    if (!existing || r.bucket > existing.bucket) {
      dailyBest.set(key, { ...r, bucket: day });
    }
  }
  const aggregated = [...dailyBest.values()];

  const buckets = [...new Set(aggregated.map((r) => r.bucket))].sort();
  const idx = new Map(buckets.map((b, i) => [b, i]));
  const byUser = new Map<string, RankSeries>();

  for (const r of aggregated) {
    let s = byUser.get(r.user_id);
    if (!s) {
      s = { userId: r.user_id, points: [], lastRank: r.rank, lastTotal: r.total };
      byUser.set(r.user_id, s);
    }
    s.points.push({ x: idx.get(r.bucket) ?? 0, rank: r.rank, total: r.total });
  }

  let maxRank = 1;
  for (const s of byUser.values()) {
    s.points.sort((a, b) => a.x - b.x);
    const last = s.points[s.points.length - 1];
    s.lastRank = last.rank;
    s.lastTotal = last.total;
    for (const p of s.points) maxRank = Math.max(maxRank, p.rank);
  }

  // סדר הסדרות לפי המקום האחרון (המוביל ראשון)
  const series = [...byUser.values()].sort((a, b) => a.lastRank - b.lastRank);
  return { buckets, series, maxRank };
}

export interface RankJump {
  userId: string;
  atX: number; // אינדקס הדלי שבו קרתה הקפיצה
  delta: number; // חיובי = טיפס (המקום השתפר), שלילי = ירד
}

/**
 * מזהה קפיצות דירוג גדולות (≥ minDelta מקומות בין דלי לדלי הבא של אותו
 * משתמש) — משמש להצגת סמן/טולטיפ "למה קפצת" על גרף המירוץ.
 */
export function detectRankJumps(series: RankSeries[], minDelta = 3): RankJump[] {
  const jumps: RankJump[] = [];
  for (const s of series) {
    for (let i = 1; i < s.points.length; i++) {
      const delta = s.points[i - 1].rank - s.points[i].rank;
      if (Math.abs(delta) >= minDelta) {
        jumps.push({ userId: s.userId, atX: s.points[i].x, delta });
      }
    }
  }
  return jumps;
}
