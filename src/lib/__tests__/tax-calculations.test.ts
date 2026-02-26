import { describe, it, expect } from 'vitest';
import { calcPurchaseTax, calcAcquisitionCosts, calcYield } from '../tax-calculations';

describe('calcPurchaseTax', () => {
  // ── Single Apartment (דירה יחידה) ──

  it('returns 0 for single apartment under threshold (₪1,500,000)', () => {
    const result = calcPurchaseTax(1_500_000, true);
    expect(result.total).toBe(0);
    expect(result.effectiveRatePct).toBe(0);
    expect(result.isSingleApartment).toBe(true);
  });

  it('returns correct tax for ₪2,000,000 single apartment', () => {
    // 0% on first 1,978,745 = 0
    // 3.5% on (2,000,000 - 1,978,745) = 3.5% × 21,255 = 743.925 → rounds to 744
    const result = calcPurchaseTax(2_000_000, true);
    expect(result.total).toBe(744);
    expect(result.brackets).toHaveLength(2);
    expect(result.brackets[0].tax).toBe(0);
    expect(result.brackets[1].tax).toBeCloseTo(743.925, 0);
  });

  it('returns correct tax for ₪3,000,000 single apartment', () => {
    // 0% on first 1,978,745 = 0
    // 3.5% on (2,347,040 - 1,978,745) = 3.5% × 368,295 = 12,890.325
    // 5% on (3,000,000 - 2,347,040) = 5% × 652,960 = 32,648
    // Total = 12,890.325 + 32,648 = 45,538.325 → rounds to 45,538
    const result = calcPurchaseTax(3_000_000, true);
    expect(result.total).toBe(45538);
    expect(result.brackets).toHaveLength(3);
  });

  it('returns correct tax for ₪10,000,000 single apartment', () => {
    // 0% on 1,978,745 = 0
    // 3.5% on 368,295 = 12,890.325
    // 5% on 3,708,030 = 185,401.5
    // 8% on 3,944,930 = 315,594.4
    // Total = 513,886.225 → rounds to 513,886
    const result = calcPurchaseTax(10_000_000, true);
    expect(result.total).toBe(513886);
    expect(result.brackets).toHaveLength(4);
  });

  it('handles ₪25,000,000 single apartment (hits 10% bracket)', () => {
    const result = calcPurchaseTax(25_000_000, true);
    expect(result.brackets).toHaveLength(5);
    // Last bracket should be 10% on amount above 20M
    const lastBracket = result.brackets[4];
    expect(lastBracket.rate).toBe(0.10);
    expect(lastBracket.taxableAmount).toBe(5_000_000);
    expect(lastBracket.tax).toBe(500_000);
  });

  // ── Investor/Additional Apartment (דירה נוספת) ──

  it('returns 8% flat for ₪2,000,000 investor apartment', () => {
    const result = calcPurchaseTax(2_000_000, false);
    expect(result.total).toBe(160_000);
    expect(result.effectiveRatePct).toBe(8);
    expect(result.isSingleApartment).toBe(false);
  });

  it('returns correct tax for ₪10,000,000 investor apartment', () => {
    // 8% on 6,055,070 = 484,405.6
    // 10% on 3,944,930 = 394,493
    // Total = 878,898.6 → rounds to 878,899
    const result = calcPurchaseTax(10_000_000, false);
    expect(result.total).toBe(878899);
    expect(result.brackets).toHaveLength(2);
  });

  it('returns 0 for ₪0 price', () => {
    const result = calcPurchaseTax(0, true);
    expect(result.total).toBe(0);
  });

  it('returns 0 for negative price', () => {
    const result = calcPurchaseTax(-100_000, true);
    expect(result.total).toBe(0);
  });

  // ── Bracket boundary test ──

  it('returns exactly 0 at the single apartment threshold boundary', () => {
    const result = calcPurchaseTax(1_978_745, true);
    expect(result.total).toBe(0);
  });

  it('returns small tax just above single apartment threshold', () => {
    const result = calcPurchaseTax(1_978_746, true);
    expect(result.total).toBe(0); // 3.5% × 1 = 0.035 → rounds to 0
  });
});

describe('calcAcquisitionCosts', () => {
  it('returns full cost breakdown for ₪2,500,000 single apartment', () => {
    const result = calcAcquisitionCosts(2_500_000, true);
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;

    expect(result.data.purchasePrice).toBe(2_500_000);
    expect(result.data.purchaseTax.total).toBeGreaterThan(0);
    expect(result.data.agentFee).toBe(Math.round(2_500_000 * 0.0234));
    expect(result.data.mortgageRegistration).toBe(Math.round(2_500_000 * 0.0025));
    expect(result.data.totalAcquisitionCost).toBeGreaterThan(2_500_000);
    expect(result.data.agentFeeNote).toBe('תיווך — מקובל בשוק, לא חובה');
  });

  it('returns CANNOT_COMPUTE for zero price', () => {
    const result = calcAcquisitionCosts(0, true);
    expect(result.status).toBe('CANNOT_COMPUTE');
  });
});

describe('calcYield', () => {
  it('calculates correct gross and net yield', () => {
    const result = calcYield({
      purchasePrice: 2_000_000,
      monthlyRent: 5_000,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;

    // Gross: (5000 × 12) / 2,000,000 × 100 = 3%
    expect(result.data.grossYieldPct).toBe(3);
    // Net: ((60,000 - expenses)) / 2,000,000 × 100
    // Expenses: 4800 (mgmt) + 4500 (maintenance) + 1500 (insurance) = 10,800
    // Net income: 60,000 - 10,800 = 49,200
    // Net yield: 49,200 / 2,000,000 = 2.46%
    expect(result.data.netYieldPct).toBe(2.46);
    expect(result.data.annualExpenses).toBe(10_800);
  });

  it('calculates cash-on-cash with mortgage', () => {
    const result = calcYield({
      purchasePrice: 2_000_000,
      monthlyRent: 5_000,
      mortgageAmount: 1_400_000, // 70% LTV
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;

    expect(result.data.equityInvested).toBe(600_000);
    // Cash-on-cash: 49,200 / 600,000 × 100 = 8.2%
    expect(result.data.cashOnCashPct).toBe(8.2);
  });

  it('shows rent tax exemption under threshold', () => {
    const result = calcYield({
      purchasePrice: 2_000_000,
      monthlyRent: 4_000,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;

    expect(result.data.rentTaxOptions.exemptUnderThreshold).toBe(true);
    expect(result.data.rentTaxOptions.option10PctOnExcess).toBe(0);
  });

  it('calculates rent tax options above threshold', () => {
    const result = calcYield({
      purchasePrice: 3_000_000,
      monthlyRent: 8_000,
    });
    expect(result.status).toBe('OK');
    if (result.status !== 'OK') return;

    expect(result.data.rentTaxOptions.exemptUnderThreshold).toBe(false);
    // 10% flat on full: 8000 × 12 × 0.10 = 9,600
    expect(result.data.rentTaxOptions.option10PctFlat).toBe(9_600);
    // 10% on excess: (8000 - 5654) × 12 × 0.10 = 2346 × 12 × 0.10 = 2,815.2 → 2815
    expect(result.data.rentTaxOptions.option10PctOnExcess).toBe(2815);
  });

  it('returns CANNOT_COMPUTE for zero price', () => {
    const result = calcYield({ purchasePrice: 0, monthlyRent: 5000 });
    expect(result.status).toBe('CANNOT_COMPUTE');
  });
});
