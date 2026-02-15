import { PURCHASE_TAX_BRACKETS, VAT_RATE } from './constants';
import type { BuyerStatus, PropertyType } from './types';

function progressiveTax(amount: number, brackets: Array<{ upTo: number; rate: number }>): number {
  let tax = 0;
  let prev = 0;

  for (const bracket of brackets) {
    const taxable = Math.min(amount, bracket.upTo) - prev;
    if (taxable > 0) tax += taxable * bracket.rate;
    if (amount <= bracket.upTo) break;
    prev = bracket.upTo;
  }

  return tax;
}

export function calcPurchaseTax(price: number, buyerStatus: BuyerStatus): number {
  const singleHomeEligible = buyerStatus === 'single_home_resident' || buyerStatus === 'new_immigrant';
  const brackets = singleHomeEligible
    ? PURCHASE_TAX_BRACKETS.singleHomeResident
    : PURCHASE_TAX_BRACKETS.investorOrForeigner;

  return progressiveTax(price, brackets);
}

export function calcVat(contractPriceNis: number, legalFeeNis: number, brokerFeeNis: number, propertyType: PropertyType) {
  const vatOnPropertyNis = propertyType === 'new_from_developer' ? contractPriceNis * VAT_RATE : 0;
  const vatOnServicesNis = (legalFeeNis + brokerFeeNis) * VAT_RATE;

  return { vatOnPropertyNis, vatOnServicesNis };
}
