export const VAT_RATE = 0.18;
export const RENT_EXEMPTION_CEILING = 6360;

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
};

export const TRANSIT_UPLIFT_BUCKETS = [
  { maxMeters: 250, minPct: 6, maxPct: 12 },
  { maxMeters: 500, minPct: 3, maxPct: 6 },
  { maxMeters: 1000, minPct: 1, maxPct: 3 },
  { maxMeters: Number.POSITIVE_INFINITY, minPct: 0, maxPct: 0 },
];
