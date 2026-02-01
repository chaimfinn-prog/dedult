// Core data types for Zchut.AI - Zoning Compliance Analyzer

export interface ZoningPlan {
  id: string;
  planNumber: string; // e.g., "רע/3000"
  name: string;
  city: string;
  neighborhood: string;
  approvalDate: string;
  status: 'active' | 'pending' | 'expired';
  zoningType: ZoningType;
  buildingRights: BuildingRights;
  restrictions: BuildingRestrictions;
  tmaRights?: TmaRights; // תמ"א 38 rights
}

export type ZoningType =
  | 'residential_a' // מגורים א'
  | 'residential_b' // מגורים ב'
  | 'residential_c' // מגורים ג'
  | 'commercial' // מסחרי
  | 'mixed_use' // שימוש מעורב
  | 'industrial' // תעשייה
  | 'public' // ציבורי
  | 'agricultural'; // חקלאי

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

export interface BuildingRights {
  mainBuildingPercent: number; // אחוזי בנייה עיקריים
  serviceBuildingPercent: number; // אחוזי שטחי שירות
  totalBuildingPercent: number; // סה"כ אחוזי בנייה
  maxFloors: number; // מקסימום קומות
  maxHeight: number; // גובה מקסימלי במטרים
  maxUnits: number; // מספר יחידות דיור מקסימלי
  basementAllowed: boolean;
  basementPercent: number; // אחוזי מרתף
  rooftopPercent: number; // אחוזי גג (חדר יציאה לגג)
  floorAllocations: FloorAllocation[];
}

export interface FloorAllocation {
  floor: FloorType;
  label: string;
  mainAreaPercent: number; // שטח עיקרי (%)
  serviceAreaPercent: number; // שטח שירות (%)
  notes: string;
}

export type FloorType =
  | 'basement'
  | 'ground'
  | 'typical'
  | 'top'
  | 'rooftop';

export const floorTypeLabels: Record<FloorType, string> = {
  basement: 'מרתף',
  ground: 'קומת קרקע',
  typical: 'קומה טיפוסית',
  top: 'קומה עליונה',
  rooftop: 'יציאה לגג',
};

export interface BuildingRestrictions {
  frontSetback: number; // נסיגה קדמית (מטרים)
  rearSetback: number; // נסיגה אחורית
  sideSetback: number; // נסיגה צדדית
  minParkingSpaces: number; // חניות נדרשות
  minGreenAreaPercent: number; // אחוז שטח ירוק
  maxLandCoverage: number; // אחוז כיסוי קרקע
}

export interface TmaRights {
  eligible: boolean;
  additionalFloors: number;
  additionalBuildingPercent: number;
  seismicUpgradeRequired: boolean;
  notes: string;
}

export interface PropertySearch {
  address: string;
  city: string;
  block: string; // גוש
  parcel: string; // חלקה
  plotSize: number; // גודל מגרש במ"ר
  currentBuiltArea: number; // שטח בנוי קיים במ"ר
  currentFloors: number;
}

export interface AnalysisResult {
  property: PropertySearch;
  zoningPlan: ZoningPlan;
  calculations: BuildingCalculations;
  financial: FinancialEstimate;
  timestamp: Date;
}

export interface BuildingCalculations {
  maxBuildableArea: number; // סה"כ שטח בנייה מותר
  currentBuiltArea: number; // שטח בנוי קיים
  additionalBuildableArea: number; // פוטנציאל בנייה נוסף
  mainAreaTotal: number; // סה"כ שטח עיקרי
  serviceAreaTotal: number; // סה"כ שטחי שירות
  basementArea: number; // שטח מרתף
  rooftopArea: number; // שטח גג
  floorBreakdown: FloorBreakdownItem[];
  landCoverageArea: number; // שטח כיסוי קרקע
  greenArea: number; // שטח ירוק נדרש
  parkingSpaces: number; // חניות נדרשות
}

export interface FloorBreakdownItem {
  floor: string;
  label: string;
  mainArea: number; // מ"ר עיקרי
  serviceArea: number; // מ"ר שירות
  totalArea: number; // סה"כ מ"ר
}

export interface FinancialEstimate {
  pricePerSqm: number; // מחיר למ"ר באזור
  additionalValueEstimate: number; // הערכת שווי תוספת
  constructionCostPerSqm: number; // עלות בנייה למ"ר
  estimatedConstructionCost: number; // עלות בנייה משוערת
  estimatedProfit: number; // רווח משוער
  neighborhoodAvgPrice: number; // מחיר ממוצע בשכונה
}

export interface AnalysisLogEntry {
  id: string;
  message: string;
  type: 'info' | 'search' | 'extract' | 'calculate' | 'complete' | 'warning';
  timestamp: number;
}

export type AppScreen = 'search' | 'analyzing' | 'results';
