import { Country } from '../enums/Country';
import { RiskCategory } from '../enums/RiskCategory';
import { InvestmentProfile } from '../models/InvestmentProfile';
import { RiskFactor } from '../models/RiskFactor';

export function evaluateGreeceRisks(profile: InvestmentProfile): RiskFactor[] {
  if (profile.country !== Country.GREECE) {
    return [];
  }

  return [
    {
      id: 'greece-cadastral-title',
      category: RiskCategory.LEGAL_TITLE,
      severity: 4,
      titleKey: 'risk.greece.ktimatologio_title_gaps.title',
      descriptionKey: 'risk.greece.ktimatologio_title_gaps.description',
      details: {
        issues: ['unregistered property', 'hidden liens', 'inheritance disputes', 'unregularized building deviations'],
      },
    },
    {
      id: 'greece-bureaucracy',
      category: RiskCategory.BUREAUCRACY,
      severity: 3,
      titleKey: 'risk.greece.bureaucracy_complexity.title',
      descriptionKey: 'risk.greece.bureaucracy_complexity.description',
      details: {
        requiredActors: ['localLawyer', 'notary', 'engineer'],
        mandatoryIndependentCounsel: true,
      },
    },
    {
      id: 'greece-closing-costs',
      category: RiskCategory.TAX_REGIME_LOCAL,
      severity: 3,
      titleKey: 'risk.greece.high_closing_costs.title',
      descriptionKey: 'risk.greece.high_closing_costs.description',
      details: {
        acquisitionTaxPct: 0.0309,
        lawyerFeePctRange: [0.01, 0.015],
        notaryFeePctRange: [0.008, 0.01],
        brokerageFeePct: 0.02,
        landRegistryPctRange: [0.005, 0.007],
        expectedTotalPctRange: [0.08, 0.12],
      },
    },
    {
      id: 'greece-hidden-municipal-debt-tap',
      category: RiskCategory.TAX_REGIME_LOCAL,
      severity: 4,
      titleKey: 'risk.greece.municipal_debts_tap.title',
      descriptionKey: 'risk.greece.municipal_debts_tap.description',
      details: {
        inheritableToNewOwner: true,
        potentialLiabilityEur: 'thousands',
      },
    },
    {
      id: 'greece-demographic-risk',
      category: RiskCategory.MARKET_LIQUIDITY,
      severity: 3,
      titleKey: 'risk.greece.demographic_headwinds.title',
      descriptionKey: 'risk.greece.demographic_headwinds.description',
      details: {
        negativeNaturalIncrease: true,
        youthEmigration: true,
        supportedSegments: ['tourist areas'],
      },
    },
    {
      id: 'greece-remote-management',
      category: RiskCategory.REMOTE_MANAGEMENT,
      severity: profile.rentalMode === 'AIRBNB' ? 4 : 3,
      titleKey: 'risk.greece.remote_management_costs.title',
      descriptionKey: 'risk.greece.remote_management_costs.description',
      details: {
        managementFeePctRange: profile.rentalMode === 'AIRBNB' ? [0.2, 0.25] : [0.083, 0.1],
        annualHoaRangeEur: [300, 800],
        propertyTaxEnfiaPerSqmRange: [3, 6],
        maintenanceReserveEur: profile.expectedAnnualMaintenanceEur ?? 500,
        typicalGrossToNetShrinkPct: 0.25,
      },
    },
    {
      id: 'greece-golden-visa-threshold',
      category: RiskCategory.EXIT_STRATEGY,
      severity: 3,
      titleKey: 'risk.greece.golden_visa_thresholds.title',
      descriptionKey: 'risk.greece.golden_visa_thresholds.description',
      details: {
        minInvestmentEur: 800000,
        impactOnLiquidity: 'reduces_foreign_demand_in_hot_zones',
      },
    },
  ];
}
