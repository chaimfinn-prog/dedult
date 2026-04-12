import type { LoanPurpose } from './types';
import {
  LTV_SINGLE_HOME,
  LTV_REPLACEMENT_HOME,
  LTV_INVESTMENT_OR_FOREIGN,
  MAX_PTI_PCT,
  PTI_RISK_THRESHOLD_PCT,
  MAX_MORTGAGE_YEARS,
} from './constants';

function maxLtvForPurpose(loanPurpose: LoanPurpose, resident: boolean): number {
  if (!resident) return LTV_INVESTMENT_OR_FOREIGN;
  if (loanPurpose === 'single_home') return LTV_SINGLE_HOME;
  if (loanPurpose === 'replacement_home') return LTV_REPLACEMENT_HOME;
  return LTV_INVESTMENT_OR_FOREIGN;
}

function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (n <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function calcMortgage(
  contractPriceNis: number,
  downPaymentPct: number,
  additionalSecuredDebtNis: number,
  loanPurpose: LoanPurpose,
  resident: boolean,
  borrowerMonthlyDisposableIncomeNis: number,
  mortgageYears: number,
  annualRatePct: number,
) {
  const maxAllowedLtvPct = maxLtvForPurpose(loanPurpose, resident) * 100;
  const primaryLoan = contractPriceNis * (1 - downPaymentPct / 100);
  const aggregateDebt = primaryLoan + additionalSecuredDebtNis;
  const aggregateLtvPct = (aggregateDebt / contractPriceNis) * 100;
  const monthlyMortgagePaymentNis = monthlyPayment(primaryLoan, annualRatePct, mortgageYears);
  const ptiPct = borrowerMonthlyDisposableIncomeNis > 0
    ? (monthlyMortgagePaymentNis / borrowerMonthlyDisposableIncomeNis) * 100
    : 100;

  return {
    maxAllowedLtvPct,
    aggregateLtvPct,
    ptiPct,
    ptiRiskPremiumFlag: ptiPct > PTI_RISK_THRESHOLD_PCT,
    financingConstraintsPassed:
      aggregateLtvPct <= maxAllowedLtvPct &&
      ptiPct <= MAX_PTI_PCT &&
      mortgageYears <= MAX_MORTGAGE_YEARS,
    monthlyMortgagePaymentNis,
    primaryLoanNis: primaryLoan,
  };
}
