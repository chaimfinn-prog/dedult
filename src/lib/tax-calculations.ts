/**
 * Israel Purchase Tax (מס רכישה) — 2026 brackets.
 *
 * Source: Israel Tax Authority official brackets for 2026.
 * Two tracks: single apartment (דירה יחידה) vs additional apartment (דירה נוספת/משקיע).
 *
 * IMPORTANT: is_single_apartment is MANDATORY — no defaults.
 */

import type { ComputeResult } from './compute-result';

// ── 2026 Single Apartment Brackets (דירה יחידה) ──
const SINGLE_BRACKETS_2026 = [
  { from: 0,          to: 1_978_745,  rate: 0.00 },
  { from: 1_978_745,  to: 2_347_040,  rate: 0.035 },
  { from: 2_347_040,  to: 6_055_070,  rate: 0.05 },
  { from: 6_055_070,  to: 20_000_000, rate: 0.08 },
  { from: 20_000_000, to: Infinity,   rate: 0.10 },
];

// ── 2026 Additional/Investor Apartment Brackets (דירה נוספת) ──
const INVESTOR_BRACKETS_2026 = [
  { from: 0,          to: 6_055_070,  rate: 0.08 },
  { from: 6_055_070,  to: Infinity,   rate: 0.10 },
];

export interface TaxBracketDetail {
  from: number;
  to: number;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface PurchaseTaxResult {
  total: number;
  effectiveRatePct: number;
  brackets: TaxBracketDetail[];
  isSingleApartment: boolean;
}

export interface AcquisitionCostResult {
  purchasePrice: number;
  purchaseTax: PurchaseTaxResult;
  agentFee: number;
  agentFeeNote: string;
  attorneyEstimate: { min: number; max: number };
  attorneyNote: string;
  mortgageRegistration: number;
  mortgageRegistrationNote: string;
  totalAcquisitionCost: number;
  notes: string[];
}

/**
 * Calculate purchase tax for a given price and apartment status.
 *
 * @param price - Purchase price in ₪
 * @param isSingleApartment - true for דירה יחידה, false for דירה נוספת/משקיע.
 *                            MUST be explicitly provided — no default.
 */
export function calcPurchaseTax(price: number, isSingleApartment: boolean): PurchaseTaxResult {
  if (price < 0) {
    return { total: 0, effectiveRatePct: 0, brackets: [], isSingleApartment };
  }

  const brackets = isSingleApartment ? SINGLE_BRACKETS_2026 : INVESTOR_BRACKETS_2026;
  const details: TaxBracketDetail[] = [];
  let totalTax = 0;

  for (const b of brackets) {
    if (price <= b.from) break;
    const cappedTo = Math.min(price, b.to);
    const taxableAmount = cappedTo - b.from;
    const tax = taxableAmount * b.rate;
    totalTax += tax;
    details.push({
      from: b.from,
      to: b.to === Infinity ? price : b.to,
      rate: b.rate,
      taxableAmount,
      tax,
    });
  }

  return {
    total: Math.round(totalTax),
    effectiveRatePct: price > 0 ? Math.round((totalTax / price) * 10000) / 100 : 0,
    brackets: details,
    isSingleApartment,
  };
}

/**
 * Calculate total acquisition costs including tax, agent, attorney, mortgage registration.
 */
export function calcAcquisitionCosts(
  price: number,
  isSingleApartment: boolean,
): ComputeResult<AcquisitionCostResult> {
  if (price <= 0) {
    return { status: 'CANNOT_COMPUTE', reason: 'מחיר רכישה חייב להיות חיובי' };
  }

  const purchaseTax = calcPurchaseTax(price, isSingleApartment);
  const agentFee = Math.round(price * 0.02 * 1.17); // 2% + 17% VAT = 2.34%
  const attorneyMin = Math.round(price * 0.005);
  const attorneyMax = Math.round(price * 0.01);
  const mortgageRegistration = Math.round(price * 0.0025);

  const totalAcquisitionCost = price + purchaseTax.total + agentFee + attorneyMax + mortgageRegistration;

  return {
    status: 'OK',
    confidence: 'HIGH',
    warnings: [],
    data: {
      purchasePrice: price,
      purchaseTax,
      agentFee,
      agentFeeNote: 'תיווך — מקובל בשוק, לא חובה',
      attorneyEstimate: { min: attorneyMin, max: attorneyMax },
      attorneyNote: 'הערכה — מחיר עו"ד משתנה',
      mortgageRegistration,
      mortgageRegistrationNote: 'אגרת רישום משכנתה',
      totalAcquisitionCost,
      notes: ['עמלת עו"ד היא הערכה בלבד — הסכום הסופי תלוי במשרד עורכי הדין.'],
    },
  };
}

// ── Yield Calculation ──

export interface YieldInputs {
  purchasePrice: number;
  monthlyRent: number;
  mortgageAmount?: number;
  managementPct?: number;   // default 8%
  annualMaintenance?: number; // default ₪4,500
  annualInsurance?: number;   // default ₪1,500
}

export interface YieldResult {
  grossYieldPct: number;
  netYieldPct: number;
  cashOnCashPct: number | null; // null if no mortgage / equity = purchase price
  annualGrossIncome: number;
  annualExpenses: number;
  annualNetIncome: number;
  equityInvested: number;
  rentTaxOptions: {
    exemptUnderThreshold: boolean;
    threshold: number;
    option10PctFlat: number;
    option10PctOnExcess: number;
  };
}

const RENT_TAX_THRESHOLD_2026 = 5_654; // monthly, per 2026

export function calcYield(inputs: YieldInputs): ComputeResult<YieldResult> {
  const { purchasePrice, monthlyRent } = inputs;
  if (purchasePrice <= 0) {
    return { status: 'CANNOT_COMPUTE', reason: 'מחיר רכישה חייב להיות חיובי' };
  }
  if (monthlyRent <= 0) {
    return { status: 'CANNOT_COMPUTE', reason: 'שכירות חודשית חייבת להיות חיובית' };
  }

  const managementPct = inputs.managementPct ?? 0.08;
  const annualMaintenance = inputs.annualMaintenance ?? 4_500;
  const annualInsurance = inputs.annualInsurance ?? 1_500;
  const mortgageAmount = inputs.mortgageAmount ?? 0;

  const annualGrossIncome = monthlyRent * 12;
  const managementFee = annualGrossIncome * managementPct;
  const annualExpenses = managementFee + annualMaintenance + annualInsurance;
  const annualNetIncome = annualGrossIncome - annualExpenses;

  const equityInvested = purchasePrice - mortgageAmount;

  const grossYieldPct = (annualGrossIncome / purchasePrice) * 100;
  const netYieldPct = (annualNetIncome / purchasePrice) * 100;
  const cashOnCashPct = equityInvested > 0 ? (annualNetIncome / equityInvested) * 100 : null;

  // Rent tax calculation
  const exemptUnderThreshold = monthlyRent <= RENT_TAX_THRESHOLD_2026;
  const option10PctFlat = annualGrossIncome * 0.10;
  const option10PctOnExcess = monthlyRent > RENT_TAX_THRESHOLD_2026
    ? (monthlyRent - RENT_TAX_THRESHOLD_2026) * 12 * 0.10
    : 0;

  const warnings: string[] = [];
  if (inputs.annualMaintenance === undefined) warnings.push('עלות אחזקה שנתית: הערכה — ₪4,500');
  if (inputs.annualInsurance === undefined) warnings.push('ביטוח שנתי: הערכה — ₪1,500');

  return {
    status: 'OK',
    confidence: warnings.length > 0 ? 'MEDIUM' : 'HIGH',
    warnings,
    data: {
      grossYieldPct: Math.round(grossYieldPct * 100) / 100,
      netYieldPct: Math.round(netYieldPct * 100) / 100,
      cashOnCashPct: cashOnCashPct !== null ? Math.round(cashOnCashPct * 100) / 100 : null,
      annualGrossIncome,
      annualExpenses: Math.round(annualExpenses),
      annualNetIncome: Math.round(annualNetIncome),
      equityInvested,
      rentTaxOptions: {
        exemptUnderThreshold,
        threshold: RENT_TAX_THRESHOLD_2026,
        option10PctFlat: Math.round(option10PctFlat),
        option10PctOnExcess: Math.round(option10PctOnExcess),
      },
    },
  };
}
