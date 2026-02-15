import type { LoanPurpose } from './types';

function maxLtvForPurpose(loanPurpose: LoanPurpose, resident: boolean) {
  if (!resident) return 0.5;
  if (loanPurpose === 'single_home') return 0.75;
  if (loanPurpose === 'replacement_home') return 0.7;
  return 0.5;
}

function monthlyPayment(principal: number, annualRatePct: number, years: number) {
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
  annualRatePct: number
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
    ptiRiskPremiumFlag: ptiPct > 40,
    financingConstraintsPassed: aggregateLtvPct <= maxAllowedLtvPct && ptiPct <= 50 && mortgageYears <= 30,
    monthlyMortgagePaymentNis,
    primaryLoanNis: primaryLoan,
  };
}
