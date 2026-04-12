import { describe, it, expect } from 'vitest';
import { buildRiskReport } from './riskEngine';
import { Country } from '../enums/Country';
import type { InvestmentProfile } from '../models/InvestmentProfile';
import type { RiskEngineContext } from './riskEngine';

function makeProfile(overrides: Partial<InvestmentProfile> = {}): InvestmentProfile {
  return {
    country: Country.CYPRUS,
    priceEur: 250_000,
    grossYieldPct: 5,
    rentalMode: 'LONG_TERM',
    viaCompany: false,
    ...overrides,
  };
}

function makeContext(overrides: Partial<RiskEngineContext['israelTax']> = {}): RiskEngineContext {
  return {
    israelTax: {
      taxRoute: 'MARGINAL',
      ...overrides,
    },
  };
}

describe('buildRiskReport', () => {
  it('returns factors for Cyprus profile', () => {
    const report = buildRiskReport(makeProfile(), makeContext());
    expect(report.factors.length).toBeGreaterThan(0);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });

  it('returns factors for Greece profile', () => {
    const report = buildRiskReport(makeProfile({ country: Country.GREECE }), makeContext());
    const greeceFactors = report.factors.filter(f => f.id.startsWith('greece-'));
    expect(greeceFactors.length).toBeGreaterThan(0);
  });

  it('returns no Greece factors for Cyprus profile', () => {
    const report = buildRiskReport(makeProfile({ country: Country.CYPRUS }), makeContext());
    const greeceFactors = report.factors.filter(f => f.id.startsWith('greece-'));
    expect(greeceFactors).toHaveLength(0);
  });

  it('returns 95+ score for North Cyprus', () => {
    const report = buildRiskReport(
      makeProfile({ country: Country.NORTH_CYPRUS, isNorthCyprus: true }),
      makeContext(),
    );
    expect(report.overallScore).toBeGreaterThanOrEqual(95);
  });

  it('includes criminal risk for North Cyprus', () => {
    const report = buildRiskReport(
      makeProfile({ country: Country.NORTH_CYPRUS, isNorthCyprus: true }),
      makeContext(),
    );
    const criminal = report.factors.find(f => f.id === 'north-cyprus-criminal');
    expect(criminal).toBeDefined();
    expect(criminal!.severity).toBe(5);
  });

  it('includes Israel tax factors', () => {
    const report = buildRiskReport(makeProfile(), makeContext());
    const israelFactors = report.factors.filter(f => f.id.startsWith('israel-'));
    expect(israelFactors.length).toBeGreaterThan(0);
  });

  it('includes CFC factor when holding via foreign company', () => {
    const report = buildRiskReport(makeProfile(), makeContext({
      holdsViaForeignCompany: true,
      foreignCompanyIsCfc: true,
    }));
    const cfc = report.factors.find(f => f.id === 'israel-form-150-cfc');
    expect(cfc).toBeDefined();
    expect(cfc!.severity).toBe(4);
  });

  it('includes flat15 double tax factor', () => {
    const report = buildRiskReport(makeProfile(), makeContext({ taxRoute: 'FLAT_15' }));
    const flat15 = report.factors.find(f => f.id === 'israel-flat15-double_tax');
    expect(flat15).toBeDefined();
  });

  it('includes corporate tax for via-company Cyprus', () => {
    const report = buildRiskReport(makeProfile({ viaCompany: true }), makeContext());
    const corpTax = report.factors.find(f => f.id === 'cyprus-corporate-tax');
    expect(corpTax).toBeDefined();
  });

  it('includes Israeli bubble risk', () => {
    const report = buildRiskReport(
      makeProfile({ isIsraeliOnlyProject: true }),
      makeContext(),
    );
    const bubble = report.factors.find(f => f.id === 'cyprus-closed-israeli-bubble');
    expect(bubble).toBeDefined();
  });
});
