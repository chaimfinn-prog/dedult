import { Country } from '../enums/Country';
import { RiskCategory } from '../enums/RiskCategory';
import { InvestmentProfile } from '../models/InvestmentProfile';
import { RiskFactor } from '../models/RiskFactor';

export function evaluateCyprusRisks(profile: InvestmentProfile): RiskFactor[] {
  const factors: RiskFactor[] = [];

  const appliesToCyprus =
    profile.country === Country.CYPRUS || profile.country === Country.NORTH_CYPRUS || profile.isNorthCyprus;

  if (!appliesToCyprus) {
    return factors;
  }

  if (profile.isIsraeliOnlyProject) {
    factors.push({
      id: 'cyprus-closed-israeli-bubble',
      category: RiskCategory.MARKET_LIQUIDITY,
      severity: 4,
      titleKey: 'risk.cyprus.closed_israeli_market.title',
      descriptionKey: 'risk.cyprus.closed_israeli_market.description',
      details: {
        notes: [
          'Foreign buyers budget ~2–3x locals',
          'Locals focus <300k EUR, foreigners dominate coastal gated stock',
        ],
      },
    });
  }

  if (profile.viaCompany) {
    const rate = profile.localCorporateTaxRate ?? 0.15;
    factors.push({
      id: 'cyprus-corporate-tax',
      category: RiskCategory.TAX_REGIME_LOCAL,
      severity: rate >= 0.15 ? 3 : 2,
      titleKey: 'risk.cyprus.corporate_tax_2026.title',
      descriptionKey: 'risk.cyprus.corporate_tax_2026.description',
      details: { corporateTaxRate: rate },
    });
  }

  if (profile.usesCyprus60DayRule) {
    factors.push({
      id: 'cyprus-personal-tax-reporting',
      category: RiskCategory.TAX_REGIME_LOCAL,
      severity: 3,
      titleKey: 'risk.cyprus.personal_tax_reporting_2026.title',
      descriptionKey: 'risk.cyprus.personal_tax_reporting_2026.description',
      details: {
        incomeTaxBrackets: profile.localIncomeTaxBrackets ?? [
          { upTo: 22000, rate: 0 },
          { upTo: 32000, rate: 0.2 },
          { upTo: 42000, rate: 0.25 },
          { upTo: 72000, rate: 0.3 },
          { upTo: Number.POSITIVE_INFINITY, rate: 0.35 },
        ],
        mandatoryAnnualReturn: true,
      },
    });
  }

  factors.push({
    id: 'cyprus-regulatory-restrictions',
    category: RiskCategory.REGULATORY_RESTRICTIONS,
    severity: 3,
    titleKey: 'risk.cyprus.foreign_purchase_restrictions.title',
    descriptionKey: 'risk.cyprus.foreign_purchase_restrictions.description',
    details: {
      maxUnits: 1,
      maxSqm: 200,
      sensitiveInfrastructureBan: true,
      status: 'PROPOSED_2026',
    },
  });

  factors.push({
    id: 'cyprus-remote-management',
    category: RiskCategory.REMOTE_MANAGEMENT,
    severity: profile.rentalMode === 'AIRBNB' ? 4 : 3,
    titleKey: 'risk.cyprus.remote_management_costs.title',
    descriptionKey: 'risk.cyprus.remote_management_costs.description',
    details: {
      managementFeePctRange: profile.rentalMode === 'AIRBNB' ? [0.2, 0.25] : [0.083, 0.1],
      annualHoaRangeEur: [800, 1500],
      annualMaintenanceReserveEur: profile.expectedAnnualMaintenanceEur ?? 500,
      typicalGrossToNetShrinkPct: 0.25,
    },
  });

  if (profile.country === Country.NORTH_CYPRUS || profile.isNorthCyprus) {
    factors.push({
      id: 'north-cyprus-criminal',
      category: RiskCategory.CRIMINAL_RISK,
      severity: 5,
      titleKey: 'risk.north_cyprus.criminal_ownership.title',
      descriptionKey: 'risk.north_cyprus.criminal_ownership.description',
      details: {
        euArrestWarrantRisk: true,
        nonRecognizedTitle: true,
      },
    });

    factors.push({
      id: 'north-cyprus-liquidity',
      category: RiskCategory.MARKET_LIQUIDITY,
      severity: 5,
      titleKey: 'risk.north_cyprus.black_market_liquidity.title',
      descriptionKey: 'risk.north_cyprus.black_market_liquidity.description',
      details: {
        noBankFinance: true,
        noLegitInsurance: true,
      },
    });
  }

  return factors;
}
