import { describe, it, expect } from 'vitest';
import { evaluateCyprusRisks } from './cyprusRiskRules';
import { Country } from '../enums/Country';
import type { InvestmentProfile } from '../models/InvestmentProfile';

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

describe('evaluateCyprusRisks', () => {
  it('returns empty for Greece country', () => {
    expect(evaluateCyprusRisks(makeProfile({ country: Country.GREECE }))).toHaveLength(0);
  });

  it('always includes regulatory restrictions for Cyprus', () => {
    const factors = evaluateCyprusRisks(makeProfile());
    const regulatory = factors.find(f => f.id === 'cyprus-regulatory-restrictions');
    expect(regulatory).toBeDefined();
  });

  it('always includes remote management for Cyprus', () => {
    const factors = evaluateCyprusRisks(makeProfile());
    const remote = factors.find(f => f.id === 'cyprus-remote-management');
    expect(remote).toBeDefined();
  });

  it('higher severity for AIRBNB remote management', () => {
    const longTerm = evaluateCyprusRisks(makeProfile({ rentalMode: 'LONG_TERM' }));
    const airbnb = evaluateCyprusRisks(makeProfile({ rentalMode: 'AIRBNB' }));
    const ltSeverity = longTerm.find(f => f.id === 'cyprus-remote-management')!.severity;
    const abSeverity = airbnb.find(f => f.id === 'cyprus-remote-management')!.severity;
    expect(abSeverity).toBeGreaterThan(ltSeverity);
  });

  it('includes Israeli bubble risk when flagged', () => {
    const factors = evaluateCyprusRisks(makeProfile({ isIsraeliOnlyProject: true }));
    expect(factors.find(f => f.id === 'cyprus-closed-israeli-bubble')).toBeDefined();
  });

  it('excludes Israeli bubble risk when not flagged', () => {
    const factors = evaluateCyprusRisks(makeProfile({ isIsraeliOnlyProject: false }));
    expect(factors.find(f => f.id === 'cyprus-closed-israeli-bubble')).toBeUndefined();
  });

  it('includes corporate tax when via company', () => {
    const factors = evaluateCyprusRisks(makeProfile({ viaCompany: true }));
    expect(factors.find(f => f.id === 'cyprus-corporate-tax')).toBeDefined();
  });

  it('includes personal tax when using 60-day rule', () => {
    const factors = evaluateCyprusRisks(makeProfile({ usesCyprus60DayRule: true }));
    expect(factors.find(f => f.id === 'cyprus-personal-tax-reporting')).toBeDefined();
  });

  it('includes criminal risk for North Cyprus', () => {
    const factors = evaluateCyprusRisks(makeProfile({ country: Country.NORTH_CYPRUS, isNorthCyprus: true }));
    const criminal = factors.find(f => f.id === 'north-cyprus-criminal');
    expect(criminal).toBeDefined();
    expect(criminal!.severity).toBe(5);
  });

  it('includes liquidity risk for North Cyprus', () => {
    const factors = evaluateCyprusRisks(makeProfile({ country: Country.NORTH_CYPRUS, isNorthCyprus: true }));
    expect(factors.find(f => f.id === 'north-cyprus-liquidity')).toBeDefined();
  });

  it('applies to North Cyprus via isNorthCyprus flag', () => {
    const factors = evaluateCyprusRisks(makeProfile({ isNorthCyprus: true }));
    expect(factors.length).toBeGreaterThan(0);
  });
});
