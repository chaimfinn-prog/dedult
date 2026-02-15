import { RiskCategory } from '../enums/RiskCategory';
import { InvestmentProfile } from '../models/InvestmentProfile';
import { RiskFactor } from '../models/RiskFactor';

export type IsraelTaxRoute = 'FLAT_15' | 'MARGINAL';

export interface IsraelTaxContext {
  taxRoute?: IsraelTaxRoute;
  paysLocalTaxRatePct?: number;
  holdsViaForeignCompany?: boolean;
  foreignCompanyIsCfc?: boolean;
}

export function evaluateIsraelTaxRisks(
  _profile: InvestmentProfile,
  ctx: IsraelTaxContext,
): RiskFactor[] {
  const factors: RiskFactor[] = [];
  const taxRoute = ctx.taxRoute ?? 'MARGINAL';

  if (ctx.holdsViaForeignCompany) {
    factors.push({
      id: 'israel-form-150-cfc',
      category: RiskCategory.TAX_REGIME_ISRAEL,
      severity: ctx.foreignCompanyIsCfc ? 4 : 3,
      titleKey: 'risk.israel.form150_cfc_enforcement.title',
      descriptionKey: 'risk.israel.form150_cfc_enforcement.description',
      details: {
        crsAutomaticInfoExchange: true,
        aggressiveEnforcementSince: 2025,
      },
    });
  }

  if (taxRoute === 'FLAT_15') {
    factors.push({
      id: 'israel-flat15-double_tax',
      category: RiskCategory.TAX_REGIME_ISRAEL,
      severity: 4,
      titleKey: 'risk.israel.flat15_double_tax.title',
      descriptionKey: 'risk.israel.flat15_double_tax.description',
      details: {
        flatRate: 0.15,
        localTaxRate: ctx.paysLocalTaxRatePct ?? null,
        noExpenseDeduction: true,
        noForeignTaxCredit: true,
      },
    });
  } else {
    factors.push({
      id: 'israel-marginal-route',
      category: RiskCategory.TAX_REGIME_ISRAEL,
      severity: 2,
      titleKey: 'risk.israel.marginal_route_complexity.title',
      descriptionKey: 'risk.israel.marginal_route_complexity.description',
      details: {
        allowsExpenseDeduction: true,
        allowsForeignTaxCredit: true,
        warning: ctx.taxRoute ? undefined : 'taxRoute missing, defaulted to MARGINAL',
      },
    });
  }

  return factors;
}
