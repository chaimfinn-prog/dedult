export const VAT_RATE = 0.18;
export const RENT_EXEMPTION_CEILING = 6_360;

// ── Mortgage Constraints ──────────────────────────────────────
export const MAX_PTI_PCT = 50;
export const PTI_RISK_THRESHOLD_PCT = 40;
export const MAX_MORTGAGE_YEARS = 30;
export const LTV_SINGLE_HOME = 0.75;
export const LTV_REPLACEMENT_HOME = 0.70;
export const LTV_INVESTMENT_OR_FOREIGN = 0.50;

// ── Linkage Surcharge ─────────────────────────────────────────
export const LINKAGE_PROTECTED_RATIO = 0.20;
export const LINKAGE_EXPOSED_CAP_RATIO = 0.40;

// ── Rental Tax ────────────────────────────────────────────────
export const FLAT_RENTAL_TAX_RATE = 0.10;

// ── Purchase Tax Brackets (2025–2026) ─────────────────────────
export const PURCHASE_TAX_BRACKETS = {
  singleHomeResident: [
    { upTo: 1_978_745, rate: 0 },
    { upTo: 2_347_040, rate: 0.035 },
    { upTo: 6_055_070, rate: 0.05 },
    { upTo: 20_183_565, rate: 0.08 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.1 },
  ],
  investorOrForeigner: [
    { upTo: 6_055_070, rate: 0.08 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.1 },
  ],
} as const;

// ── Transit Uplift Buckets ────────────────────────────────────
export const TRANSIT_UPLIFT_BUCKETS = [
  { maxMeters: 250, minPct: 6, maxPct: 12 },
  { maxMeters: 500, minPct: 3, maxPct: 6 },
  { maxMeters: 1_000, minPct: 1, maxPct: 3 },
  { maxMeters: Number.POSITIVE_INFINITY, minPct: 0, maxPct: 0 },
] as const;
