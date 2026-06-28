import { describe, expect, it } from "vitest";
import { buildRankSeries, type SnapshotRow } from "./rankRace";

// Two hourly snapshots on the same day — daily aggregation should collapse them
// into one point per user using the LAST (latest) hourly snapshot.
const rows: SnapshotRow[] = [
  { user_id: "a", bucket: "2026-06-15T10:00:00Z", total: 10, rank: 2 },
  { user_id: "b", bucket: "2026-06-15T10:00:00Z", total: 20, rank: 1 },
  { user_id: "a", bucket: "2026-06-15T12:00:00Z", total: 50, rank: 1 },
  { user_id: "b", bucket: "2026-06-15T12:00:00Z", total: 30, rank: 2 },
];

// Two snapshots across two different days
const multiDayRows: SnapshotRow[] = [
  { user_id: "a", bucket: "2026-06-15T10:00:00Z", total: 10, rank: 2 },
  { user_id: "b", bucket: "2026-06-15T10:00:00Z", total: 20, rank: 1 },
  { user_id: "a", bucket: "2026-06-16T08:00:00Z", total: 50, rank: 1 },
  { user_id: "b", bucket: "2026-06-16T08:00:00Z", total: 30, rank: 2 },
];

describe("buildRankSeries", () => {
  it("צמצם שעות לדלי יומי אחד — שני תצלומים באותו יום נהיים נקודה אחת", () => {
    const d = buildRankSeries(rows);
    // Both hourly snapshots are on 2026-06-15 → collapsed to 1 daily bucket
    expect(d.buckets).toHaveLength(1);
    expect(d.buckets[0]).toBe("2026-06-15");
    expect(d.series).toHaveLength(2);
  });

  it("שומר את התצלום המאוחר ביותר של היום (שעה 12 ולא שעה 10)", () => {
    const d = buildRankSeries(rows);
    // The 12:00 snapshot has a=rank1, b=rank2
    const a = d.series.find((s) => s.userId === "a")!;
    const b = d.series.find((s) => s.userId === "b")!;
    expect(a.points[0].rank).toBe(1);
    expect(b.points[0].rank).toBe(2);
  });

  it("המוביל האחרון ראשון בסדרה", () => {
    const d = buildRankSeries(rows);
    expect(d.series[0].userId).toBe("a");
    expect(d.series[0].lastRank).toBe(1);
  });

  it("ימים שונים מניבים דליים שונים", () => {
    const d = buildRankSeries(multiDayRows);
    expect(d.buckets).toHaveLength(2);
    expect(d.buckets).toEqual(["2026-06-15", "2026-06-16"]);
    expect(d.maxRank).toBe(2);
  });

  it("נקודות כל משתמש ממוינות לפי זמן (ימים שונים)", () => {
    const d = buildRankSeries(multiDayRows);
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
