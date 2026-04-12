import type {
  CityPlanConfig,
  CityPlanInput,
  CityPlanResult,
  BonusLineItem,
  CalculationStep,
} from '@/data/plans/types';

function lookupCoverage(config: CityPlanConfig, area: number): number {
  for (const rule of config.coverage) {
    if (rule.maxArea === null || area <= rule.maxArea) return rule.coveragePct;
  }
  return config.coverage[config.coverage.length - 1].coveragePct;
}

function lookupCoefficient(config: CityPlanConfig, floors: number) {
  const capped = Math.min(floors, config.coefficientTable[config.coefficientTable.length - 1].existingFloors);
  const entry = config.coefficientTable.find(e => e.existingFloors === capped);
  return entry ?? config.coefficientTable[0];
}

function lookupSetbacks(config: CityPlanConfig, width: number) {
  if (width <= 0) return null;
  for (const rule of config.setbacks) {
    if (rule.maxWidth === null || width <= rule.maxWidth) {
      return { front: config.constants.frontSetbackM, side: rule.side, rear: rule.rear };
    }
  }
  const last = config.setbacks[config.setbacks.length - 1];
  return { front: config.constants.frontSetbackM, side: last.side, rear: last.rear };
}

export function calculateCityPlan(
  input: CityPlanInput,
  config: CityPlanConfig,
): CityPlanResult {
  const steps: CalculationStep[] = [];
  const c = config.constants;

  // Step 1: Coverage
  const coveragePct = lookupCoverage(config, input.plotArea);
  const coverageArea = Math.round(input.plotArea * coveragePct / 100);
  steps.push({
    step: 1,
    title: 'תכסית',
    calculation: `${fmt(input.plotArea)} מ"ר × ${coveragePct}%`,
    result: `${fmt(coverageArea)} מ"ר`,
  });

  // Step 2: Coefficient
  const coeffEntry = lookupCoefficient(config, input.existingFloors);
  const coefficient = coeffEntry.coefficient;
  const maxFloorsLabel = coeffEntry.maxFloorsLabel;
  const baseRights = input.plotArea * (coveragePct / 100) * coefficient;
  steps.push({
    step: 2,
    title: 'זכויות בסיס',
    calculation: `${fmt(input.plotArea)} × ${coveragePct}% × ${coefficient}`,
    result: `${fmt(baseRights)} מ"ר`,
  });

  // Step 3: Bonuses
  const bonusBreakdown: BonusLineItem[] = [];
  let totalBonusPct = 0;
  for (const bonus of config.bonuses) {
    if (input.selectedBonusIds.includes(bonus.id)) {
      const area = Math.round(baseRights * bonus.pct / 100);
      bonusBreakdown.push({ id: bonus.id, label: bonus.label, pct: bonus.pct, area });
      totalBonusPct += bonus.pct;
    }
  }
  const bonusRights = Math.round(baseRights * totalBonusPct / 100);
  const residentialRights = Math.round(baseRights + bonusRights);
  steps.push({
    step: 3,
    title: 'בונוסים',
    calculation: totalBonusPct > 0
      ? `${fmt(baseRights)} × ${totalBonusPct}% = +${fmt(bonusRights)} מ"ר`
      : 'לא נבחרו בונוסים',
    result: `${fmt(residentialRights)} מ"ר זכויות מגורים`,
  });

  // Step 4: Public use + shared
  const publicUse = input.plotArea > c.publicUseThreshold ? c.publicUseSqm : 0;
  const sharedAreas = c.sharedAreasSqm;
  const totalAboveGround = residentialRights + publicUse + sharedAreas;
  steps.push({
    step: 4,
    title: 'סה"כ שטחי בנייה מעל קרקע',
    calculation: `${fmt(residentialRights)} + ${publicUse > 0 ? fmt(publicUse) + ' ציבורי + ' : ''}${sharedAreas} משותף`,
    result: `${fmt(totalAboveGround)} מ"ר`,
  });

  // Step 5: Unit count
  const avgUnitSize = (input.smallApartmentPct / 100) * config.unitSizes.smallAvgSqm +
    (1 - input.smallApartmentPct / 100) * config.unitSizes.largeAvgSqm;
  const maxUnitsByArea = Math.floor(residentialRights / avgUnitSize);
  const maxUnitsByDensity = Math.floor(input.plotArea / 1000 * c.densityUnitsPerDunam);
  const maxUnits = Math.min(maxUnitsByArea, maxUnitsByDensity);
  const smallUnits = Math.round(maxUnits * input.smallApartmentPct / 100);
  const largeUnits = maxUnits - smallUnits;
  steps.push({
    step: 5,
    title: 'יחידות דיור',
    calculation: `min(${maxUnitsByArea} לפי שטח, ${maxUnitsByDensity} לפי צפיפות)`,
    result: `${maxUnits} יח"ד`,
  });

  // Extra areas
  const balconies = maxUnits * c.balconySqmPerUnit;
  const undergroundPerLevel = Math.round(input.plotArea * c.undergroundCoveragePct / 100);
  const storage = maxUnits * c.storageSqmPerUnit;
  const maxCommercial = Math.round(residentialRights * c.maxCommercialPct / 100);

  // Setbacks
  const setbacks = lookupSetbacks(config, input.plotWidth);
  let buildableWidth = 0;
  let buildableDepth = 0;
  let buildableFootprint = 0;
  if (setbacks && input.plotWidth > 0) {
    buildableWidth = Math.max(0, input.plotWidth - 2 * setbacks.side);
    buildableDepth = input.plotDepth > 0
      ? Math.max(0, input.plotDepth - setbacks.front - setbacks.rear)
      : 0;
    buildableFootprint = buildableWidth * buildableDepth;
  }

  if (setbacks && input.plotWidth > 0) {
    steps.push({
      step: 6,
      title: 'קווי בניין',
      calculation: `קדמי ${setbacks.front}מ' | צידי ${setbacks.side}מ' | אחורי ${setbacks.rear}מ'`,
      result: input.plotDepth > 0
        ? `${fmtD(buildableWidth)} × ${fmtD(buildableDepth)} = ${fmt(buildableFootprint)} מ"ר`
        : `רוחב נטו: ${fmtD(buildableWidth)} מ'`,
    });
  }

  // Existing vs proposed
  let unitGain: number | null = null;
  let areaRatio: number | null = null;
  if (input.existingUnits > 0) {
    unitGain = maxUnits - input.existingUnits;
  }
  if (input.existingUnits > 0 && input.existingAvgUnitSize > 0 && input.existingFloors > 0) {
    const existingTotalArea = input.existingUnits * input.existingAvgUnitSize * input.existingFloors;
    if (existingTotalArea > 0) {
      areaRatio = residentialRights / existingTotalArea;
    }
  }

  return {
    coveragePct,
    coverageArea,
    coefficient,
    maxFloorsLabel,
    baseRights: Math.round(baseRights),
    bonusBreakdown,
    totalBonusPct,
    bonusRights,
    residentialRights,
    publicUse,
    sharedAreas,
    totalAboveGround,
    maxUnitsByArea,
    maxUnitsByDensity,
    maxUnits,
    smallUnits,
    largeUnits,
    balconies,
    undergroundPerLevel,
    maxUndergroundLevels: c.maxUndergroundLevels,
    storage,
    maxCommercial,
    setbacks,
    buildableWidth,
    buildableDepth,
    buildableFootprint,
    unitGain,
    areaRatio,
    steps,
  };
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('he-IL');
}

function fmtD(n: number): string {
  return n.toFixed(1);
}
