import { Country } from '../enums/Country';
import { InvestmentProfile } from '../models/InvestmentProfile';
import { RiskReport } from '../models/RiskReport';
import { evaluateCyprusRisks } from '../rules/cyprusRiskRules';
import { evaluateGreeceRisks } from '../rules/greeceRiskRules';
import { evaluateIsraelTaxRisks, IsraelTaxContext } from '../rules/israelTaxRiskRules';

export interface RiskEngineContext {
  israelTax: IsraelTaxContext;
}

export function buildRiskReport(profile: InvestmentProfile, ctx: RiskEngineContext): RiskReport {
  const allFactors = [
    ...evaluateCyprusRisks(profile),
    ...evaluateGreeceRisks(profile),
    ...evaluateIsraelTaxRisks(profile, ctx.israelTax),
  ];

  const maxSeverity = 5;
  const baseScore =
    allFactors.length === 0
      ? 0
      : allFactors.reduce((sum, factor) => sum + factor.severity, 0) / (allFactors.length * maxSeverity);

  let overallScore = Math.round(baseScore * 100);

  if (profile.country === Country.NORTH_CYPRUS || profile.isNorthCyprus) {
    overallScore = Math.max(overallScore, 95);
  }

  return {
    overallScore,
    factors: allFactors,
  };
}
