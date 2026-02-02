/**
 * Building Envelope Calculator
 *
 * Validates that calculated sqm actually fit within physical plot constraints.
 * Computes the "building envelope" (מעטפת בניין) from:
 * - Plot dimensions (width × depth)
 * - Setbacks (קווי בניין) - front, rear, sides
 * - Land coverage (תכסית)
 * - Floor count and height limits
 */

export interface EnvelopeInput {
  plotWidth: number;     // רוחב מגרש (מ')
  plotDepth: number;     // עומק מגרש (מ')
  plotArea: number;      // שטח מגרש (מ"ר)
  frontSetback: number;  // נסיגה קדמית (מ')
  rearSetback: number;   // נסיגה אחורית (מ')
  sideSetback: number;   // נסיגה צדדית (מ')
  maxCoverage: number;   // תכסית מרבית (%)
  maxFloors: number;     // קומות מרביות
  maxHeight: number;     // גובה מרבי (מ')
  floorHeight: number;   // גובה קומה טיפוסית (מ') - default 3.0
}

export interface EnvelopeResult {
  // Net buildable footprint after setbacks
  netWidth: number;        // רוחב נטו
  netDepth: number;        // עומק נטו
  netFootprint: number;    // שטח טביעת רגל נטו (מ"ר)

  // Coverage-limited footprint
  maxCoverageArea: number; // תכסית מרבית (מ"ר)
  effectiveFootprint: number; // הקטן מבין: נטו / תכסית

  // Volumetric capacity
  maxFloorArea: number;    // שטח קומה מרבי (מ"ר)
  totalVolume: number;     // סה"כ נפח בנייה (מ"ר * קומות)
  maxHeightFloors: number; // קומות לפי גובה

  // Verification flags
  fitsInPlot: boolean;             // האם נכנס במגרש
  coverageExceeded: boolean;       // תכסית חורגת
  heightConstraintBinding: boolean; // מוגבל בגובה

  // Step-by-step calculation for audit trail
  steps: EnvelopeStep[];
}

export interface EnvelopeStep {
  step: number;
  title: string;
  calculation: string;
  result: string;
  source: string;
}

/**
 * Calculate the maximum building envelope for a plot
 */
export function calculateBuildingEnvelope(input: EnvelopeInput): EnvelopeResult {
  const floorHeight = input.floorHeight || 3.0;
  const steps: EnvelopeStep[] = [];

  // Step 1: Net dimensions after setbacks
  const netWidth = Math.max(0, input.plotWidth - 2 * input.sideSetback);
  const netDepth = Math.max(0, input.plotDepth - input.frontSetback - input.rearSetback);
  const netFootprint = netWidth * netDepth;

  steps.push({
    step: 1,
    title: 'חישוב שטח נטו לאחר קווי בניין',
    calculation: `רוחב נטו: ${input.plotWidth} - (2 × ${input.sideSetback}) = ${netWidth} מ'
עומק נטו: ${input.plotDepth} - ${input.frontSetback} - ${input.rearSetback} = ${netDepth} מ'
שטח נטו: ${netWidth} × ${netDepth} = ${netFootprint} מ"ר`,
    result: `${netFootprint} מ"ר`,
    source: 'קווי בניין מתקנון התב"ע',
  });

  // Step 2: Coverage constraint
  const maxCoverageArea = Math.round((input.maxCoverage / 100) * input.plotArea);
  const effectiveFootprint = Math.min(netFootprint, maxCoverageArea);

  steps.push({
    step: 2,
    title: 'בדיקת תכסית מותרת',
    calculation: `תכסית מרבית: ${input.maxCoverage}% × ${input.plotArea} = ${maxCoverageArea} מ"ר
שטח נטו: ${netFootprint} מ"ר
שטח אפקטיבי (הנמוך מבין): ${effectiveFootprint} מ"ר`,
    result: `${effectiveFootprint} מ"ר`,
    source: 'סעיף תכסית בתקנון',
  });

  // Step 3: Height constraint
  const maxHeightFloors = Math.floor(input.maxHeight / floorHeight);
  const effectiveFloors = Math.min(input.maxFloors, maxHeightFloors);

  steps.push({
    step: 3,
    title: 'בדיקת מגבלת גובה',
    calculation: `גובה מרבי: ${input.maxHeight} מ' ÷ ${floorHeight} מ' לקומה = ${maxHeightFloors} קומות
קומות מותרות בתב"ע: ${input.maxFloors}
קומות אפקטיביות: ${effectiveFloors}`,
    result: `${effectiveFloors} קומות`,
    source: 'סעיף גובה בתקנון',
  });

  // Step 4: Total volume
  const maxFloorArea = effectiveFootprint;
  const totalVolume = maxFloorArea * effectiveFloors;

  steps.push({
    step: 4,
    title: 'חישוב נפח בנייה מרבי (מעטפת)',
    calculation: `שטח קומה: ${maxFloorArea} מ"ר × ${effectiveFloors} קומות = ${totalVolume} מ"ר`,
    result: `${totalVolume} מ"ר`,
    source: 'חישוב מעטפת בניין',
  });

  // Step 5: Verification
  const coverageExceeded = netFootprint > maxCoverageArea;
  const heightConstraintBinding = maxHeightFloors < input.maxFloors;

  steps.push({
    step: 5,
    title: 'אימות - התאמת זכויות למעטפת',
    calculation: `תכסית ${coverageExceeded ? 'מגבילה' : 'לא מגבילה'} (נטו ${netFootprint} vs מותר ${maxCoverageArea})
גובה ${heightConstraintBinding ? 'מגביל' : 'לא מגביל'} (${maxHeightFloors} vs ${input.maxFloors} קומות)`,
    result: `נפח מעטפת: ${totalVolume} מ"ר`,
    source: 'מנוע אימות',
  });

  return {
    netWidth,
    netDepth,
    netFootprint,
    maxCoverageArea,
    effectiveFootprint,
    maxFloorArea,
    totalVolume,
    maxHeightFloors: effectiveFloors,
    fitsInPlot: totalVolume > 0,
    coverageExceeded,
    heightConstraintBinding,
    steps,
  };
}

/**
 * Validate that requested building area fits within the envelope
 */
export function validateAreaFitsEnvelope(
  requestedArea: number,
  envelope: EnvelopeResult
): { fits: boolean; message: string; utilizationPercent: number } {
  const utilizationPercent = Math.round((requestedArea / envelope.totalVolume) * 100);

  if (requestedArea <= envelope.totalVolume) {
    return {
      fits: true,
      message: `שטח הבנייה (${requestedArea} מ"ר) נכנס במעטפת הבניין (${envelope.totalVolume} מ"ר). ניצולת: ${utilizationPercent}%`,
      utilizationPercent,
    };
  }

  const excess = requestedArea - envelope.totalVolume;
  return {
    fits: false,
    message: `שטח הבנייה (${requestedArea} מ"ר) חורג מהמעטפת (${envelope.totalVolume} מ"ר) ב-${excess} מ"ר. יש לבדוק הקלות או שינוי תב"ע.`,
    utilizationPercent,
  };
}
