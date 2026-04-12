interface Cashflow {
  date: string;
  amountNis: number;
}

interface NormalizedCashflow {
  t: number; // time in years from start
  c: number; // amount
}

const DAYS_PER_YEAR = 365;
const NEWTON_MAX_ITER = 60;
const BISECTION_MAX_ITER = 120;
const CONVERGENCE_THRESHOLD = 1e-8;
const NPV_TOLERANCE = 1e-7;
const MIN_RATE = -0.9;
const DERIVATIVE_FLOOR = 1e-10;

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function npv(rate: number, cashflows: NormalizedCashflow[]): number {
  return cashflows.reduce((acc, { t, c }) => acc + c / Math.pow(1 + rate, t), 0);
}

function dNpv(rate: number, cashflows: NormalizedCashflow[]): number {
  return cashflows.reduce((acc, { t, c }) => acc - (t * c) / Math.pow(1 + rate, t + 1), 0);
}

function normalizeCashflows(cashflows: Cashflow[]): NormalizedCashflow[] {
  const sorted = [...cashflows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const start = new Date(sorted[0].date);
  return sorted.map((cf) => ({
    t: Math.max(daysBetween(start, new Date(cf.date)), 0) / DAYS_PER_YEAR,
    c: cf.amountNis,
  }));
}

function initialGuess(series: NormalizedCashflow[]): number {
  const totalPositive = series.filter((x) => x.c > 0).reduce((s, x) => s + x.c, 0);
  const totalNegative = Math.abs(series.filter((x) => x.c < 0).reduce((s, x) => s + x.c, 0));
  const centroid =
    series.filter((x) => x.c > 0).reduce((s, x) => s + x.t * x.c, 0) / (totalPositive || 1);
  return Math.max(
    Math.pow((totalPositive || 1) / (totalNegative || 1), 1 / Math.max(centroid, 1)) - 1,
    MIN_RATE,
  );
}

function solveNewton(series: NormalizedCashflow[], guess: number): number | null {
  let rate = guess;

  for (let i = 0; i < NEWTON_MAX_ITER; i++) {
    const f = npv(rate, series);
    const df = dNpv(rate, series);
    if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < DERIVATIVE_FLOOR) break;
    const next = rate - f / df;
    if (!Number.isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - rate) < CONVERGENCE_THRESHOLD) return next * 100;
    rate = next;
  }

  return null;
}

function solveBisection(series: NormalizedCashflow[]): number {
  let lo = MIN_RATE;
  let hi = 1.5;
  let fLo = npv(lo, series);
  let fHi = npv(hi, series);

  for (let i = 0; i < 40 && fLo * fHi > 0; i++) {
    hi += 0.5;
    fHi = npv(hi, series);
  }

  for (let i = 0; i < BISECTION_MAX_ITER; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, series);
    if (Math.abs(fMid) < NPV_TOLERANCE) return mid * 100;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
    if (Math.abs(hi - lo) < CONVERGENCE_THRESHOLD) break;
  }

  return ((lo + hi) / 2) * 100;
}

export function solveXirr(cashflows: Cashflow[]): number {
  if (cashflows.length < 2) return 0;

  const series = normalizeCashflows(cashflows);
  const guess = initialGuess(series);

  const newtonResult = solveNewton(series, guess);
  if (newtonResult !== null) return newtonResult;

  return solveBisection(series);
}
