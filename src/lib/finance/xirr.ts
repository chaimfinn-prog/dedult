interface Cashflow {
  date: string;
  amountNis: number;
}

function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function npv(rate: number, cashflows: Array<{ t: number; c: number }>) {
  return cashflows.reduce((acc, { t, c }) => acc + c / Math.pow(1 + rate, t), 0);
}

function dNpv(rate: number, cashflows: Array<{ t: number; c: number }>) {
  return cashflows.reduce((acc, { t, c }) => acc - (t * c) / Math.pow(1 + rate, t + 1), 0);
}

export function solveXirr(cashflows: Cashflow[]): number {
  if (cashflows.length < 2) return 0;

  const sorted = [...cashflows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const start = new Date(sorted[0].date);
  const series = sorted.map((cf) => ({
    t: Math.max(daysBetween(start, new Date(cf.date)), 0) / 365,
    c: cf.amountNis,
  }));

  const totalPositive = series.filter((x) => x.c > 0).reduce((s, x) => s + x.c, 0);
  const totalNegative = Math.abs(series.filter((x) => x.c < 0).reduce((s, x) => s + x.c, 0));
  const centroid = series.filter((x) => x.c > 0).reduce((s, x) => s + x.t * x.c, 0) / (totalPositive || 1);
  let rate = Math.max(Math.pow((totalPositive || 1) / (totalNegative || 1), 1 / Math.max(centroid, 1)) - 1, -0.9);

  for (let i = 0; i < 60; i++) {
    const f = npv(rate, series);
    const df = dNpv(rate, series);
    if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-10) break;
    const next = rate - f / df;
    if (!Number.isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - rate) < 1e-8) return next * 100;
    rate = next;
  }

  let lo = -0.9;
  let hi = 1.5;
  let fLo = npv(lo, series);
  let fHi = npv(hi, series);

  for (let i = 0; i < 40 && fLo * fHi > 0; i++) {
    hi += 0.5;
    fHi = npv(hi, series);
  }

  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, series);
    if (Math.abs(fMid) < 1e-7) return mid * 100;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
    if (Math.abs(hi - lo) < 1e-8) break;
  }

  return ((lo + hi) / 2) * 100;
}
