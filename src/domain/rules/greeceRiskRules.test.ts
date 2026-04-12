import { describe, it, expect } from 'vitest';
import { evaluateGreeceRisks } from './greeceRiskRules';
import { Country } from '../enums/Country';
import type { InvestmentProfile } from '../models/InvestmentProfile';

function makeProfile(overrides: Partial<InvestmentProfile> = {}): InvestmentProfile {
  return {
    country: Country.GREECE,
    priceEur: 200_000,
    grossYieldPct: 4,
    rentalMode: 'LONG_TERM',
    viaCompany: false,
    ...overrides,
  };
}

describe('evaluateGreeceRisks', () => {
  it('returns empty for non-Greece country', () => {
    expect(evaluateGreeceRisks(makeProfile({ country: Country.CYPRUS }))).toHaveLength(0);
  });

  it('returns all standard Greece risk factors', () => {
    const factors = evaluateGreeceRisks(makeProfile());
    expect(factors.length).toBe(7);
  });

  it('includes cadastral title risk', () => {
    const factors = evaluateGreeceRisks(makeProfile());
    const title = factors.find(f => f.id === 'greece-cadastral-title');
    expect(title).toBeDefined();
    expect(title!.severity).toBe(4);
  });

  it('includes bureaucracy risk', () => {
    const factors = evaluateGreeceRisks(makeProfile());
    expect(factors.find(f => f.id === 'greece-bureaucracy')).toBeDefined();
  });

  it('includes closing costs risk', () => {
    const factors = evaluateGreeceRisks(makeProfile());
    expect(factors.find(f => f.id === 'greece-closing-costs')).toBeDefined();
  });

  it('includes municipal debt risk', () => {
    const factors = evaluateGreeceRisks(makeProfile());
    expect(factors.find(f => f.id === 'greece-hidden-municipal-debt-tap')).toBeDefined();
  });

  it('includes demographic risk', () => {
    const factors = evaluateGreeceRisks(makeProfile());
    expect(factors.find(f => f.id === 'greece-demographic-risk')).toBeDefined();
  });

  it('includes golden visa threshold risk', () => {
    const factors = evaluateGreeceRisks(makeProfile());
    expect(factors.find(f => f.id === 'greece-golden-visa-threshold')).toBeDefined();
  });

  it('higher severity for AIRBNB remote management', () => {
    const longTerm = evaluateGreeceRisks(makeProfile({ rentalMode: 'LONG_TERM' }));
    const airbnb = evaluateGreeceRisks(makeProfile({ rentalMode: 'AIRBNB' }));
    const ltRemote = longTerm.find(f => f.id === 'greece-remote-management')!;
    const abRemote = airbnb.find(f => f.id === 'greece-remote-management')!;
    expect(abRemote.severity).toBeGreaterThan(ltRemote.severity);
  });
});
