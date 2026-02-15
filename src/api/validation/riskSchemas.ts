import { Country } from '@/domain/enums/Country';
import { InvestmentProfile } from '@/domain/models/InvestmentProfile';
import { IsraelTaxContext } from '@/domain/rules/israelTaxRiskRules';

const validCountries = new Set(Object.values(Country));

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

  const isNorthCyprus = Boolean(input.isNorthCyprus) || country === Country.NORTH_CYPRUS;

  return {
    data: {
      country: country as Country,
      city: typeof input.city === 'string' ? input.city : undefined,
      isNorthCyprus,
      isIsraeliOnlyProject: typeof input.isIsraeliOnlyProject === 'boolean' ? input.isIsraeliOnlyProject : undefined,
      assetType: typeof input.assetType === 'string' ? input.assetType : undefined,
      dealStructure: input.dealStructure === 'PERSONAL' || input.dealStructure === 'COMPANY' ? input.dealStructure : undefined,
      priceEur,
      grossYieldPct,
      rentalMode,
      viaCompany: input.viaCompany,
      localCorporateTaxRate:
        typeof input.localCorporateTaxRate === 'number' && input.localCorporateTaxRate >= 0
          ? input.localCorporateTaxRate
          : undefined,
      usesCyprus60DayRule: typeof input.usesCyprus60DayRule === 'boolean' ? input.usesCyprus60DayRule : undefined,
      hasIndependentLocalLawyer:
        typeof input.hasIndependentLocalLawyer === 'boolean' ? input.hasIndependentLocalLawyer : undefined,
      hasIndependentLocalEngineer:
        typeof input.hasIndependentLocalEngineer === 'boolean' ? input.hasIndependentLocalEngineer : undefined,
      usesIsraeliMarketingLawyerOnly:
        typeof input.usesIsraeliMarketingLawyerOnly === 'boolean' ? input.usesIsraeliMarketingLawyerOnly : undefined,
      leverage: typeof input.leverage === 'number' ? input.leverage : undefined,
      financeLtvPct: typeof input.financeLtvPct === 'number' ? input.financeLtvPct : undefined,
      expectedAnnualMaintenanceEur:
        typeof input.expectedAnnualMaintenanceEur === 'number' ? input.expectedAnnualMaintenanceEur : undefined,
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
  let warning: string | undefined;
  const taxRoute = rawRoute === 'FLAT_15' || rawRoute === 'MARGINAL' ? rawRoute : 'MARGINAL';

  if (rawRoute !== undefined && rawRoute !== 'FLAT_15' && rawRoute !== 'MARGINAL') {
    warning = 'Unknown taxRoute; defaulted to MARGINAL';
  }

  const paysLocalTaxRatePct =
    typeof input.paysLocalTaxRatePct === 'number' && input.paysLocalTaxRatePct >= 0 && input.paysLocalTaxRatePct <= 0.7
      ? input.paysLocalTaxRatePct
      : undefined;

  return {
    data: {
      taxRoute,
      paysLocalTaxRatePct,
      holdsViaForeignCompany: typeof input.holdsViaForeignCompany === 'boolean' ? input.holdsViaForeignCompany : undefined,
      foreignCompanyIsCfc: typeof input.foreignCompanyIsCfc === 'boolean' ? input.foreignCompanyIsCfc : undefined,
    },
    warning,
  };
}
