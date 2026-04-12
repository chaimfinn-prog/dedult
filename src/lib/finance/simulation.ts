import type { FeasibilityInputs, FeasibilityOutputs } from './types';
import { calcLinkageSurcharge } from './linkage';
import { calcMortgage } from './mortgage';
import { calcOperatingCosts, calcRentalTax } from './rent';
import { calcPurchaseTax, calcVat } from './tax';
import { calcTransitUplift } from './transit';
import { solveXirr } from './xirr';

const PROJECTION_YEARS = 10;
const SENSITIVITY_RATE_DELTAS = [-0.5, 0, 0.5];
const SENSITIVITY_INDEX_DELTAS = [-1, 0, 1];
const MORTGAGE_EXPOSURE_RATIO = 0.15;

function buildCashflows(
  startDate: string,
  totalAcquisitionCostNis: number,
  annualNetCashflowNis: number,
  projected10ySaleValueNis: number,
) {
  const saleDate = new Date(startDate);
  saleDate.setFullYear(saleDate.getFullYear() + PROJECTION_YEARS);

  return [
    { date: startDate, amountNis: -totalAcquisitionCostNis },
    ...Array.from({ length: PROJECTION_YEARS }, (_, i) => {
      const d = new Date(startDate);
      d.setFullYear(d.getFullYear() + i + 1);
      return { date: d.toISOString(), amountNis: annualNetCashflowNis };
    }),
    { date: saleDate.toISOString(), amountNis: projected10ySaleValueNis },
  ];
}

function buildSensitivityMatrix(
  contractPriceNis: number,
  effectiveGrowthRate: number,
  totalAcquisitionCostNis: number,
): number[][] {
  return SENSITIVITY_INDEX_DELTAS.map((idxDelta) =>
    SENSITIVITY_RATE_DELTAS.map((rateDelta) => {
      const carryCostDelta =
        ((idxDelta + rateDelta) / 100) * contractPriceNis * MORTGAGE_EXPOSURE_RATIO;
      const adjustedSale =
        contractPriceNis * Math.pow(1 + effectiveGrowthRate, PROJECTION_YEARS) -
        carryCostDelta * PROJECTION_YEARS;
      return adjustedSale - totalAcquisitionCostNis;
    }),
  );
}

export function runFeasibility(inputs: FeasibilityInputs): FeasibilityOutputs {
  // ── Acquisition costs ──
  const purchaseTaxNis = calcPurchaseTax(inputs.contractPriceNis, inputs.buyerStatus);
  const { vatOnPropertyNis, vatOnServicesNis } = calcVat(
    inputs.contractPriceNis,
    inputs.legalFeeNis,
    inputs.brokerFeeNis,
    inputs.propertyType,
  );

  const linkageSurchargeNis = calcLinkageSurcharge(
    inputs.contractPriceNis,
    inputs.annualConstructionIndexPct,
    inputs.paymentSchedule,
    inputs.contractualDeliveryDate,
  );

  const totalAcquisitionCostNis =
    inputs.contractPriceNis +
    purchaseTaxNis +
    vatOnPropertyNis +
    vatOnServicesNis +
    inputs.legalFeeNis +
    inputs.brokerFeeNis +
    linkageSurchargeNis;

  // ── Mortgage ──
  const baseMortgageRate = (inputs.fixedRateAnnualPct + inputs.primeRateAnnualPct) / 2;
  const mortgage = calcMortgage(
    inputs.contractPriceNis,
    inputs.downPaymentPct,
    inputs.additionalSecuredDebtNis,
    inputs.loanPurpose,
    inputs.resident,
    inputs.borrowerMonthlyDisposableIncomeNis,
    inputs.mortgageYears,
    baseMortgageRate,
  );

  // ── Rental income & operating costs ──
  const { annualGrossRentNis, rentalTaxAnnualNis } = calcRentalTax(
    inputs.monthlyRentNis,
    inputs.rentalTrack,
    inputs.marginalTaxRatePct,
    inputs.deductibleExpensesAnnualNis,
  );

  const annualOperatingCostsNis = calcOperatingCosts(
    annualGrossRentNis,
    inputs.managementFeePct,
    inputs.annualArnonaNis,
    inputs.vacancyPct,
    inputs.repairReservePct,
    inputs.contractPriceNis,
  );

  const annualMortgage = mortgage.monthlyMortgagePaymentNis * 12;
  const annualNetCashflowNis =
    annualGrossRentNis - rentalTaxAnnualNis - annualOperatingCostsNis - annualMortgage;

  // ── Projection ──
  const transitUpliftPct = calcTransitUplift(inputs.distanceToTransitMeters);
  const effectiveAnnualGrowth = (inputs.annualAppreciationPct + transitUpliftPct) / 100;
  const projected10ySaleValueNis =
    inputs.contractPriceNis * Math.pow(1 + effectiveAnnualGrowth, PROJECTION_YEARS);

  // ── XIRR ──
  const startDate = inputs.paymentSchedule[0]?.date || new Date().toISOString();
  const cashflows = buildCashflows(
    startDate,
    totalAcquisitionCostNis,
    annualNetCashflowNis,
    projected10ySaleValueNis,
  );
  const xirr10yPct = solveXirr(cashflows);

  // ── Sensitivity ──
  const sensitivity = buildSensitivityMatrix(
    inputs.contractPriceNis,
    effectiveAnnualGrowth,
    totalAcquisitionCostNis,
  );

  return {
    purchaseTaxNis,
    vatOnPropertyNis,
    vatOnServicesNis,
    linkageSurchargeNis,
    totalAcquisitionCostNis,

    maxAllowedLtvPct: mortgage.maxAllowedLtvPct,
    aggregateLtvPct: mortgage.aggregateLtvPct,
    ptiPct: mortgage.ptiPct,
    ptiRiskPremiumFlag: mortgage.ptiRiskPremiumFlag,
    financingConstraintsPassed: mortgage.financingConstraintsPassed,

    monthlyMortgagePaymentNis: mortgage.monthlyMortgagePaymentNis,
    annualGrossRentNis,
    rentalTaxAnnualNis,
    annualOperatingCostsNis,
    annualNetCashflowNis,

    projected10ySaleValueNis,
    xirr10yPct,

    transitUpliftPct,
    sensitivity,

    waterfall: {
      annualPrincipalNis: mortgage.primaryLoanNis / inputs.mortgageYears,
      annualInterestNis: Math.max(
        annualMortgage - mortgage.primaryLoanNis / inputs.mortgageYears,
        0,
      ),
      annualLinkageNis: linkageSurchargeNis / PROJECTION_YEARS,
    },
  };
}
