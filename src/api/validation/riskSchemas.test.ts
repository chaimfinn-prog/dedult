import { describe, it, expect } from 'vitest';
import { parseInvestmentProfile, parseIsraelTaxContext } from './riskSchemas';

describe('parseInvestmentProfile', () => {
  const validInput = {
    country: 'CYPRUS',
    priceEur: 250_000,
    grossYieldPct: 5,
    rentalMode: 'LONG_TERM',
    viaCompany: false,
  };

  it('parses valid profile', () => {
    const result = parseInvestmentProfile(validInput);
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.country).toBe('CYPRUS');
    expect(result.data!.priceEur).toBe(250_000);
  });

  it('rejects non-object input', () => {
    expect(parseInvestmentProfile('string').error).toBe('profile must be an object');
    expect(parseInvestmentProfile(null).error).toBe('profile must be an object');
    expect(parseInvestmentProfile([]).error).toBe('profile must be an object');
  });

  it('rejects invalid country', () => {
    expect(parseInvestmentProfile({ ...validInput, country: 'MARS' }).error).toBe('profile.country is invalid');
  });

  it('rejects invalid priceEur', () => {
    expect(parseInvestmentProfile({ ...validInput, priceEur: -100 }).error).toBe('profile.priceEur must be a positive number');
    expect(parseInvestmentProfile({ ...validInput, priceEur: 'abc' }).error).toBe('profile.priceEur must be a positive number');
  });

  it('rejects grossYieldPct out of range', () => {
    expect(parseInvestmentProfile({ ...validInput, grossYieldPct: 31 }).error).toBe('profile.grossYieldPct must be between 0 and 30');
    expect(parseInvestmentProfile({ ...validInput, grossYieldPct: -1 }).error).toBe('profile.grossYieldPct must be between 0 and 30');
  });

  it('rejects invalid rentalMode', () => {
    expect(parseInvestmentProfile({ ...validInput, rentalMode: 'WEEKLY' }).error).toBe('profile.rentalMode must be LONG_TERM or AIRBNB');
  });

  it('rejects non-boolean viaCompany', () => {
    expect(parseInvestmentProfile({ ...validInput, viaCompany: 'yes' }).error).toBe('profile.viaCompany must be boolean');
  });

  it('auto-sets isNorthCyprus for NORTH_CYPRUS country', () => {
    const result = parseInvestmentProfile({ ...validInput, country: 'NORTH_CYPRUS' });
    expect(result.data!.isNorthCyprus).toBe(true);
  });

  it('parses optional fields when present', () => {
    const result = parseInvestmentProfile({
      ...validInput,
      city: 'Limassol',
      isIsraeliOnlyProject: true,
      assetType: 'apartment',
      dealStructure: 'COMPANY',
      localCorporateTaxRate: 0.125,
      usesCyprus60DayRule: true,
    });
    expect(result.data!.city).toBe('Limassol');
    expect(result.data!.isIsraeliOnlyProject).toBe(true);
    expect(result.data!.dealStructure).toBe('COMPANY');
  });
});

describe('parseIsraelTaxContext', () => {
  it('defaults to MARGINAL when undefined', () => {
    const result = parseIsraelTaxContext(undefined);
    expect(result.data.taxRoute).toBe('MARGINAL');
    expect(result.warning).toBeDefined();
  });

  it('parses valid context', () => {
    const result = parseIsraelTaxContext({ taxRoute: 'FLAT_15', paysLocalTaxRatePct: 0.1 });
    expect(result.data.taxRoute).toBe('FLAT_15');
    expect(result.data.paysLocalTaxRatePct).toBe(0.1);
    expect(result.error).toBeUndefined();
  });

  it('defaults unknown taxRoute to MARGINAL with warning', () => {
    const result = parseIsraelTaxContext({ taxRoute: 'UNKNOWN' });
    expect(result.data.taxRoute).toBe('MARGINAL');
    expect(result.warning).toBeDefined();
  });

  it('rejects non-object input', () => {
    const result = parseIsraelTaxContext('string');
    expect(result.error).toBeDefined();
  });

  it('parses boolean fields', () => {
    const result = parseIsraelTaxContext({
      taxRoute: 'FLAT_15',
      holdsViaForeignCompany: true,
      foreignCompanyIsCfc: false,
    });
    expect(result.data.holdsViaForeignCompany).toBe(true);
    expect(result.data.foreignCompanyIsCfc).toBe(false);
  });

  it('ignores invalid paysLocalTaxRatePct', () => {
    const result = parseIsraelTaxContext({ taxRoute: 'MARGINAL', paysLocalTaxRatePct: 0.9 });
    expect(result.data.paysLocalTaxRatePct).toBeUndefined();
  });
});
