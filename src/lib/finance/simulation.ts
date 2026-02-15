import type { FeasibilityInputs, FeasibilityOutputs } from './types';
import { calcLinkageSurcharge } from './linkage';
import { calcMortgage } from './mortgage';
import { calcOperatingCosts, calcRentalTax } from './rent';
import { calcPurchaseTax, calcVat } from './tax';
import { calcTransitUplift } from './transit';
import { solveXirr } from './xirr';

export function runFeasibility(inputs: FeasibilityInputs): FeasibilityOutputs {
  const purchaseTaxNis = calcPurchaseTax(inputs.contractPriceNis, inputs.buyerStatus);
  const { vatOnPropertyNis, vatOnServicesNis } = calcVat(
    inputs.contractPriceNis,
    inputs.legalFeeNis,
    inputs.brokerFeeNis,
    inputs.propertyType
  );

  const linkageSurchargeNis = calcLinkageSurcharge(
    inputs.contractPriceNis,
    inputs.annualConstructionIndexPct,
    inputs.paymentSchedule,
    inputs.contractualDeliveryDate
  );

  const baseMortgageRate = (inputs.fixedRateAnnualPct + inputs.primeRateAnnualPct) / 2;
  const mortgage = calcMortgage(
    inputs.contractPriceNis,
    inputs.downPaymentPct,
    inputs.additionalSecuredDebtNis,
    inputs.loanPurpose,
    inputs.resident,
    inputs.borrowerMonthlyDisposableIncomeNis,
    inputs.mortgageYears,
    baseMortgageRate
  );

  const totalAcquisitionCostNis =
    inputs.contractPriceNis +
    purchaseTaxNis +
    vatOnPropertyNis +
    vatOnServicesNis +
    inputs.legalFeeNis +
    inputs.brokerFeeNis +
    linkageSurchargeNis;

  const { annualGrossRentNis, rentalTaxAnnualNis } = calcRentalTax(
    inputs.monthlyRentNis,
    inputs.rentalTrack,
    inputs.marginalTaxRatePct,
    inputs.deductibleExpensesAnnualNis
  );

  const annualOperatingCostsNis = calcOperatingCosts(
    annualGrossRentNis,
    inputs.managementFeePct,
    inputs.annualArnonaNis,
    inputs.vacancyPct,
    inputs.repairReservePct,
    inputs.contractPriceNis
  );

  const annualMortgage = mortgage.monthlyMortgagePaymentNis * 12;
  const annualNetCashflowNis = annualGrossRentNis - rentalTaxAnnualNis - annualOperatingCostsNis - annualMortgage;

  const transitUpliftPct = calcTransitUplift(inputs.distanceToTransitMeters);
  const effectiveAnnualGrowth = (inputs.annualAppreciationPct + transitUpliftPct) / 100;
  const projected10ySaleValueNis = inputs.contractPriceNis * Math.pow(1 + effectiveAnnualGrowth, 10);

  const startDate = inputs.paymentSchedule[0]?.date || new Date().toISOString();
  const saleDate = new Date(startDate);
  saleDate.setFullYear(saleDate.getFullYear() + 10);

  const cashflows = [
    { date: startDate, amountNis: -totalAcquisitionCostNis },
    ...Array.from({ length: 10 }).map((_, i) => {
      const d = new Date(startDate);
      d.setFullYear(d.getFullYear() + i + 1);
      return { date: d.toISOString(), amountNis: annualNetCashflowNis };
    }),
    { date: saleDate.toISOString(), amountNis: projected10ySaleValueNis },
  ];

  const xirr10yPct = solveXirr(cashflows);

  const sensitivityRates = [-0.5, 0, 0.5];
  const sensitivityIndex = [-1, 0, 1];
  const sensitivity = sensitivityIndex.map((idxDelta) =>
    sensitivityRates.map((rateDelta) => {
      const growth = (inputs.annualAppreciationPct + transitUpliftPct) / 100;
      const carryCostDelta = ((idxDelta + rateDelta) / 100) * inputs.contractPriceNis * 0.15;
      const adjustedSale = inputs.contractPriceNis * Math.pow(1 + growth, 10) - carryCostDelta * 10;
      return adjustedSale - totalAcquisitionCostNis;
    })
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
      annualPrincipalNis: (mortgage.primaryLoanNis / inputs.mortgageYears),
      annualInterestNis: Math.max(annualMortgage - (mortgage.primaryLoanNis / inputs.mortgageYears), 0),
      annualLinkageNis: linkageSurchargeNis / 10,
    },
  };
}
