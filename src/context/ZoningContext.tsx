'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  PropertySearch,
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

      // Step 1: Locate address
      addLog('מחפש כתובת במאגר הנתונים...', 'search');
      await delay(800);

      const mapping = findPlanByAddress(address);
      if (!mapping) {
        // Fall back to first address mapping for demo purposes
        const fallback = addressMappings[0];
        addLog(`כתובת "${address}" - משתמש בנתוני דמו (${fallback.neighborhood})`, 'warning');
        await delay(500);
        await runAnalysis(fallback.planId, address, fallback, plotSize, currentBuiltArea, currentFloors);
        return;
      }

      addLog(`נמצאה כתובת: ${mapping.address}`, 'info');
      await delay(600);

      addLog(`מתרגם לגוש ${mapping.block}, חלקה ${mapping.parcel}`, 'search');
      await delay(700);

      await runAnalysis(mapping.planId, address, mapping, plotSize, currentBuiltArea, currentFloors);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function runAnalysis(
    planId: string,
    address: string,
    mapping: { block: string; parcel: string; neighborhood: string; avgPricePerSqm: number; constructionCostPerSqm: number },
    plotSize: number,
    currentBuiltArea: number,
    currentFloors: number
  ) {
    const plan = findPlanById(planId);
    if (!plan) {
      addLog('שגיאה: לא נמצאה תב"ע מתאימה', 'warning');
      setIsAnalyzing(false);
      return;
    }

    addLog(`מאתר תב"ע ${plan.planNumber}...`, 'search');
    await delay(900);

    addLog(`סוג ייעוד: ${plan.zoningType === 'residential_a' ? "מגורים א'" : plan.zoningType === 'residential_b' ? "מגורים ב'" : 'שימוש מעורב'}`, 'info');
    await delay(500);

    addLog('מחלץ זכויות בנייה מתוך התקנון...', 'extract');
    await delay(1000);

    addLog(`אחוזי בנייה עיקריים: ${plan.buildingRights.mainBuildingPercent}%`, 'extract');
    await delay(400);

    addLog(`שטחי שירות: ${plan.buildingRights.serviceBuildingPercent}%`, 'extract');
    await delay(400);

    addLog(`סה"כ אחוזי בנייה: ${plan.buildingRights.totalBuildingPercent}%`, 'extract');
    await delay(400);

    addLog(`מקסימום קומות: ${plan.buildingRights.maxFloors}`, 'extract');
    await delay(300);

    addLog(`גובה מקסימלי: ${plan.buildingRights.maxHeight} מטר`, 'extract');
    await delay(300);

    if (plan.tmaRights?.eligible) {
      addLog('בודק תוספות מכוח תמ"א 38...', 'search');
      await delay(800);
      addLog(`${plan.tmaRights.notes}`, 'info');
      await delay(400);
      addLog(`תוספת אחוזי בנייה מתמ"א: ${plan.tmaRights.additionalBuildingPercent}%`, 'extract');
      await delay(400);
    }

    addLog('מבצע חישובי שטחים...', 'calculate');
    await delay(800);

    // Perform calculations
    const calculations = calculateBuildingRights(plan, plotSize, currentBuiltArea);

    addLog(`סה"כ שטח בנייה מותר: ${calculations.maxBuildableArea} מ"ר`, 'calculate');
    await delay(400);

    addLog(`פוטנציאל בנייה נוסף: ${calculations.additionalBuildableArea} מ"ר`, 'calculate');
    await delay(400);

    addLog('מחשב הערכה כלכלית...', 'calculate');
    await delay(700);

    const financial = calculateFinancials(
      calculations.additionalBuildableArea,
      mapping.avgPricePerSqm,
      mapping.constructionCostPerSqm
    );

    addLog(`שווי תוספת משוער: ${formatCurrency(financial.additionalValueEstimate)}`, 'calculate');
    await delay(400);

    addLog('הניתוח הושלם בהצלחה!', 'complete');
    await delay(300);

    const analysisResult: AnalysisResult = {
      property: {
        address,
        city: 'רעננה',
        block: mapping.block,
        parcel: mapping.parcel,
        plotSize,
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

    // Auto-transition to results after a short delay
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
  plan: ReturnType<typeof findPlanById>,
  plotSize: number,
  currentBuiltArea: number
): BuildingCalculations {
  if (!plan) {
    return emptyCalculations(currentBuiltArea);
  }

  const rights = plan.buildingRights;
  const restrictions = plan.restrictions;

  // Main calculations
  const mainAreaTotal = Math.round((rights.mainBuildingPercent / 100) * plotSize);
  const serviceAreaTotal = Math.round((rights.serviceBuildingPercent / 100) * plotSize);
  const maxBuildableArea = mainAreaTotal + serviceAreaTotal;
  const basementArea = Math.round((rights.basementPercent / 100) * plotSize);
  const rooftopArea = Math.round((rights.rooftopPercent / 100) * plotSize);
  const landCoverageArea = Math.round((restrictions.maxLandCoverage / 100) * plotSize);
  const greenArea = Math.round((restrictions.minGreenAreaPercent / 100) * plotSize);
  const parkingSpaces = Math.ceil(rights.maxUnits * restrictions.minParkingSpaces);

  const additionalBuildableArea = Math.max(0, maxBuildableArea - currentBuiltArea);

  // Floor breakdown
  const floorBreakdown: FloorBreakdownItem[] = rights.floorAllocations.map(
    (alloc) => {
      const mainArea = Math.round((alloc.mainAreaPercent / 100) * plotSize);
      const serviceArea = Math.round((alloc.serviceAreaPercent / 100) * plotSize);
      return {
        floor: alloc.floor,
        label: alloc.label,
        mainArea,
        serviceArea,
        totalArea: mainArea + serviceArea,
      };
    }
  );

  // Add TMA rights as additional row if eligible
  if (plan.tmaRights?.eligible) {
    const tmaAdditional = Math.round(
      (plan.tmaRights.additionalBuildingPercent / 100) * plotSize
    );
    floorBreakdown.push({
      floor: 'tma',
      label: 'תוספת תמ"א 38',
      mainArea: tmaAdditional,
      serviceArea: 0,
      totalArea: tmaAdditional,
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

function emptyCalculations(currentBuiltArea: number): BuildingCalculations {
  return {
    maxBuildableArea: 0,
    currentBuiltArea,
    additionalBuildableArea: 0,
    mainAreaTotal: 0,
    serviceAreaTotal: 0,
    basementArea: 0,
    rooftopArea: 0,
    floorBreakdown: [],
    landCoverageArea: 0,
    greenArea: 0,
    parkingSpaces: 0,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}
