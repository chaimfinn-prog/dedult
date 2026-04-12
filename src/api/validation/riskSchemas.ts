import { Country } from '@/domain/enums/Country';
import { InvestmentProfile } from '@/domain/models/InvestmentProfile';
import { IsraelTaxContext } from '@/domain/rules/israelTaxRiskRules';

const validCountries = new Set(Object.values(Country));

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function optionalBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && value >= 0 ? value : undefined;
}

export function parseInvestmentProfile(input: unknown): { data?: InvestmentProfile; error?: string } {
  if (!isObject(input)) {
    return { error: 'profile must be an object' };
  }

  const country = input.country;
  if (typeof country !== 'string' || !validCountries.has(country as Country)) {
    return { error: 'profile.country is invalid' };
  }

  const priceEur = Number(input.priceEur);
  if (!Number.isFinite(priceEur) || priceEur <= 0) {
    return { error: 'profile.priceEur must be a positive number' };
  }

  const grossYieldPct = Number(input.grossYieldPct);
  if (!Number.isFinite(grossYieldPct) || grossYieldPct < 0 || grossYieldPct > 30) {
    return { error: 'profile.grossYieldPct must be between 0 and 30' };
  }

  const rentalMode = input.rentalMode;
  if (rentalMode !== 'LONG_TERM' && rentalMode !== 'AIRBNB') {
    return { error: 'profile.rentalMode must be LONG_TERM or AIRBNB' };
  }

  if (typeof input.viaCompany !== 'boolean') {
    return { error: 'profile.viaCompany must be boolean' };
  }

  const dealStructure = input.dealStructure;

  return {
    data: {
      country: country as Country,
      city: optionalString(input.city),
      isNorthCyprus: Boolean(input.isNorthCyprus) || country === Country.NORTH_CYPRUS,
      isIsraeliOnlyProject: optionalBool(input.isIsraeliOnlyProject),
      assetType: optionalString(input.assetType),
      dealStructure:
        dealStructure === 'PERSONAL' || dealStructure === 'COMPANY' ? dealStructure : undefined,
      priceEur,
      grossYieldPct,
      rentalMode,
      viaCompany: input.viaCompany,
      localCorporateTaxRate: optionalPositiveNumber(input.localCorporateTaxRate),
      usesCyprus60DayRule: optionalBool(input.usesCyprus60DayRule),
      hasIndependentLocalLawyer: optionalBool(input.hasIndependentLocalLawyer),
      hasIndependentLocalEngineer: optionalBool(input.hasIndependentLocalEngineer),
      usesIsraeliMarketingLawyerOnly: optionalBool(input.usesIsraeliMarketingLawyerOnly),
      leverage: typeof input.leverage === 'number' ? input.leverage : undefined,
      financeLtvPct: typeof input.financeLtvPct === 'number' ? input.financeLtvPct : undefined,
      expectedAnnualMaintenanceEur: optionalPositiveNumber(input.expectedAnnualMaintenanceEur),
    },
  };
}

export function parseIsraelTaxContext(input: unknown): { data: IsraelTaxContext; warning?: string; error?: string } {
  if (input === undefined) {
    return { data: { taxRoute: 'MARGINAL' }, warning: 'israelTax missing; defaulted taxRoute to MARGINAL' };
  }

  if (!isObject(input)) {
    return { error: 'israelTax must be an object', data: { taxRoute: 'MARGINAL' } };
  }

  const rawRoute = input.taxRoute;
  const taxRoute = rawRoute === 'FLAT_15' || rawRoute === 'MARGINAL' ? rawRoute : 'MARGINAL';
  const warning =
    rawRoute !== undefined && rawRoute !== 'FLAT_15' && rawRoute !== 'MARGINAL'
      ? 'Unknown taxRoute; defaulted to MARGINAL'
      : undefined;

  const paysLocalTaxRatePct =
    typeof input.paysLocalTaxRatePct === 'number' &&
    input.paysLocalTaxRatePct >= 0 &&
    input.paysLocalTaxRatePct <= 0.7
      ? input.paysLocalTaxRatePct
      : undefined;

  return {
    data: {
      taxRoute,
      paysLocalTaxRatePct,
      holdsViaForeignCompany: optionalBool(input.holdsViaForeignCompany),
      foreignCompanyIsCfc: optionalBool(input.foreignCompanyIsCfc),
    },
    warning,
  };
}
