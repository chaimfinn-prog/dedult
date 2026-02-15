# Claude Code Prompt Blueprint — Israeli Residential Feasibility Calculator (2026)

Use this as a production-oriented prompt for Claude Code / coding agents.

## 1) Goal (single sentence)
Build a Next.js + React feasibility calculator for Israeli residential real estate (2026) that computes acquisition costs, financing constraints, rental taxation outcomes, and 10-year XIRR under regulatory rules.

## 2) Scope

### In Scope (MVP)
1. Purchase tax (`Mas Rechisha`) by buyer status and 2026 brackets.
2. VAT (18%) handling by transaction type (developer vs second-hand + services).
3. Construction index linkage per Sales Law Amendment 9.
4. Mortgage constraints: LTV aggregation (from 2026-07-01), PTI/DSTI risk flag (>40%), 30-year term cap.
5. Baseline mortgage mix simulations:
   - 100% fixed unindexed
   - 33/33/33 fixed + variable indexed + prime
   - 50/50 fixed + prime
6. Rental tax tracks:
   - Exemption with sliding reduction ceiling (6,360 NIS / month)
   - 10% flat
   - Marginal with deductible expenses
7. Operating costs module (management, arnona, vacancy, maintenance reserve).
8. Transit uplift adjustment by distance buckets.
9. XIRR engine for irregular cashflows with robust root-finding.
10. Sensitivity grid for interest-rate vs construction-index changes.

### Out of Scope (Phase 2)
- Live integration to government systems or bank APIs.
- Full legal opinion engine.
- Automatic geocoding from free-text addresses.

## 3) Regulatory Constants (2026)

### 3.1 Purchase Tax
- Single-home resident:
  - up to 1,978,745 => 0%
  - 1,978,745–2,347,040 => 3.5%
  - 2,347,040–6,055,070 => 5%
  - 6,055,070–20,183,565 => 8%
  - above 20,183,565 => 10%
- Investor/Foreigner:
  - up to 6,055,070 => 8%
  - above 6,055,070 => 10%
- New immigrant benefit: configurable flag + eligibility window (<=7 years + primary residence use).

### 3.2 VAT
- 18% for new-from-developer property price.
- 18% on professional services (legal/broker) in all transaction types.
- 0% VAT on second-hand private seller property price.

### 3.3 Amendment 9 Linkage
- First 20% of total contract price: no index linkage.
- Of the remaining balance, only 40% of total apartment price is linkage-exposed.
- No linkage after contractual delivery date.
- Indexation is one-way (no downward price adjustment if index falls).

### 3.4 Mortgage / Banking Rules
- LTV (aggregate secured debt by collateral):
  - single home: citizen 75%, non-resident 50%
  - replacement home: citizen 70%, non-resident 50%
  - investment: 50%
- PTI absolute cap: 50%.
- PTI > 40% => risk premium flag in output.
- Maximum loan term: 30 years.

### 3.5 Rental Tax Tracks
- Exemption ceiling: 6,360 NIS/month.
- Exemption phases out linearly and is fully gone at 12,720 NIS/month.
- 10% flat track (gross).
- Marginal track: expense-deductible.

## 4) Data Contract (TypeScript)
```ts
export type BuyerStatus = 'single_home_resident' | 'investor_resident' | 'foreigner' | 'new_immigrant';
export type PropertyType = 'new_from_developer' | 'second_hand';
export type LoanPurpose = 'single_home' | 'replacement_home' | 'investment';

export interface Inputs {
  purchaseDate: string;
  contractPriceNis: number;
  buyerStatus: BuyerStatus;
  resident: boolean;
  propertyType: PropertyType;

  legalFeeNis: number;
  brokerFeeNis: number;

  downPaymentPct: number;
  additionalSecuredDebtNis: number;
  loanPurpose: LoanPurpose;
  borrowerMonthlyDisposableIncomeNis: number;
  mortgageYears: number;

  primeRateAnnualPct: number;
  fixedRateAnnualPct: number;
  variableIndexedAnnualPct: number;

  annualConstructionIndexPct: number;
  paymentSchedule: Array<{ date: string; amountNis: number }>;
  contractualDeliveryDate: string;

  monthlyRentNis: number;
  rentalTrack: 'exemption' | 'flat10' | 'marginal';
  marginalTaxRatePct?: number;
  deductibleExpensesAnnualNis?: number;

  managementFeePct: number;
  annualArnonaNis: number;
  vacancyPct: number;
  repairReservePct: number;

  distanceToTransitMeters: number;
}

export interface Outputs {
  totalAcquisitionCostNis: number;
  purchaseTaxNis: number;
  vatOnPropertyNis: number;
  vatOnServicesNis: number;
  linkageSurchargeNis: number;

  maxAllowedLtvPct: number;
  aggregateLtvPct: number;
  ptiPct: number;
  ptiRiskPremiumFlag: boolean;
  financingConstraintsPassed: boolean;

  annualGrossRentNis: number;
  annualNetCashflowNis: number;
  rentalTaxAnnualNis: number;

  projected10ySaleValueNis: number;
  xirr10yPct: number;
  roi10yPct: number;

  sensitivity: number[][];
}
```

## 5) Calculation Rules (implement as pure functions)
1. `calcPurchaseTax(inputs)` progressive brackets by status.
2. `calcVat(inputs)` with separate property/services VAT.
3. `calcLinkageSurcharge(inputs)` honoring Amendment 9 caps + delivery-date stop.
4. `calcMortgageConstraints(inputs)` with aggregated debt LTV + PTI rules.
5. `calcRentalTax(inputs)` with proper exemption phase-out.
6. `calcOperatingCosts(inputs)` incl. management, arnona, vacancy, repair reserve.
7. `calcTransitUplift(distanceMeters)` buckets:
   - <250m: +6% to +12%
   - 250-500m: +3% to +6%
   - 500-1000m: +1% to +3%
   - >1000m: +0%
8. `solveXirr(cashflows)` using robust Newton-Raphson with guarded fallback bisection.

## 6) UX Requirements
- Form sections: Acquisition, Financing, Rental, Operating Costs, Transit, Scenario.
- Output cards: Acquisition Cost, Monthly Cashflow, Net Yield, LTV/PTI status, 10Y XIRR.
- Charts:
  - amortization + linkage waterfall
  - sensitivity heatmap (interest ±0.5%, index ±1%)
- Validation:
  - reject impossible combinations (e.g., PTI > 50%, term > 30 years)
  - highlight compliance warnings instead of silent failure.

## 7) File/Module Structure
- `src/lib/finance/constants.ts`
- `src/lib/finance/types.ts`
- `src/lib/finance/tax.ts`
- `src/lib/finance/linkage.ts`
- `src/lib/finance/mortgage.ts`
- `src/lib/finance/rent.ts`
- `src/lib/finance/xirr.ts`
- `src/lib/finance/simulation.ts`
- `src/app/calculate/page.tsx`
- `src/components/finance/*.tsx`
- `src/lib/finance/__tests__/*.test.ts`

## 8) Acceptance Tests (must pass)
1. Resident single-home purchase 8,000,000 NIS -> purchase tax close to expected bracketed output.
2. Foreigner same price -> higher tax than resident by significant delta.
3. Second-hand property -> no VAT on property; VAT still on legal/broker fees.
4. Linkage never applied to first 20% payment.
5. Linkage stops after contractual delivery date even if payment date is later.
6. LTV includes additional secured debt in numerator.
7. PTI > 40% sets risk flag; PTI > 50% fails constraints.
8. Rent = 12,720 NIS/month under exemption track -> effective exemption zero.
9. XIRR solver converges for irregular dates and returns finite value.
10. Sensitivity matrix returns complete rectangular grid.

## 9) Copy-paste Prompt for Claude Code
```text
Build the MVP exactly per the "Claude Code Prompt Blueprint — Israeli Residential Feasibility Calculator (2026)" spec.

Requirements:
- Implement calculation engine as pure TypeScript modules in src/lib/finance.
- Build a Next.js UI in src/app/calculate/page.tsx with output cards and charts.
- Add unit tests for all acceptance tests.
- Use deterministic defaults and document assumptions in code comments.
- Return a short implementation report: architecture, formulas used, and known limitations.
```

## 10) Notes
- This blueprint is for product/engineering implementation and is not legal or tax advice.
- Keep all rates and thresholds centralized in constants for annual updates.
