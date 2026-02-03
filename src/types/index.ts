// ===== Zchut.AI Type Definitions =====

export type ViewMode = 'homeowner' | 'developer';

// Property & Land Registry
export interface Property {
  id: string;
  address: string;
  city: string;
  gush: number;
  chelka: number;
  plotArea: number; // sqm
  builtArea: number; // current built sqm
  floors: number;
  yearBuilt: number;
  landUse: string;
  zone: string;
  neighborhoodName: string;
}

// Zoning Plan (Taba)
export interface ZoningPlan {
  planNumber: string;
  planName: string;
  approvalDate: string;
  city: string;
  status: 'approved' | 'pending' | 'deposited';
  buildingPercentage: number;
  maxFloors: number;
  maxHeight: number;
  frontSetback: number;
  sideSetback: number;
  rearSetback: number;
  allowedUses: string[];
  parkingRatio: number;
  publicAreaPercentage: number;
  serviceAreaPercentage: number;
  basementAllowed: boolean;
  poolAllowed: boolean;
  balconyPercentage: number;
  sources: SourceReference[];
}

// Building Rights Calculation
export interface BuildingRights {
  totalAllowed: number;
  currentBuilt: number;
  remaining: number;
  mainBuildPercentage: number;
  serviceAreaAllowed: number;
  balconyAllowed: number;
  basementAllowed: number;
  totalWithServices: number;
  breakdown: BuildingRightsBreakdown[];
  sources: SourceReference[];
}

export interface BuildingRightsBreakdown {
  label: string;
  percentage: number;
  sqm: number;
  source: SourceReference;
}

// Enhancement Opportunities (Homeowner View)
export interface Enhancement {
  type: 'extension' | 'pool' | 'basement' | 'floor' | 'balcony' | 'mamad';
  title: string;
  description: string;
  additionalSqm: number;
  estimatedCost: number;
  estimatedValueAdd: number;
  isEligible: boolean;
  eligibilityReason: string;
  source: SourceReference;
}

// Duch Efes - Zero Report (Developer View)
export interface DuchEfes {
  totalSellableArea: number;
  totalUnits: number;
  unitMix: UnitMix[];
  constructionCostPerSqm: number;
  totalConstructionCost: number;
  landValueEstimate: number;
  bettermentLevy: number;
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  feasibilityScore: 'excellent' | 'good' | 'marginal' | 'unfeasible';
  sources: SourceReference[];
}

export interface UnitMix {
  type: string;
  count: number;
  avgSize: number;
  pricePerSqm: number;
  totalValue: number;
}

// Source Reference (Audit Trail)
export interface SourceReference {
  id: string;
  documentName: string;
  planNumber: string;
  pageNumber: number;
  sectionTitle: string;
  quote: string;
  confidence: number;
}

// Analysis Result
export interface PropertyAnalysis {
  property: Property;
  zoningPlan: ZoningPlan;
  buildingRights: BuildingRights;
  enhancements: Enhancement[];
  duchEfes: DuchEfes;
  allSources: SourceReference[];
  analyzedAt: string;
}

// Search
export interface SearchResult {
  property: Property;
  matchType: 'address' | 'gush_chelka';
  relevance: number;
}
