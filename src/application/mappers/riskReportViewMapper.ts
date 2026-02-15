import { RiskReport } from '@/domain/models/RiskReport';
import { t } from '@/i18n';

export interface RiskFactorView {
  id: string;
  category: string;
  severity: number;
  title: string;
  description: string;
  details: Record<string, unknown>;
}

export interface RiskReportView {
  overallScore: number;
  factors: RiskFactorView[];
  locale: string;
}

export function toRiskReportView(report: RiskReport, locale: string): RiskReportView {
  return {
    overallScore: report.overallScore,
    locale,
    factors: report.factors.map((factor) => ({
      id: factor.id,
      category: factor.category,
      severity: factor.severity,
      title: t(factor.titleKey, locale),
      description: t(factor.descriptionKey, locale),
      details: factor.details,
    })),
  };
}
