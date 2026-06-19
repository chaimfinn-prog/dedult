// ============================================================
//  rankRace.ts — הופך תצלומי דירוג (score_snapshots) לסדרות לגרף "מירוץ".
//  פונקציה טהורה (נבדקת).
// ============================================================

export interface SnapshotRow {
  user_id: string;
  bucket: string; // ISO של תחילת השעה
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
  const buckets = [...new Set(rows.map((r) => r.bucket))].sort();
  const idx = new Map(buckets.map((b, i) => [b, i]));
  const byUser = new Map<string, RankSeries>();

  for (const r of rows) {
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
