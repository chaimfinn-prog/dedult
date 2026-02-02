// Core data types for Zchut.AI - Premium Zoning Intelligence Platform

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
  tmaRights?: TmaRights;
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
  confidence: number; // 0-100
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

export const floorTypeLabels: Record<FloorType, string> = {
  basement: 'מרתף',
  ground: 'קומת קרקע',
  typical: 'קומה טיפוסית',
  top: 'קומה עליונה',
  rooftop: 'יציאה לגג',
};

export interface BuildingRestrictions {
  frontSetback: number;
  rearSetback: number;
  sideSetback: number;
  minParkingSpaces: number;
  minGreenAreaPercent: number;
  maxLandCoverage: number;
}

export interface TmaRights {
  eligible: boolean;
  tmaType: '38/1' | '38/2' | 'none';
  additionalFloors: number;
  additionalBuildingPercent: number;
  seismicUpgradeRequired: boolean;
  notes: string;
}

export interface PropertySearch {
  address: string;
  city: string;
  block: string;
  parcel: string;
  plotSize: number;
  plotWidth?: number;
  plotDepth?: number;
  currentBuiltArea: number;
  currentFloors: number;
}

export interface AnalysisResult {
  property: PropertySearch;
  zoningPlan: ZoningPlan;
  calculations: BuildingCalculations;
  urbanRenewalEligibility: UrbanRenewalEligibility;
  financial: FinancialEstimate;
  timestamp: Date;
}

export interface BuildingCalculations {
  maxBuildableArea: number;
  currentBuiltArea: number;
  additionalBuildableArea: number;
  mainAreaTotal: number;
  serviceAreaTotal: number;
  basementArea: number;
  rooftopArea: number;
  floorBreakdown: FloorBreakdownItem[];
  landCoverageArea: number;
  greenArea: number;
  parkingSpaces: number;
  netBuildableArea: number;
}

export interface FloorBreakdownItem {
  floor: string;
  label: string;
  mainArea: number;
  serviceArea: number;
  totalArea: number;
  isExisting?: boolean;
  isAdditional?: boolean;
}

export interface CostBreakdown {
  constructionCost: number;        // עלות בנייה ישירה
  planningAndSupervision: number;  // תכנון ופיקוח (אדריכל, מהנדס, מפקח)
  bettermentLevy: number;          // היטל השבחה
  buildingPermitFees: number;      // אגרות בנייה
  developmentLevies: number;       // היטלי פיתוח (מים, ביוב, כבישים)
  vat: number;                     // מע"מ 17%
  legalAndMisc: number;            // עלויות משפטיות ושונות
  totalCost: number;               // סך הכל עלויות
}

export interface EligibilityCriterion {
  criterion: string;
  required: string;
  actual: string;
  met: boolean;
}

export interface UrbanRenewalEligibility {
  tma38Eligible: boolean;
  tma38Type: '38/1' | '38/2' | 'none';
  tma38Reason: string;
  tma38Criteria: EligibilityCriterion[];
  urbanRenewalPlanEligible: boolean;
  urbanRenewalPlanNumber: string;
  urbanRenewalReason: string;
  urbanRenewalCriteria: EligibilityCriterion[];
  tmaAdditionalArea: number;
  urbanRenewalAdditionalArea: number;
}

export interface FinancialEstimate {
  pricePerSqm: number;
  additionalValueEstimate: number;
  constructionCostPerSqm: number;
  estimatedConstructionCost: number;
  estimatedProfit: number;
  neighborhoodAvgPrice: number;
  costBreakdown: CostBreakdown;
}

// User path segmentation
export type UserPath = 'homeowner' | 'developer';

export const userPathLabels: Record<UserPath, { title: string; subtitle: string }> = {
  homeowner: {
    title: 'בעל נכס',
    subtitle: 'מה מותר לי לבנות?',
  },
  developer: {
    title: 'יזם / התחדשות',
    subtitle: 'כדאיות כלכלית ופוטנציאל',
  },
};

// Audit trail for transparent step-by-step verification
export interface AuditStep {
  step: number;
  title: string;
  subtitle: string;
  data: Record<string, string | number>;
  source: string;
  sourceType: 'mapi_gis' | 'iplan_api' | 'rishui_zamin' | 'local_db' | 'calculation';
  citations?: SourceCitation[];
}

// Building envelope result (physical constraint validation)
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

// Developer economic report (דו"ח אפס)
export interface DeveloperReport {
  // Revenue
  totalSaleableArea: number;      // שטח למכירה
  avgPricePerSqm: number;         // מחיר ממוצע למ"ר
  totalRevenue: number;            // הכנסות צפויות

  // Costs
  landCost: number;                // עלות קרקע / דירות קיימות
  constructionCost: number;        // עלות בנייה
  softCosts: number;               // עלויות רכות (תכנון, שיווק, משפטי)
  leviesAndFees: number;           // היטלים ואגרות
  financingCost: number;           // עלויות מימון
  totalCost: number;               // סך הכל עלויות

  // Profitability
  grossProfit: number;             // רווח גולמי
  profitPercent: number;           // אחוז רווח
  profitPerUnit: number;           // רווח ליח"ד
  newUnits: number;                // יח"ד חדשות

  // Feasibility
  feasible: boolean;
  feasibilityNote: string;
}

export interface AnalysisResult {
  property: PropertySearch;
  zoningPlan: ZoningPlan;
  calculations: BuildingCalculations;
  urbanRenewalEligibility: UrbanRenewalEligibility;
  financial: FinancialEstimate;
  envelope?: EnvelopeVerification;
  auditTrail?: AuditStep[];
  developerReport?: DeveloperReport;
  timestamp: Date;
}

export interface AnalysisLogEntry {
  id: string;
  message: string;
  type: 'info' | 'search' | 'extract' | 'calculate' | 'complete' | 'warning' | 'radar';
  timestamp: number;
}

export type AppScreen = 'search' | 'analyzing' | 'results';
