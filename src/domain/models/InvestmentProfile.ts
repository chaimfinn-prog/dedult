import { Country } from '../enums/Country';

export type RentalMode = 'LONG_TERM' | 'AIRBNB';

export interface InvestmentProfile {
  country: Country;
  city?: string;
  isNorthCyprus?: boolean;
  isIsraeliOnlyProject?: boolean;
  assetType?: string;
  dealStructure?: 'PERSONAL' | 'COMPANY';
  priceEur: number;
  grossYieldPct: number;
  rentalMode: RentalMode;
  viaCompany: boolean;
  localCorporateTaxRate?: number;
  localIncomeTaxBrackets?: { upTo: number; rate: number }[];
  usesCyprus60DayRule?: boolean;
  hasIndependentLocalLawyer?: boolean;
  hasIndependentLocalEngineer?: boolean;
  usesIsraeliMarketingLawyerOnly?: boolean;
  leverage?: number;
  financeLtvPct?: number;
  expectedAnnualMaintenanceEur?: number;
}
