import { describe, expect, it } from "vitest";
import { buildRankSeries, type SnapshotRow } from "./rankRace";

const rows: SnapshotRow[] = [
  { user_id: "a", bucket: "2026-06-15T10:00:00Z", total: 10, rank: 2 },
  { user_id: "b", bucket: "2026-06-15T10:00:00Z", total: 20, rank: 1 },
  { user_id: "a", bucket: "2026-06-15T12:00:00Z", total: 50, rank: 1 },
  { user_id: "b", bucket: "2026-06-15T12:00:00Z", total: 30, rank: 2 },
];

describe("buildRankSeries", () => {
  it("ממיין דליים ובונה סדרה לכל משתמש", () => {
    const d = buildRankSeries(rows);
    expect(d.buckets).toHaveLength(2);
    expect(d.maxRank).toBe(2);
    expect(d.series).toHaveLength(2);
  });
  it("המוביל האחרון ראשון בסדרה (a עקף את b)", () => {
    const d = buildRankSeries(rows);
    expect(d.series[0].userId).toBe("a");
    expect(d.series[0].lastRank).toBe(1);
  });
  it("נקודות כל משתמש ממוינות לפי זמן", () => {
    const d = buildRankSeries(rows);
    const a = d.series.find((s) => s.userId === "a")!;
    expect(a.points.map((p) => p.x)).toEqual([0, 1]);
    expect(a.points.map((p) => p.rank)).toEqual([2, 1]);
  });
  it("מערך ריק לא קורס", () => {
    const d = buildRankSeries([]);
    expect(d.buckets).toHaveLength(0);
    expect(d.series).toHaveLength(0);
  });
});
