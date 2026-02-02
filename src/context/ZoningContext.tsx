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
} from '@/types';
import {
  findPlanByAddress,
  findPlanById,
  addressMappings,
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

      addLog(`שכונה: ${mapping.neighborhood} | מידות: ${mapping.plotWidth}×${mapping.plotDepth} מ'`, 'info');
      await delay(500);

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

    if (plan.tmaRights?.eligible) {
      addLog(`בודק זכויות מכוח תוכניות מתאר ארציות (תמ"א 38/${plan.tmaRights.tmaType === '38/1' ? '1' : '2'})...`, 'search');
      await delay(700);
      addLog(`${plan.tmaRights.notes}`, 'info');
      await delay(400);
    }

    addLog('מבצע חישובי שטחים ונפחים (Massing Study)...', 'calculate');
    await delay(800);

    const calculations = calculateBuildingRights(plan, plotSize, currentBuiltArea);

    addLog(`שטח בנייה מותר (סה"כ): ${calculations.maxBuildableArea} מ"ר`, 'calculate');
    await delay(300);

    addLog(`שטח בנוי קיים: ${calculations.currentBuiltArea} מ"ר`, 'calculate');
    await delay(300);

    addLog(`פוטנציאל בנייה נוסף: ${calculations.additionalBuildableArea} מ"ר`, 'calculate');
    await delay(400);

    addLog('מחשב הערכה כלכלית לפי מחירי שכונה...', 'calculate');
    await delay(600);

    const financial = calculateFinancials(
      calculations.additionalBuildableArea,
      mapping.avgPricePerSqm,
      mapping.constructionCostPerSqm
    );

    addLog(`שווי תוספת: ${formatCurrency(financial.additionalValueEstimate)} | ROI: ${Math.round(((financial.estimatedProfit / financial.estimatedConstructionCost) * 100))}%`, 'calculate');
    await delay(400);

    addLog('ניתוח הושלם בהצלחה', 'complete');
    await delay(300);

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
  currentBuiltArea: number
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
  const additionalBuildableArea = Math.max(0, maxBuildableArea - currentBuiltArea);

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

  if (plan.tmaRights?.eligible) {
    const tmaAdditional = Math.round((plan.tmaRights.additionalBuildingPercent / 100) * plotSize);
    floorBreakdown.push({
      floor: 'tma',
      label: `תוספת תמ"א 38/${plan.tmaRights.tmaType === '38/1' ? '1' : '2'}`,
      mainArea: tmaAdditional,
      serviceArea: 0,
      totalArea: tmaAdditional,
      isAdditional: true,
    });
  }

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
  constructionCostPerSqm: number
): FinancialEstimate {
  const additionalValueEstimate = additionalArea * pricePerSqm;
  const estimatedConstructionCost = additionalArea * constructionCostPerSqm;
  const estimatedProfit = additionalValueEstimate - estimatedConstructionCost;

  return {
    pricePerSqm,
    additionalValueEstimate,
    constructionCostPerSqm,
    estimatedConstructionCost,
    estimatedProfit,
    neighborhoodAvgPrice: pricePerSqm,
  };
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `₪${(amount / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}
