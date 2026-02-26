/**
 * Betterment Levy (היטל השבחה) calculation module.
 *
 * The correct formula:
 *   betterment_value = (value_after_plan_approval - value_before_plan_approval) × ownership_share
 *   levy = betterment_value × levy_rate
 *
 * Levy rates:
 *   Standard: 50%
 *   Metro zone (temporary regulations 2024–2028): 60%
 *
 * If the value delta is unknown, the module returns ESTIMATE_ONLY with a clear note.
 * It does NOT fabricate a precise number.
 */

import type { ComputeResult } from './compute-result';

const STANDARD_LEVY_RATE = 0.50;
const METRO_LEVY_RATE = 0.60;

export interface BettermentLevyInput {
  /** Value per sqm after plan approval, or null if unknown */
  valueAfterPerSqm: number | null;
  /** Value per sqm before plan approval, or null if unknown */
  valueBeforePerSqm: number | null;
  /** Total relevant area in sqm for the owner's share */
  areaSqm: number;
  /** Owner's share of the property (0–1, default 1.0 for sole owner) */
  ownershipShare?: number;
  /** Whether the parcel is in a Metro zone (triggers 60% rate instead of 50%) */
  isMetroZone: boolean;
  /** Whether a plan has been approved (no plan → levy = 0) */
  hasPlanApproval: boolean;
}

export interface BettermentLevyResult {
  levyAmount: number;
  levyRate: number;
  levyRateLabel: string;
  valueDelta: number;
  valueAfter: number;
  valueBefore: number;
  ownershipShare: number;
  bettermentValue: number;
}

export function calcBettermentLevy(
  input: BettermentLevyInput,
): ComputeResult<BettermentLevyResult> {
  // No plan → no levy
  if (!input.hasPlanApproval) {
    return {
      status: 'OK',
      confidence: 'HIGH',
      warnings: [],
      data: {
        levyAmount: 0,
        levyRate: 0,
        levyRateLabel: 'אין תוכנית מאושרת — אין היטל',
        valueDelta: 0,
        valueAfter: 0,
        valueBefore: 0,
        ownershipShare: input.ownershipShare ?? 1,
        bettermentValue: 0,
      },
    };
  }

  // Unknown delta → ESTIMATE_ONLY
  if (input.valueAfterPerSqm === null || input.valueBeforePerSqm === null) {
    return {
      status: 'ESTIMATE_ONLY',
      data: {
        levyAmount: 0,
        levyRate: input.isMetroZone ? METRO_LEVY_RATE : STANDARD_LEVY_RATE,
        levyRateLabel: input.isMetroZone
          ? 'מטרו — 60% (תקנות זמניות 2024–2028)'
          : 'סטנדרטי — 50%',
        valueDelta: 0,
        valueAfter: 0,
        valueBefore: 0,
        ownershipShare: input.ownershipShare ?? 1,
        bettermentValue: 0,
      },
      note: 'היטל ההשבחה ייקבע על ידי שמאי מטעם הוועדה המקומית. הסכום אינו ניתן לחישוב מדויק ללא שומה.',
    };
  }

  const ownershipShare = input.ownershipShare ?? 1;
  const levyRate = input.isMetroZone ? METRO_LEVY_RATE : STANDARD_LEVY_RATE;

  const valueAfter = input.valueAfterPerSqm * input.areaSqm;
  const valueBefore = input.valueBeforePerSqm * input.areaSqm;
  const valueDelta = Math.max(0, valueAfter - valueBefore);
  const bettermentValue = valueDelta * ownershipShare;
  const levyAmount = Math.round(bettermentValue * levyRate);

  return {
    status: 'OK',
    confidence: 'MEDIUM',
    warnings: [
      'סכום היטל ההשבחה מבוסס על הערכת שווי — הסכום הסופי ייקבע בשומה מטעם הוועדה המקומית.',
    ],
    data: {
      levyAmount,
      levyRate,
      levyRateLabel: input.isMetroZone
        ? 'מטרו — 60% (תקנות זמניות 2024–2028)'
        : 'סטנדרטי — 50%',
      valueDelta,
      valueAfter,
      valueBefore,
      ownershipShare,
      bettermentValue,
    },
  };
}
