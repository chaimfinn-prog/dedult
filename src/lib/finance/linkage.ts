import type { PaymentMilestone } from './types';

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

export function calcLinkageSurcharge(
  contractPriceNis: number,
  annualConstructionIndexPct: number,
  paymentSchedule: PaymentMilestone[],
  contractualDeliveryDate: string
): number {
  if (paymentSchedule.length === 0) return 0;

  const sorted = [...paymentSchedule].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(sorted[0].date);
  const deliveryDate = new Date(contractualDeliveryDate);

  const protectedAmount = contractPriceNis * 0.2;
  const totalExposedCap = contractPriceNis * 0.4;
  let protectedUsed = 0;
  let exposedUsed = 0;
  let surcharge = 0;

  for (const payment of sorted) {
    const date = new Date(payment.date);
    if (date > deliveryDate) continue;

    let remaining = payment.amountNis;

    if (protectedUsed < protectedAmount) {
      const consume = Math.min(remaining, protectedAmount - protectedUsed);
      protectedUsed += consume;
      remaining -= consume;
    }

    if (remaining <= 0 || exposedUsed >= totalExposedCap) continue;

    const exposedThisPayment = Math.min(remaining, totalExposedCap - exposedUsed);
    exposedUsed += exposedThisPayment;

    const years = Math.max(daysBetween(firstDate, date), 0) / 365;
    const growthFactor = Math.pow(1 + annualConstructionIndexPct / 100, years) - 1;
    surcharge += exposedThisPayment * Math.max(growthFactor, 0);
  }

  return surcharge;
}
