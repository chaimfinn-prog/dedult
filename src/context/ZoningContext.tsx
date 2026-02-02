'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AnalysisResult,
  AnalysisLogEntry,
  AppScreen,
  BuildingCalculations,
  FinancialEstimate,
  FloorBreakdownItem,
  CostBreakdown,
  UrbanRenewalEligibility,
} from '@/types';
import {
  findPlanByAddress,
  findPlanById,
  addressMappings,
  checkTma38Eligibility,
  checkUrbanRenewalEligibility,
  raananaUrbanRenewalPlan,
  type AddressMapping,
} from '@/data/zoning-plans';

interface ZoningContextType {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  logs: AnalysisLogEntry[];
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  analyze: (address: string, plotSize: number, currentBuiltArea: number, currentFloors: number) => Promise<void>;
  reset: () => void;
}

const ZoningContext = createContext<ZoningContextType | null>(null);

export function useZoning() {
  const ctx = useContext(ZoningContext);
  if (!ctx) throw new Error('useZoning must be used within ZoningProvider');
  return ctx;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let logId = 0;

export function ZoningProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>('search');
  const [logs, setLogs] = useState<AnalysisLogEntry[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addLog = useCallback(
    (message: string, type: AnalysisLogEntry['type']) => {
      setLogs((prev) => [
        ...prev,
        { id: String(++logId), message, type, timestamp: Date.now() },
      ]);
    },
    []
  );

  const analyze = useCallback(
    async (
      address: string,
      plotSize: number,
      currentBuiltArea: number,
      currentFloors: number
    ) => {
      setIsAnalyzing(true);
      setLogs([]);
      setResult(null);
      setScreen('analyzing');

      addLog('RADAR // סורק מאגר כתובות ארצי...', 'radar');
      await delay(600);

      addLog('מחפש כתובת במאגר GovMap.gov.il...', 'search');
      await delay(800);

      const mapping = findPlanByAddress(address);
      if (!mapping) {
        const fallback = addressMappings[0];
        addLog(`כתובת "${address}" - נתוני דמו (${fallback.neighborhood})`, 'warning');
        await delay(500);
        await runAnalysis(fallback.planId, address, fallback, plotSize || fallback.plotSize, currentBuiltArea || fallback.existingArea, currentFloors || fallback.existingFloors);
        return;
      }

      addLog(`זוהה: גוש ${mapping.block}, חלקה ${mapping.parcel}`, 'info');
      await delay(600);

      addLog(`שכונה: ${mapping.neighborhood} | מגרש: ${mapping.plotSize} מ"ר (${mapping.plotWidth}×${mapping.plotDepth} מ')`, 'info');
      await delay(400);

      if (mapping.yearBuilt) {
        addLog(`שנת בנייה: ${mapping.yearBuilt} | ${mapping.existingUnits} יח"ד | ${mapping.existingFloors} קומות | ${mapping.existingArea} מ"ר בנוי`, 'info');
      }
      await delay(500);

      // Use the REAL mapping data - only override if user explicitly entered different values
      const effectivePlot = plotSize || mapping.plotSize;
      const effectiveBuilt = currentBuiltArea || mapping.existingArea;
      const effectiveFloors = currentFloors || mapping.existingFloors;

      await runAnalysis(mapping.planId, address, mapping, effectivePlot, effectiveBuilt, effectiveFloors);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function runAnalysis(
    planId: string,
    address: string,
    mapping: AddressMapping,
    plotSize: number,
    currentBuiltArea: number,
    currentFloors: number
  ) {
    const plan = findPlanById(planId);
    if (!plan) {
      addLog('שגיאה: לא נמצאה תב"ע חלה', 'warning');
      setIsAnalyzing(false);
      return;
    }

    addLog('RADAR // סורק מאגר תכנון ארצי (mavat.iplan.gov.il)...', 'radar');
    await delay(700);

    addLog(`מאתר תב"ע חלה: ${plan.planNumber} - ${plan.name}`, 'search');
    await delay(800);

    addLog(`ייעוד קרקע: ${plan.zoningType === 'residential_a' ? "מגורים א'" : plan.zoningType === 'residential_b' ? "מגורים ב'" : 'שימוש מעורב'}`, 'info');
    await delay(400);

    addLog(`מקור: ${plan.sourceDocument.name} | עדכון: ${plan.sourceDocument.lastUpdated}`, 'info');
    await delay(500);

    addLog('מחלץ זכויות בנייה מתוך תקנון התב"ע...', 'extract');
    await delay(900);

    // Show citations
    for (const citation of plan.buildingRights.citations.slice(0, 3)) {
      addLog(`[${citation.confidence}% ודאות] ${citation.section}: ${citation.value}`, 'extract');
      await delay(400);
    }

    addLog(`תכסית מותרת: ${plan.buildingRights.landCoveragePercent}% | קווי בניין: ${plan.restrictions.frontSetback}/${plan.restrictions.sideSetback}/${plan.restrictions.rearSetback} מ'`, 'extract');
    await delay(400);

    addLog(`צפיפות מותרת: עד ${plan.buildingRights.maxUnits} יח"ד | חניות: ${plan.restrictions.minParkingSpaces} לדירה`, 'extract');
    await delay(300);

    // ========== TMA 38 Eligibility Check ==========
    addLog('RADAR // בודק זכאות לתמ"א 38...', 'radar');
    await delay(700);

    const tma38Check = checkTma38Eligibility(mapping, plan);

    for (const c of tma38Check.criteria) {
      const icon = c.met ? '✓' : '✗';
      addLog(`[תמ"א 38] ${icon} ${c.criterion}: ${c.actual} (נדרש: ${c.required})`, c.met ? 'extract' : 'warning');
      await delay(300);
    }

    addLog(tma38Check.reason, tma38Check.eligible ? 'info' : 'warning');
    await delay(500);

    // ========== Urban Renewal Plan רע/רע/ב Check ==========
    addLog(`RADAR // בודק זכאות לתכנית התחדשות עירונית ${raananaUrbanRenewalPlan.planNumber}...`, 'radar');
    await delay(700);

    const urbanCheck = checkUrbanRenewalEligibility(mapping);

    for (const c of urbanCheck.criteria) {
      const icon = c.met ? '✓' : '✗';
      addLog(`[${urbanCheck.planNumber}] ${icon} ${c.criterion}: ${c.actual} (נדרש: ${c.required})`, c.met ? 'extract' : 'warning');
      await delay(300);
    }

    addLog(urbanCheck.reason, urbanCheck.eligible ? 'info' : 'warning');
    await delay(500);

    if (urbanCheck.eligible && urbanCheck.citations.length > 0) {
      addLog(`מצטט מתקנון ${urbanCheck.planNumber}:`, 'extract');
      await delay(300);
      for (const cit of urbanCheck.citations.slice(0, 2)) {
        addLog(`[${cit.confidence}% ודאות] ${cit.section}: ${cit.value}`, 'extract');
        await delay(300);
      }
    }

    // ========== Calculations ==========
    addLog('מבצע חישובי שטחים ונפחים (Massing Study)...', 'calculate');
    await delay(800);

    const calculations = calculateBuildingRights(plan, plotSize, currentBuiltArea, mapping, urbanCheck.eligible);

    addLog(`שטח בנייה מותר מכוח תב"ע (${plan.planNumber}): ${calculations.maxBuildableArea} מ"ר`, 'calculate');
    await delay(300);

    addLog(`שטח בנוי קיים: ${calculations.currentBuiltArea} מ"ר (${mapping.existingUnits} יח"ד, ${currentFloors} קומות)`, 'calculate');
    await delay(300);

    addLog(`פוטנציאל בנייה מכוח תב"ע: ${Math.max(0, calculations.maxBuildableArea - calculations.currentBuiltArea)} מ"ר`, 'calculate');
    await delay(300);

    if (tma38Check.eligible) {
      const tmaArea = calculations.floorBreakdown.find(f => f.floor === 'tma')?.totalArea || 0;
      addLog(`תוספת מכוח תמ"א 38/${tma38Check.tmaType === '38/2' ? '2' : '1'}: ${tmaArea} מ"ר`, 'calculate');
      await delay(300);
    }

    if (urbanCheck.eligible) {
      const urbanArea = calculations.floorBreakdown.find(f => f.floor === 'urban_renewal')?.totalArea || 0;
      addLog(`תוספת מכוח ${urbanCheck.planNumber}: ${urbanArea} מ"ר`, 'calculate');
      await delay(300);
    }

    addLog(`סה"כ פוטנציאל בנייה נוסף: ${calculations.additionalBuildableArea} מ"ר`, 'calculate');
    await delay(400);

    // ========== Financial with Levies ==========
    addLog('מחשב הערכה כלכלית כולל היטלים ואגרות...', 'calculate');
    await delay(600);

    const financial = calculateFinancials(
      calculations.additionalBuildableArea,
      mapping.avgPricePerSqm,
      mapping.constructionCostPerSqm,
      calculations.maxBuildableArea - calculations.currentBuiltArea // value increase for betterment levy
    );

    addLog(`עלות בנייה ישירה: ₪${formatCurrency(financial.costBreakdown.constructionCost)}`, 'calculate');
    await delay(200);
    addLog(`היטל השבחה (50%): ₪${formatCurrency(financial.costBreakdown.bettermentLevy)}`, 'calculate');
    await delay(200);
    addLog(`אגרות + היטלי פיתוח: ₪${formatCurrency(financial.costBreakdown.buildingPermitFees + financial.costBreakdown.developmentLevies)}`, 'calculate');
    await delay(200);
    addLog(`תכנון ופיקוח: ₪${formatCurrency(financial.costBreakdown.planningAndSupervision)}`, 'calculate');
    await delay(200);
    addLog(`מע"מ: ₪${formatCurrency(financial.costBreakdown.vat)}`, 'calculate');
    await delay(200);

    addLog(`סה"כ עלויות: ₪${formatCurrency(financial.costBreakdown.totalCost)} | שווי: ₪${formatCurrency(financial.additionalValueEstimate)} | ROI: ${Math.round(((financial.estimatedProfit / financial.costBreakdown.totalCost) * 100))}%`, 'calculate');
    await delay(400);

    addLog('ניתוח הושלם בהצלחה', 'complete');
    await delay(300);

    // Build eligibility result
    const tmaAdditionalArea = tma38Check.eligible
      ? Math.round((plan.tmaRights?.additionalBuildingPercent || 0) / 100 * plotSize)
      : 0;
    const urbanRenewalAdditionalArea = urbanCheck.eligible && urbanCheck.additionalRights
      ? Math.round(urbanCheck.additionalRights.additionalBuildingPercent / 100 * calculations.maxBuildableArea)
      : 0;

    const urbanRenewalEligibility: UrbanRenewalEligibility = {
      tma38Eligible: tma38Check.eligible,
      tma38Type: tma38Check.tmaType,
      tma38Reason: tma38Check.reason,
      tma38Criteria: tma38Check.criteria,
      urbanRenewalPlanEligible: urbanCheck.eligible,
      urbanRenewalPlanNumber: urbanCheck.planNumber,
      urbanRenewalReason: urbanCheck.reason,
      urbanRenewalCriteria: urbanCheck.criteria,
      tmaAdditionalArea,
      urbanRenewalAdditionalArea,
    };

    const analysisResult: AnalysisResult = {
      property: {
        address,
        city: 'רעננה',
        block: mapping.block,
        parcel: mapping.parcel,
        plotSize,
        plotWidth: mapping.plotWidth,
        plotDepth: mapping.plotDepth,
        currentBuiltArea,
        currentFloors,
      },
      zoningPlan: plan,
      calculations,
      urbanRenewalEligibility,
      financial,
      timestamp: new Date(),
    };

    setResult(analysisResult);
    setIsAnalyzing(false);

    await delay(800);
    setScreen('results');
  }

  const reset = useCallback(() => {
    setScreen('search');
    setLogs([]);
    setResult(null);
    setIsAnalyzing(false);
  }, []);

  return (
    <ZoningContext.Provider
      value={{ screen, setScreen, logs, result, isAnalyzing, analyze, reset }}
    >
      {children}
    </ZoningContext.Provider>
  );
}

function calculateBuildingRights(
  plan: NonNullable<ReturnType<typeof findPlanById>>,
  plotSize: number,
  currentBuiltArea: number,
  mapping: AddressMapping,
  urbanRenewalEligible: boolean
): BuildingCalculations {
  const rights = plan.buildingRights;
  const restrictions = plan.restrictions;

  const mainAreaTotal = Math.round((rights.mainBuildingPercent / 100) * plotSize);
  const serviceAreaTotal = Math.round((rights.serviceBuildingPercent / 100) * plotSize);
  const maxBuildableArea = mainAreaTotal + serviceAreaTotal;
  const basementArea = Math.round((rights.basementPercent / 100) * plotSize);
  const rooftopArea = Math.round((rights.rooftopPercent / 100) * plotSize);
  const landCoverageArea = Math.round((restrictions.maxLandCoverage / 100) * plotSize);
  const greenArea = Math.round((restrictions.minGreenAreaPercent / 100) * plotSize);
  const parkingSpaces = Math.ceil(rights.maxUnits * restrictions.minParkingSpaces);

  const netBuildableArea = Math.round(landCoverageArea - (restrictions.frontSetback * 2 + restrictions.sideSetback * 2));

  const floorBreakdown: FloorBreakdownItem[] = rights.floorAllocations.map((alloc) => {
    const mainArea = Math.round((alloc.mainAreaPercent / 100) * plotSize);
    const serviceArea = Math.round((alloc.serviceAreaPercent / 100) * plotSize);
    return {
      floor: alloc.floor,
      label: alloc.label,
      mainArea,
      serviceArea,
      totalArea: mainArea + serviceArea,
    };
  });

  let totalAdditionalFromTma = 0;
  let totalAdditionalFromUrbanRenewal = 0;

  // TMA 38 rights (separate calculation)
  if (plan.tmaRights?.eligible && mapping.yearBuilt && mapping.yearBuilt < 1980) {
    const tmaAdditional = Math.round((plan.tmaRights.additionalBuildingPercent / 100) * plotSize);
    totalAdditionalFromTma = tmaAdditional;
    floorBreakdown.push({
      floor: 'tma',
      label: `תוספת תמ"א 38/${plan.tmaRights.tmaType === '38/1' ? '1' : '2'}`,
      mainArea: tmaAdditional,
      serviceArea: 0,
      totalArea: tmaAdditional,
      isAdditional: true,
    });
  }

  // Urban renewal plan רע/רע/ב rights (separate calculation)
  if (urbanRenewalEligible) {
    const urbanRights = raananaUrbanRenewalPlan.rights;
    const urbanAdditional = Math.round((urbanRights.additionalBuildingPercent / 100) * maxBuildableArea);
    totalAdditionalFromUrbanRenewal = urbanAdditional;
    floorBreakdown.push({
      floor: 'urban_renewal',
      label: `תוספת מכוח ${raananaUrbanRenewalPlan.planNumber}`,
      mainArea: urbanAdditional,
      serviceArea: 0,
      totalArea: urbanAdditional,
      isAdditional: true,
    });
  }

  const totalWithBonuses = maxBuildableArea + totalAdditionalFromTma + totalAdditionalFromUrbanRenewal;
  const additionalBuildableArea = Math.max(0, totalWithBonuses - currentBuiltArea);

  return {
    maxBuildableArea,
    currentBuiltArea,
    additionalBuildableArea,
    mainAreaTotal,
    serviceAreaTotal,
    basementArea,
    rooftopArea,
    floorBreakdown,
    landCoverageArea,
    greenArea,
    parkingSpaces,
    netBuildableArea,
  };
}

function calculateFinancials(
  additionalArea: number,
  pricePerSqm: number,
  constructionCostPerSqm: number,
  valueIncreaseArea: number
): FinancialEstimate {
  const additionalValueEstimate = additionalArea * pricePerSqm;

  // ========== Detailed Cost Breakdown ==========
  // 1. Direct construction cost
  const constructionCost = additionalArea * constructionCostPerSqm;

  // 2. Planning & supervision (architect, structural engineer, supervisor) ~12%
  const planningAndSupervision = Math.round(constructionCost * 0.12);

  // 3. Betterment levy (היטל השבחה) - 50% of value increase (Israeli law)
  const bettermentLevy = Math.round(valueIncreaseArea * pricePerSqm * 0.5 * 0.5);

  // 4. Building permit fees (~150 ₪/sqm in Raanana)
  const buildingPermitFees = Math.round(additionalArea * 150);

  // 5. Development levies: water + sewage + roads (~350 ₪/sqm in Raanana)
  const developmentLevies = Math.round(additionalArea * 350);

  // 6. VAT 17% on construction
  const vat = Math.round(constructionCost * 0.17);

  // 7. Legal, misc (~3% of construction)
  const legalAndMisc = Math.round(constructionCost * 0.03);

  const totalCost = constructionCost + planningAndSupervision + bettermentLevy +
    buildingPermitFees + developmentLevies + vat + legalAndMisc;

  const costBreakdown: CostBreakdown = {
    constructionCost,
    planningAndSupervision,
    bettermentLevy,
    buildingPermitFees,
    developmentLevies,
    vat,
    legalAndMisc,
    totalCost,
  };

  const estimatedProfit = additionalValueEstimate - totalCost;

  return {
    pricePerSqm,
    additionalValueEstimate,
    constructionCostPerSqm,
    estimatedConstructionCost: totalCost,
    estimatedProfit,
    neighborhoodAvgPrice: pricePerSqm,
    costBreakdown,
  };
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('he-IL', {
    maximumFractionDigits: 0,
  }).format(amount);
}
