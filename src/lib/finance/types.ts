export type BuyerStatus = 'single_home_resident' | 'investor_resident' | 'foreigner' | 'new_immigrant';
export type PropertyType = 'new_from_developer' | 'second_hand';
export type LoanPurpose = 'single_home' | 'replacement_home' | 'investment';
export type RentalTrack = 'exemption' | 'flat10' | 'marginal';

export interface PaymentMilestone {
  date: string;
  amountNis: number;
}

export interface FeasibilityInputs {
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

  fixedRateAnnualPct: number;
  primeRateAnnualPct: number;
  variableIndexedAnnualPct: number;

  annualConstructionIndexPct: number;
  paymentSchedule: PaymentMilestone[];
  contractualDeliveryDate: string;

  monthlyRentNis: number;
  rentalTrack: RentalTrack;
  marginalTaxRatePct: number;
  deductibleExpensesAnnualNis: number;

  managementFeePct: number;
  annualArnonaNis: number;
  vacancyPct: number;
  repairReservePct: number;

  distanceToTransitMeters: number;
  annualAppreciationPct: number;
}

export interface FeasibilityOutputs {
  purchaseTaxNis: number;
  vatOnPropertyNis: number;
  vatOnServicesNis: number;
  linkageSurchargeNis: number;
  totalAcquisitionCostNis: number;

  maxAllowedLtvPct: number;
  aggregateLtvPct: number;
  ptiPct: number;
  ptiRiskPremiumFlag: boolean;
  financingConstraintsPassed: boolean;

  monthlyMortgagePaymentNis: number;
  annualGrossRentNis: number;
  rentalTaxAnnualNis: number;
  annualOperatingCostsNis: number;
  annualNetCashflowNis: number;

  projected10ySaleValueNis: number;
  xirr10yPct: number;

  transitUpliftPct: number;
  sensitivity: number[][];

  waterfall: {
    annualPrincipalNis: number;
    annualInterestNis: number;
    annualLinkageNis: number;
  };
}
