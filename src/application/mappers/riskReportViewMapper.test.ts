import { describe, it, expect } from 'vitest';
import { toRiskReportView } from './riskReportViewMapper';
import { RiskCategory } from '@/domain/enums/RiskCategory';
import type { RiskReport } from '@/domain/models/RiskReport';

describe('toRiskReportView', () => {
  const report: RiskReport = {
    overallScore: 42,
    factors: [
      {
        id: 'test-factor',
        category: RiskCategory.MARKET_LIQUIDITY,
        severity: 3,
        titleKey: 'risk.cyprus.closed_israeli_market.title',
        descriptionKey: 'risk.cyprus.closed_israeli_market.description',
        details: { notes: ['test'] },
      },
    ],
  };

  it('maps overallScore directly', () => {
    const view = toRiskReportView(report, 'he');
    expect(view.overallScore).toBe(42);
  });

  it('maps locale', () => {
    expect(toRiskReportView(report, 'he').locale).toBe('he');
    expect(toRiskReportView(report, 'en').locale).toBe('en');
  });

  it('resolves title and description keys to translations', () => {
    const view = toRiskReportView(report, 'he');
    expect(view.factors[0].title).toBeTruthy();
    expect(view.factors[0].title).not.toBe('risk.cyprus.closed_israeli_market.title');
  });

  it('preserves factor id, category, severity, details', () => {
    const view = toRiskReportView(report, 'en');
    expect(view.factors[0].id).toBe('test-factor');
    expect(view.factors[0].category).toBe(RiskCategory.MARKET_LIQUIDITY);
    expect(view.factors[0].severity).toBe(3);
    expect(view.factors[0].details).toEqual({ notes: ['test'] });
  });

  it('handles empty factors', () => {
    const empty: RiskReport = { overallScore: 0, factors: [] };
    const view = toRiskReportView(empty, 'en');
    expect(view.factors).toHaveLength(0);
  });
});
