import { describe, it, expect } from 'vitest';
import { evaluateIsraelTaxRisks } from './israelTaxRiskRules';
import { Country } from '../enums/Country';
import type { InvestmentProfile } from '../models/InvestmentProfile';
import type { IsraelTaxContext } from './israelTaxRiskRules';

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

describe('evaluateIsraelTaxRisks', () => {
  it('defaults to MARGINAL route', () => {
    const factors = evaluateIsraelTaxRisks(makeProfile(), {});
    const marginal = factors.find(f => f.id === 'israel-marginal-route');
    expect(marginal).toBeDefined();
    expect(marginal!.severity).toBe(2);
  });

  it('includes flat15 double tax factor', () => {
    const factors = evaluateIsraelTaxRisks(makeProfile(), { taxRoute: 'FLAT_15' });
    const flat15 = factors.find(f => f.id === 'israel-flat15-double_tax');
    expect(flat15).toBeDefined();
    expect(flat15!.severity).toBe(4);
  });

  it('includes CFC factor when holding via foreign company', () => {
    const ctx: IsraelTaxContext = { holdsViaForeignCompany: true, foreignCompanyIsCfc: true };
    const factors = evaluateIsraelTaxRisks(makeProfile(), ctx);
    const cfc = factors.find(f => f.id === 'israel-form-150-cfc');
    expect(cfc).toBeDefined();
    expect(cfc!.severity).toBe(4);
  });

  it('lower CFC severity when not flagged as CFC', () => {
    const ctx: IsraelTaxContext = { holdsViaForeignCompany: true, foreignCompanyIsCfc: false };
    const factors = evaluateIsraelTaxRisks(makeProfile(), ctx);
    const cfc = factors.find(f => f.id === 'israel-form-150-cfc');
    expect(cfc!.severity).toBe(3);
  });

  it('excludes CFC when not via foreign company', () => {
    const factors = evaluateIsraelTaxRisks(makeProfile(), { taxRoute: 'MARGINAL' });
    expect(factors.find(f => f.id === 'israel-form-150-cfc')).toBeUndefined();
  });

  it('adds warning when taxRoute is missing', () => {
    const factors = evaluateIsraelTaxRisks(makeProfile(), {});
    const marginal = factors.find(f => f.id === 'israel-marginal-route');
    expect(marginal!.details.warning).toBeDefined();
  });

  it('no warning when taxRoute is explicitly MARGINAL', () => {
    const factors = evaluateIsraelTaxRisks(makeProfile(), { taxRoute: 'MARGINAL' });
    const marginal = factors.find(f => f.id === 'israel-marginal-route');
    expect(marginal!.details.warning).toBeUndefined();
  });
});
