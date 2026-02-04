// Core data types for Zchut.AI - Dynamic Zoning Engine
// The system starts EMPTY - all data comes from user uploads.

export interface ZoningPlan {
  id: string;
  planNumber: string;
  name: string;
  city: string;
  neighborhood: string;
  approvalDate: string;
  status: 'active' | 'pending' | 'expired';
  zoningType: ZoningType;
  buildingRights: BuildingRights;
  restrictions: BuildingRestrictions;
  sourceDocument: SourceDocument;
}

export type ZoningType =
  | 'residential_a'
  | 'residential_b'
  | 'residential_c'
  | 'commercial'
  | 'mixed_use'
  | 'industrial'
  | 'public'
  | 'agricultural';

export const zoningTypeLabels: Record<ZoningType, string> = {
  residential_a: "מגורים א'",
  residential_b: "מגורים ב'",
  residential_c: "מגורים ג'",
  commercial: 'מסחרי',
  mixed_use: 'שימוש מעורב',
  industrial: 'תעשייה',
  public: 'ציבורי',
  agricultural: 'חקלאי',
};

export interface SourceDocument {
  name: string;
  url?: string;
  lastUpdated: string;
}

export interface SourceCitation {
  value: string;
  source: string;
  section: string;
  quote: string;
  confidence: number;
  page?: number;
}

export interface BuildingRights {
  mainBuildingPercent: number;
  serviceBuildingPercent: number;
  totalBuildingPercent: number;
  maxFloors: number;
  maxHeight: number;
  maxUnits: number;
  basementAllowed: boolean;
  basementPercent: number;
  rooftopPercent: number;
  landCoveragePercent: number;
  floorAllocations: FloorAllocation[];
  citations: SourceCitation[];
}

export interface FloorAllocation {
  floor: FloorType;
  label: string;
  mainAreaPercent: number;
  serviceAreaPercent: number;
  notes: string;
}

export type FloorType = 'basement' | 'ground' | 'typical' | 'top' | 'rooftop';

export interface BuildingRestrictions {
  frontSetback: number;
  rearSetback: number;
  sideSetback: number;
  minParkingSpaces: number;
  minGreenAreaPercent: number;
  maxLandCoverage: number;
}

// ── User Input for Calculation ──────────────────────────────

export interface PlotInput {
  block: string;
  parcel: string;
  city: string;
  plotWidth: number;
  plotDepth: number;
  plotArea: number;
}

// ── Calculation Results ─────────────────────────────────────

export interface CalculationResult {
  plan: ZoningPlan;
  input: PlotInput;
  buildable: {
    mainAreaSqm: number;      // plotArea * mainBuildingPercent / 100
    serviceAreaSqm: number;   // plotArea * serviceBuildingPercent / 100
    totalBuildableSqm: number; // main + service
  };
  envelope: EnvelopeVerification;
  constraints: {
    maxFloors: number;
    maxHeight: number;
    maxUnits: number;
    landCoverageSqm: number;
  };
}

export interface EnvelopeVerification {
  netFootprint: number;
  maxCoverageArea: number;
  effectiveFootprint: number;
  totalEnvelopeVolume: number;
  requestedArea: number;
  fits: boolean;
  utilizationPercent: number;
  message: string;
  steps: Array<{
    step: number;
    title: string;
    calculation: string;
    result: string;
    source: string;
  }>;
}

// ── Floor breakdown for 3D visualization ────────────────────

export interface FloorBreakdownItem {
  floor: string;
  label: string;
  mainArea: number;
  serviceArea: number;
  totalArea: number;
}

// ── Financial Estimate ──────────────────────────────────────

export interface FinancialEstimate {
  pricePerSqm: number;
  additionalValueEstimate: number;
  constructionCostPerSqm: number;
  estimatedConstructionCost: number;
  estimatedProfit: number;
}

// ── App Screen State ────────────────────────────────────────

export type AppScreen = 'home' | 'admin' | 'calculate' | 'results';
