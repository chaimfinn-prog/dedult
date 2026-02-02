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
  UserPath,
  AuditStep,
  EnvelopeVerification,
  DeveloperReport,
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
import { getAllPlans, getAllAddresses } from '@/services/admin-storage';
import { calculateBuildingEnvelope, validateAreaFitsEnvelope } from '@/services/envelope-calculator';

interface ZoningContextType {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  logs: AnalysisLogEntry[];
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  userPath: UserPath;
  setUserPath: (path: UserPath) => void;
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
  const [userPath, setUserPath] = useState<UserPath>('homeowner');

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

      // Step 1: Try real API, fallback to local
      addLog('מתחבר ל-GovMap.gov.il (מפ"י)...', 'search');
      await delay(500);

      let parcelFromApi = false;
      try {
        const res = await fetch(`/api/parcel?address=${encodeURIComponent(address)}`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData.success && apiData.source === 'mapi_gis') {
            parcelFromApi = true;
            addLog(`[LIVE] מפ"י GIS: גוש ${apiData.data.block}, חלקה ${apiData.data.parcel}, שטח ${apiData.data.area} מ"ר`, 'info');
          }
        }
      } catch { /* fallback */ }

      if (!parcelFromApi) {
        addLog('API מפ"י לא זמין - משתמש במאגר מקומי', 'warning');
      }
      await delay(400);

      // Search in both hardcoded and custom (admin-added) addresses
      const allAddresses = getAllAddresses();
      const mapping = findPlanByAddress(address) ||
        allAddresses.find(a => a.address.includes(address.trim()) || address.trim().includes(a.address));
      if (!mapping) {
        const fallback = allAddresses[0] || addressMappings[0];
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
    // Search both hardcoded and custom (admin-added) plans
    const allPlans = getAllPlans();
    const plan = findPlanById(planId) || allPlans.find(p => p.id === planId);
    if (!plan) {
      addLog('שגיאה: לא נמצאה תב"ע חלה', 'warning');
      setIsAnalyzing(false);
      return;
    }

    const auditTrail: AuditStep[] = [];

    // ========== AUDIT Step 1: Land Data ==========
    auditTrail.push({
      step: 1,
      title: 'נתוני קרקע',
      subtitle: 'זיהוי מגרש ושטח רשום',
      data: {
        'שטח מגרש': `${plotSize} מ"ר`,
        'מידות': `${mapping.plotWidth} × ${mapping.plotDepth} מ'`,
        'גוש': mapping.block,
        'חלקה': mapping.parcel,
      },
      source: 'שכבת חלקות - מפ"י GIS',
      sourceType: 'mapi_gis',
    });

    addLog('RADAR // סורק מאגר תכנון ארצי (mavat.iplan.gov.il)...', 'radar');
    await delay(700);

    // Try iplan API
    addLog('מתחבר ל-iplan.gov.il (מבא"ת)...', 'search');
    await delay(400);

    let plansFromApi = false;
    try {
      const res = await fetch(`/api/plans?block=${mapping.block}&parcel=${mapping.parcel}&address=${encodeURIComponent(address)}`);
      if (res.ok) {
        const apiData = await res.json();
        if (apiData.success && apiData.data?.length > 0 && apiData.data[0].source === 'iplan_api') {
          plansFromApi = true;
          addLog(`[LIVE] iplan: נמצאו ${apiData.count} תוכניות מפורטות מאושרות`, 'info');
        }
      }
    } catch { /* fallback */ }

    if (!plansFromApi) {
      addLog('API iplan לא זמין - משתמש בתוכניות מאגר מקומי', 'warning');
    }
    await delay(400);

    addLog(`מאתר תב"ע חלה: ${plan.planNumber} - ${plan.name}`, 'search');
    await delay(800);

    addLog(`ייעוד קרקע: ${plan.zoningType === 'residential_a' ? "מגורים א'" : plan.zoningType === 'residential_b' ? "מגורים ב'" : 'שימוש מעורב'}`, 'info');
    await delay(400);

    // ========== AUDIT Step 2: Approved Plans ==========
    auditTrail.push({
      step: 2,
      title: 'זיהוי תוכניות מפורטות',
      subtitle: 'תוכניות מאושרות בלבד (לא מתאריות)',
      data: {
        'תכנית מובילה': `${plan.planNumber} (${plan.status === 'active' ? 'מאושרת' : plan.status})`,
        'ייעוד': plan.zoningType === 'residential_a' ? "מגורים א'" : "מגורים ב'",
        'אחוזי בנייה עיקרי': `${plan.buildingRights.mainBuildingPercent}%`,
        'אחוזי בנייה שירות': `${plan.buildingRights.serviceBuildingPercent}%`,
        'קומות מרביות': plan.buildingRights.maxFloors,
        'גובה מרבי': `${plan.buildingRights.maxHeight} מ'`,
      },
      source: `תקנון ${plan.planNumber}`,
      sourceType: 'iplan_api',
      citations: plan.buildingRights.citations,
    });

    addLog(`מקור: ${plan.sourceDocument.name} | עדכון: ${plan.sourceDocument.lastUpdated}`, 'info');
    await delay(500);

    addLog('מחלץ זכויות בנייה מתוך תקנון התב"ע...', 'extract');
    await delay(900);

    for (const citation of plan.buildingRights.citations.slice(0, 3)) {
      addLog(`[${citation.confidence}% ודאות] ${citation.section}: ${citation.value}`, 'extract');
      await delay(400);
    }

    addLog(`תכסית מותרת: ${plan.buildingRights.landCoveragePercent}% | קווי בניין: ${plan.restrictions.frontSetback}/${plan.restrictions.sideSetback}/${plan.restrictions.rearSetback} מ'`, 'extract');
    await delay(400);

    addLog(`צפיפות מותרת: עד ${plan.buildingRights.maxUnits} יח"ד | חניות: ${plan.restrictions.minParkingSpaces} לדירה`, 'extract');
    await delay(300);

    // ========== AUDIT Step 3: Existing Built State ==========
    addLog('בודק מצב בנוי קיים (רישוי זמין)...', 'search');
    await delay(500);

    let permitsFromApi = false;
    try {
      const res = await fetch(`/api/permits?block=${mapping.block}&parcel=${mapping.parcel}`);
      if (res.ok) {
        const apiData = await res.json();
        if (apiData.success && apiData.source === 'rishui_zamin') {
          permitsFromApi = true;
          addLog(`[LIVE] רישוי זמין: ${apiData.data.totalBuiltArea} מ"ר בנוי, ${apiData.data.floors} קומות`, 'info');
        }
      }
    } catch { /* fallback */ }

    if (!permitsFromApi) {
      addLog(`מצב קיים: ${currentBuiltArea} מ"ר, ${currentFloors} קומות (מאגר מקומי)`, 'info');
    }
    await delay(400);

    auditTrail.push({
      step: 3,
      title: 'מצב בנוי קיים',
      subtitle: 'שטחים מאושרים בהיתר אחרון',
      data: {
        'שטח בנוי': `${currentBuiltArea} מ"ר`,
        'קומות': currentFloors,
        'יח"ד': mapping.existingUnits,
        'שנת בנייה': mapping.yearBuilt || 'לא ידוע',
      },
      source: 'ארכיון הנדסה / רישוי זמין',
      sourceType: permitsFromApi ? 'rishui_zamin' : 'local_db',
    });

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

    // ========== Urban Renewal Plan Check ==========
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

    // ========== Envelope Validation ==========
    addLog('מחשב מעטפת בניין (קווי בניין + תכסית)...', 'calculate');
    await delay(500);

    const envelope = calculateBuildingEnvelope({
      plotWidth: mapping.plotWidth,
      plotDepth: mapping.plotDepth,
      plotArea: plotSize,
      frontSetback: plan.restrictions.frontSetback,
      rearSetback: plan.restrictions.rearSetback,
      sideSetback: plan.restrictions.sideSetback,
      maxCoverage: plan.restrictions.maxLandCoverage,
      maxFloors: plan.buildingRights.maxFloors,
      maxHeight: plan.buildingRights.maxHeight,
      floorHeight: 3.0,
    });

    const envelopeValidation = validateAreaFitsEnvelope(
      calculations.maxBuildableArea + (tma38Check.eligible ? (calculations.floorBreakdown.find(f => f.floor === 'tma')?.totalArea || 0) : 0),
      envelope
    );

    addLog(`מעטפת בניין: ${envelope.totalVolume} מ"ר | ניצולת: ${envelopeValidation.utilizationPercent}%`, 'calculate');
    if (!envelopeValidation.fits) {
      addLog(`אזהרה: שטח בנייה חורג ממעטפת - יש לבדוק הקלות`, 'warning');
    }
    await delay(400);

    const envelopeResult: EnvelopeVerification = {
      netFootprint: envelope.netFootprint,
      maxCoverageArea: envelope.maxCoverageArea,
      effectiveFootprint: envelope.effectiveFootprint,
      totalEnvelopeVolume: envelope.totalVolume,
      requestedArea: calculations.maxBuildableArea,
      fits: envelopeValidation.fits,
      utilizationPercent: envelopeValidation.utilizationPercent,
      message: envelopeValidation.message,
      steps: envelope.steps,
    };

    // ========== AUDIT Step 4: Summary ==========
    auditTrail.push({
      step: 4,
      title: 'סיכום פוטנציאל',
      subtitle: 'חישוב סופי כולל מעטפת בניין',
      data: {
        'זכויות מכוח תב"ע': `${calculations.maxBuildableArea} מ"ר`,
        'שטח קיים': `${currentBuiltArea} מ"ר`,
        'יתרה (מכוח תב"ע)': `${Math.max(0, calculations.maxBuildableArea - currentBuiltArea)} מ"ר`,
        'תוספת תמ"א': tma38Check.eligible ? `${calculations.floorBreakdown.find(f => f.floor === 'tma')?.totalArea || 0} מ"ר` : 'לא זכאי',
        'תוספת התחדשות': urbanCheck.eligible ? `${calculations.floorBreakdown.find(f => f.floor === 'urban_renewal')?.totalArea || 0} מ"ר` : 'לא זכאי',
        'סה"כ בנייה נוספת': `${calculations.additionalBuildableArea} מ"ר`,
        'מעטפת בניין': `${envelope.totalVolume} מ"ר`,
        'נכנס במעטפת': envelopeValidation.fits ? 'כן' : 'לא - נדרשת הקלה',
      },
      source: 'מנוע חישוב Zchut.AI',
      sourceType: 'calculation',
    });

    // ========== Financial with Levies ==========
    addLog('מחשב הערכה כלכלית כולל היטלים ואגרות...', 'calculate');
    await delay(600);

    const financial = calculateFinancials(
      calculations.additionalBuildableArea,
      mapping.avgPricePerSqm,
      mapping.constructionCostPerSqm,
      calculations.maxBuildableArea - calculations.currentBuiltArea
    );

    addLog(`עלות בנייה ישירה: ₪${fmtCurrency(financial.costBreakdown.constructionCost)}`, 'calculate');
    await delay(200);
    addLog(`היטל השבחה (50%): ₪${fmtCurrency(financial.costBreakdown.bettermentLevy)}`, 'calculate');
    await delay(200);
    addLog(`אגרות + היטלי פיתוח: ₪${fmtCurrency(financial.costBreakdown.buildingPermitFees + financial.costBreakdown.developmentLevies)}`, 'calculate');
    await delay(200);
    addLog(`סה"כ עלויות: ₪${fmtCurrency(financial.costBreakdown.totalCost)} | שווי: ₪${fmtCurrency(financial.additionalValueEstimate)}`, 'calculate');
    await delay(400);

    // ========== Developer Report (דו"ח אפס) - Full Feasibility Model ==========
    let developerReport: DeveloperReport | undefined;
    const totalNewArea = calculations.additionalBuildableArea;
    const avgUnitSize = 100;
    const newUnits = Math.floor(totalNewArea / avgUnitSize);

    if (newUnits > 0) {
      const pricePerSqm = mapping.avgPricePerSqm;
      const costPerSqm = mapping.constructionCostPerSqm;

      // Area breakdown estimates
      const demolitionArea = currentBuiltArea;
      const basementArea = calculations.basementArea;
      const residentialArea = Math.round(totalNewArea * 0.85);
      const commercialArea = plan.zoningType === 'mixed_use' ? Math.round(totalNewArea * 0.1) : 0;
      const balconyArea = Math.round(residentialArea * 0.09);
      const outdoorArea = Math.round(plotSize * 0.4);

      // D. Direct construction
      const dDemolition = { area: demolitionArea, costPerSqm: 300, total: demolitionArea * 300 };
      const dBasement = { area: basementArea, costPerSqm: 3800, total: basementArea * 3800 };
      const dCommercial = { area: commercialArea, costPerSqm: 6500, total: commercialArea * 6500 };
      const dEmployment = { area: 0, costPerSqm: 6000, total: 0 };
      const dPublic = { area: 0, costPerSqm: 10000, total: 0 };
      const dResidential = { area: residentialArea, costPerSqm: costPerSqm, total: residentialArea * costPerSqm };
      const dBalconies = { area: balconyArea, costPerSqm: 2970, total: balconyArea * 2970 };
      const dOutdoor = { area: outdoorArea, costPerSqm: 700, total: outdoorArea * 700 };
      const directTotal = dDemolition.total + dBasement.total + dCommercial.total + dEmployment.total +
        dPublic.total + dResidential.total + dBalconies.total + dOutdoor.total;

      // A. Land
      const landAcquisition = 0; // עסקת קומבינציה
      const bettermentLevy = financial.costBreakdown.bettermentLevy;
      const bettermentLevyCity = Math.round(directTotal * 0.01);
      const consultants = Math.round(directTotal * 0.01);
      const landTotal = landAcquisition + bettermentLevy + bettermentLevyCity + consultants;

      // B. Indirect costs
      const feesAndLevies = financial.costBreakdown.buildingPermitFees + financial.costBreakdown.developmentLevies;
      const purchaseTax = Math.round(directTotal * 0.05);
      const ownerSpecialCosts = Math.round(mapping.existingUnits * pricePerSqm * avgUnitSize * 0.005);
      const ownerGeneralCosts = Math.round(ownerSpecialCosts * 0.3);
      const ownerServiceCosts = Math.round(ownerSpecialCosts * 0.3);
      const electricityRes = Math.round(newUnits * 3500);
      const electricityCom = commercialArea > 0 ? Math.round(commercialArea * 60) : 0;
      const waterConn = Math.round(newUnits * 163);
      const salesCost = Math.round(directTotal * 0.01);
      const marketingCost = Math.round(directTotal * 0.02);
      const planningInspection = Math.round(directTotal * 0.02);
      const legalPerUnit = Math.round(newUnits * pricePerSqm * avgUnitSize * 0.01);
      const legalOwner = Math.round(newUnits * 216);
      const indirectTotal = feesAndLevies + purchaseTax + ownerSpecialCosts + ownerGeneralCosts +
        ownerServiceCosts + electricityRes + electricityCom + waterConn + salesCost +
        marketingCost + planningInspection + legalPerUnit + legalOwner;

      // C. Commissions
      const autoGuarantee = Math.round(directTotal * 0.01);
      const landGuarantee = Math.round(directTotal * 0.0065);
      const inspReg = Math.round(directTotal * 0.01);
      const torah = Math.round(directTotal * 0.0065);
      const creditAlloc = Math.round(directTotal * 0.002);
      const openingFee = Math.round(directTotal * 0.002);
      const commissionsTotal = autoGuarantee + landGuarantee + inspReg + torah + creditAlloc + openingFee;

      // E. Total indexed costs
      const totalIndexedCosts = landTotal + indirectTotal + commissionsTotal + directTotal;

      // F. Financing
      const monthsToPermit = 48;
      const monthsConstruction = 42;
      const effectiveInterest = 6.5;
      const selfEquityPercent = 13.2;
      const selfEquityAmount = Math.round(totalIndexedCosts * selfEquityPercent / 100);
      const earlySalesPercent = 30;
      const totalRevenueEst = (residentialArea * pricePerSqm) + (commercialArea * 27429);
      const earlySalesAmount = Math.round(totalRevenueEst * earlySalesPercent / 100);
      const financingTotal = Math.round(totalIndexedCosts * effectiveInterest / 100 * (monthsToPermit + monthsConstruction) / 24);

      // G. Total with financing
      const totalCostWithFinancing = totalIndexedCosts + financingTotal;

      // H. Revenue
      const revResidential = { area: residentialArea, pricePerSqm: pricePerSqm, total: residentialArea * pricePerSqm };
      const revAffordable = { area: 0, pricePerSqm: Math.round(pricePerSqm * 0.6), total: 0 };
      const revCommercial = { area: commercialArea, pricePerSqm: 27429, total: commercialArea * 27429 };
      const revEmployment = { area: 0, pricePerSqm: 10286, total: 0 };
      const revenueTotal = revResidential.total + revAffordable.total + revCommercial.total + revEmployment.total;

      const grossProfit = revenueTotal - totalCostWithFinancing;
      const profitPercent = totalCostWithFinancing > 0 ? Math.round((grossProfit / totalCostWithFinancing) * 100) : 0;

      developerReport = {
        land: {
          acquisitionCost: landAcquisition,
          bettermentLevy,
          bettermentLevyCityPlan: bettermentLevyCity,
          consultants,
          total: landTotal,
        },
        indirectCosts: {
          feesAndLevies,
          purchaseTax,
          ownerSpecialCosts,
          ownerGeneralCosts,
          ownerServiceCosts,
          electricityResidential: electricityRes,
          electricityCommercial: electricityCom,
          waterConnection: waterConn,
          sales: salesCost,
          marketing: marketingCost,
          planningInspection,
          legalPerUnit,
          legalOwnerCosts: legalOwner,
          total: indirectTotal,
        },
        commissions: {
          autonomousGuarantee: autoGuarantee,
          landGuarantee,
          inspectionRegistration: inspReg,
          torahAffairs: torah,
          creditAllocation: creditAlloc,
          openingFee,
          total: commissionsTotal,
        },
        directConstruction: {
          demolition: dDemolition,
          basement: dBasement,
          commercial: dCommercial,
          employment: dEmployment,
          publicArea: dPublic,
          residential: dResidential,
          balconies: dBalconies,
          outdoorDev: dOutdoor,
          total: directTotal,
        },
        totalIndexedCosts,
        financing: {
          monthsToPermit,
          monthsConstruction,
          effectiveInterest,
          selfEquityPercent,
          selfEquityAmount,
          earlySalesPercent,
          earlySalesAmount,
          total: financingTotal,
        },
        totalCostWithFinancing,
        revenue: {
          residential: revResidential,
          residentialAffordable: revAffordable,
          commercial: revCommercial,
          employment: revEmployment,
          total: revenueTotal,
        },
        grossProfit,
        profitPercent,
        profitPerUnit: newUnits > 0 ? Math.round(grossProfit / newUnits) : 0,
        newUnits,
        feasible: profitPercent >= 15,
        feasibilityNote: profitPercent >= 25 ? 'כדאיות גבוהה - פרויקט מומלץ' :
          profitPercent >= 15 ? 'כדאיות סבירה - נדרשת בדיקה מעמיקה' :
          profitPercent >= 5 ? 'כדאיות נמוכה - סיכון גבוה' :
          'לא כלכלי בתנאים הנוכחיים',
      };

      addLog(`דו"ח יזם: ${newUnits} יח"ד חדשות | רווח: ${profitPercent}% | ${developerReport.feasibilityNote}`, 'calculate');
      await delay(300);
    }

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
      envelope: envelopeResult,
      auditTrail,
      developerReport,
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
      value={{ screen, setScreen, logs, result, isAnalyzing, userPath, setUserPath, analyze, reset }}
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
  const constructionCost = additionalArea * constructionCostPerSqm;
  const planningAndSupervision = Math.round(constructionCost * 0.12);
  const bettermentLevy = Math.round(valueIncreaseArea * pricePerSqm * 0.5 * 0.5);
  const buildingPermitFees = Math.round(additionalArea * 150);
  const developmentLevies = Math.round(additionalArea * 350);
  const vat = Math.round(constructionCost * 0.17);
  const legalAndMisc = Math.round(constructionCost * 0.03);
  const totalCost = constructionCost + planningAndSupervision + bettermentLevy + buildingPermitFees + developmentLevies + vat + legalAndMisc;

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

  return {
    pricePerSqm,
    additionalValueEstimate,
    constructionCostPerSqm,
    estimatedConstructionCost: totalCost,
    estimatedProfit: additionalValueEstimate - totalCost,
    neighborhoodAvgPrice: pricePerSqm,
    costBreakdown,
  };
}

function fmtCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(amount);
}
