// Core data types for Zchut.AI - Auto-Ingest Zoning Engine
// The system starts EMPTY - all data comes from user uploads.
// Rules are stored as FORMULAS extracted from PDF documents.

export interface ZoningPlan {
  id: string;
  planNumber: string;
  name: string;
  city: string;
  neighborhood: string;
  approvalDate: string;
  status: 'active' | 'pending' | 'expired';
  planKind: 'detailed' | 'outline';
  zoningType: ZoningType;
  buildingRights: BuildingRights;
  restrictions: BuildingRestrictions;
  sourceDocument: SourceDocument;
  rules: ZoningRule[];
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

// ── Formula-Based Rule System ────────────────────────────────

export type ZoningRuleCategory =
  | 'main_rights'
  | 'service_area'
  | 'balcony'
  | 'tma38'
  | 'coverage'
  | 'max_floors'
  | 'max_height'
  | 'max_units'
  | 'units_per_dunam'
  | 'front_setback'
  | 'rear_setback'
  | 'side_setback'
  | 'basement'
  | 'rooftop'
  | 'parking'
  | 'other';

export const ruleCategoryLabels: Record<ZoningRuleCategory, string> = {
  main_rights: 'זכויות בנייה עיקריות',
  service_area: 'שטחי שירות',
  balcony: 'מרפסות',
  tma38: 'תמ"א 38 / התחדשות',
  coverage: 'תכסית',
  max_floors: 'קומות מרביות',
  max_height: 'גובה מרבי',
  max_units: 'יחידות דיור',
  units_per_dunam: 'צפיפות (יח"ד לדונם)',
  front_setback: 'קו בניין קדמי',
  rear_setback: 'קו בניין אחורי',
  side_setback: 'קו בניין צידי',
  basement: 'מרתף',
  rooftop: 'גג',
  parking: 'חניה',
  other: 'אחר',
};

export type RuleUnit =
  | 'percent'
  | 'sqm'
  | 'sqm_per_unit'
  | 'meters'
  | 'floors'
  | 'units'
  | 'ratio'
  | 'count'
  | 'spaces';

export const ruleUnitLabels: Record<RuleUnit, string> = {
  percent: '%',
  sqm: 'מ"ר',
  sqm_per_unit: 'מ"ר ליח\'',
  meters: 'מ\'',
  floors: 'קומות',
  units: 'יח"ד',
  ratio: '',
  count: '',
  spaces: 'חניות',
};

export interface ZoningRule {
  id: string;
  category: ZoningRuleCategory;
  label: string;
  formula: string;
  displayValue: string;
  rawNumber: number;
  unit: RuleUnit;
  source: RuleSource;
  confirmed: boolean;
}

export interface RuleSource {
  documentType: DocumentType;
  documentName: string;
  pageNumber?: number;
  tableRef?: string;
  rawText: string;
  confidence: number;
}

export type DocumentType = 'takanon' | 'rights_table' | 'annex';

export const documentTypeLabels: Record<DocumentType, string> = {
  takanon: 'תקנון',
  rights_table: 'טבלת זכויות',
  annex: 'נספח בינוי',
};

// ── Formula Evaluation ──────────────────────────────────────

export interface FormulaVars {
  Plot_Area: number;
  Plot_Width: number;
  Plot_Depth: number;
  Num_Units: number;
  Num_Floors: number;
  [key: string]: number;
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
    mainAreaSqm: number;
    serviceAreaSqm: number;
    totalBuildableSqm: number;
  };
  envelope: EnvelopeVerification;
  constraints: {
    maxFloors: number;
    maxHeight: number;
    maxUnits: number;
    landCoverageSqm: number;
  };
  formulaResults: FormulaResult[];
}

export interface FormulaResult {
  rule: ZoningRule;
  inputValues: Record<string, number>;
  result: number;
  calculation: string;
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

// ── App Screen State ────────────────────────────────────────

export type AppScreen = 'home' | 'admin' | 'calculate' | 'results';
