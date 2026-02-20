'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Globe,
  ArrowRight,
  Calculator,
  DollarSign,
  TrendingUp,
  Hammer,
  Users,
  Landmark,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Info,
  Car,
  Home,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── Constants ────────────────────────────────────────────────

const VIDEO_SRC =
  'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80';

const PURPLE = '#a78bfa';

// ── Helpers ──────────────────────────────────────────────────

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('he-IL');
}

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toLocaleString('he-IL', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + ' מ׳';
  }
  return Math.round(n).toLocaleString('he-IL');
}

function fmtPct(n: number): string {
  return (n * 100).toLocaleString('he-IL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + '%';
}

// ── Rights data from sessionStorage ──────────────────────────

interface RightsData {
  plotArea: number;
  existingFloors: number;
  existingApts: number;
  existingPenthouses: number;
  typicalFloorArea: number;
  address: string;
  blockNumber: string;
  parcelNumber: string;
  totalRights: number;
  netBuildableArea: number;
  maxUnits: number;
  maxFloors: number;
  numFloors: number;
  smallUnits: number;
  mediumUnits: number;
  largeUnits: number;
  penthouseUnits: number;
  smallArea: number;
  mediumArea: number;
  largeArea: number;
  penthouseArea: number;
  parkingSpaces: number;
  undergroundLevels: number;
  parkingAreaTotal: number;
  existingBuildArea: number;
  newAddedArea: number;
  coverageArea: number;
  baseRights: number;
  rooftopBonus: number;
  sharedSpaces: number;
  publicUseSpaces: number;
  balconiesDeduction: number;
  storageDeduction: number;
}

// ── Default Assumptions ──────────────────────────────────────

interface Assumptions {
  // ── Direct Construction Costs ──
  costMainBuildSqm: number;       // עלות בנייה עיקרית למ"ר
  costServiceAreaSqm: number;     // עלות שטחי שירות למ"ר
  costBalconySqm: number;         // עלות מרפסות למ"ר
  costRoofBalconySqm: number;     // עלות מרפסות גג למ"ר
  costParkingSqm: number;         // עלות חניון תת-קרקעי למ"ר
  costLandscapingSqm: number;     // עלות פיתוח סביבתי למ"ר
  costDemolitionPerUnit: number;  // עלות הריסה ליח"ד קיימת

  // ── Soft Costs (% of direct construction) ──
  softCostsPct: number;           // עלויות רכות (% מבנייה ישירה)
  contingencyPct: number;         // בלת"מ — בצ"מ (%)

  // ── Sale Prices ──
  salePriceMainSqm: number;      // מחיר מכירה למ"ר עיקרי
  salePriceBalconySqm: number;    // מחיר מכירה מרפסת למ"ר (50% of main)
  salePriceParkingSpace: number;  // מחיר חניה
  salePriceStorageUnit: number;   // מחיר מחסן
  avgAptSizeSqm: number;         // שטח ממוצע דירה

  // ── Planning & Supervision ──
  planningPerUnit: number;        // תכנון כללי ליח"ד
  architectPerUnit: number;       // פיקוח אדריכל ליח"ד
  residentSupervision: number;    // פיקוח דיירים (סה"כ)
  residentLawyers: number;        // עו"ד דיירים (סה"כ)

  // ── Taxes & Levies ──
  bettermentLevyRate: number;     // היטל השבחה (%)
  vatRate: number;                // מע"מ (%)

  // ── Financing ──
  seniorDebtRate: number;         // ריבית ליווי בנקאי (שנתי)
  seniorDebtLtvPct: number;       // אחוז מימון בנקאי (LTV)
  salesLawGuaranteePct: number;   // ערבות חוק מכר (% מהכנסות)
  equityReturnRate: number;       // תשואה נדרשת על הון עצמי (שנתי)

  // ── Revenue Milestones (Hok HaMecer) ──
  presalePct: number;             // % מכירה מוקדמת (חתימה)

  // ── Resident Costs ──
  rentPerMonth: number;           // שכ"ד חודשי לדייר
  constructionMonths: number;     // חודשי בנייה
  movingCostPerUnit: number;      // הובלה ליח"ד (הלוך + חזור)

  // ── Marketing ──
  marketingPct: number;           // שיווק ומכירות (% מהכנסות)

  // ── Resident Return (Existing Tenants) ──
  existingBuiltAreaSqm: number;   // שטח בנוי קיים — סה"כ מ"ר
  existingApartmentCount: number;  // מספר דירות קיימות
  extraAreaPerTenant: number;      // תוספת שטח לכל דייר קיים (מ"ר)
}

const DEFAULT_ASSUMPTIONS: Assumptions = {
  // Direct construction
  costMainBuildSqm: 8000,
  costServiceAreaSqm: 8000,
  costBalconySqm: 3500,
  costRoofBalconySqm: 3500,
  costParkingSqm: 4000,
  costLandscapingSqm: 500,
  costDemolitionPerUnit: 300000,

  // Soft costs
  softCostsPct: 0.15,        // 15% of direct = consultants, fees, permits
  contingencyPct: 0.05,      // 5% unforeseen

  // Sale prices
  salePriceMainSqm: 38000,
  salePriceBalconySqm: 19000,
  salePriceParkingSpace: 150000,
  salePriceStorageUnit: 80000,
  avgAptSizeSqm: 84,

  // Planning
  planningPerUnit: 30000,
  architectPerUnit: 22000,
  residentSupervision: 500000,
  residentLawyers: 640000,

  // Taxes
  bettermentLevyRate: 0.50,   // 50% of value increase (standard)
  vatRate: 0.18,

  // Financing
  seniorDebtRate: 0.065,      // 6.5% annual interest on construction loan
  seniorDebtLtvPct: 0.70,     // Bank finances 70% of direct costs
  salesLawGuaranteePct: 0.015,
  equityReturnRate: 0.12,     // Required equity return 12%

  // Hok HaMecer milestones
  presalePct: 0.20,           // 20% at signing

  // Resident costs
  rentPerMonth: 8000,
  constructionMonths: 32,
  movingCostPerUnit: 6000,

  // Marketing
  marketingPct: 0.025,

  // Resident return (existing tenants)
  existingBuiltAreaSqm: 0,
  existingApartmentCount: 0,
  extraAreaPerTenant: 25,
};

// ── Component ────────────────────────────────────────────────

export default function EconomicFeasibilityPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);

  // ── Rights data from calculator ──
  const [rights, setRights] = useState<RightsData | null>(null);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    construction: true,
    sale: true,
    tenantReturn: false,
    planning: false,
    taxes: false,
    bank: false,
    resident: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('rightsCalcData');
      if (stored) {
        const parsed: RightsData = JSON.parse(stored);
        setRights(parsed);
        // Pre-populate existing tenant fields from rights data
        const existingCount = parsed.existingApts || (parsed.existingFloors * 7) || 0;
        const existingArea = parsed.existingBuildArea || 0;
        if (existingCount > 0 || existingArea > 0) {
          setAssumptions(prev => ({
            ...prev,
            existingBuiltAreaSqm: existingArea,
            existingApartmentCount: existingCount,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Assumption updater ──
  const updateAssumption = (key: keyof Assumptions, value: string) => {
    const num = parseFloat(value.replace(/,/g, '')) || 0;
    setAssumptions(prev => ({ ...prev, [key]: num }));
  };

  const toggleSection = (key: string) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Financial Model Calculation (Professional "Doch Efes") ──
  const model = useMemo(() => {
    if (!rights) return null;

    const a = assumptions;
    const totalUnits = rights.maxUnits;
    const existingUnits = rights.existingApts || (rights.existingFloors * 7);
    const newUnits = Math.max(totalUnits - existingUnits, 0);
    const constructionYears = a.constructionMonths / 12;

    // ═══════════════════════════════════════════════════════════
    // 0. EXISTING TENANTS RETURN (החזרת שטח לדיירים קיימים)
    // ═══════════════════════════════════════════════════════════
    // Total area returned: existing built area + extra per tenant
    // This area is built at construction cost but generates ZERO revenue.
    const existingTenantReturnArea = a.existingBuiltAreaSqm + (a.existingApartmentCount * a.extraAreaPerTenant);
    const costExistingTenantBuild = existingTenantReturnArea * a.costMainBuildSqm;

    // ═══════════════════════════════════════════════════════════
    // 1. REVENUE (הכנסות)
    // ═══════════════════════════════════════════════════════════

    const avgAptArea = a.avgAptSizeSqm;
    const balconyAreaPerApt = 14; // per TABA Ra/Ra/B
    // Subtract tenant return area from saleable inventory — those sqm generate no revenue
    const grossSaleableMainArea = newUnits * avgAptArea;
    const totalSaleableMainArea = Math.max(grossSaleableMainArea - existingTenantReturnArea, 0);
    const totalSaleableBalconyArea = newUnits * balconyAreaPerApt;

    const revenueMainArea = totalSaleableMainArea * a.salePriceMainSqm;
    const revenueBalconies = totalSaleableBalconyArea * a.salePriceBalconySqm;
    const revenueParking = newUnits * a.salePriceParkingSpace;
    const revenueStorage = newUnits * a.salePriceStorageUnit;

    const totalRevenue = revenueMainArea + revenueBalconies + revenueParking + revenueStorage;

    // Hok HaMecer cash flow milestones (for financing calc)
    // 20% at presale signing, rest distributed over construction
    const presaleRevenue = totalRevenue * a.presalePct;
    const constructionRevenue = totalRevenue - presaleRevenue;
    // Weighted average: presale comes at month 0, rest is spread (avg midpoint)
    const avgRevenueCollectionMonth = (a.constructionMonths * 0.55); // Weighted midpoint

    // ═══════════════════════════════════════════════════════════
    // 2. DIRECT CONSTRUCTION COSTS (עלויות בנייה ישירות)
    // ═══════════════════════════════════════════════════════════

    const mainBuildArea = rights.netBuildableArea;
    const costMainBuild = mainBuildArea * a.costMainBuildSqm;

    const serviceArea = rights.sharedSpaces + (rights.publicUseSpaces || 0);
    const costServiceArea = serviceArea * a.costServiceAreaSqm;

    const totalBalconyArea = rights.balconiesDeduction;
    const costBalconies = totalBalconyArea * a.costBalconySqm;

    const rooftopBalconyArea = rights.rooftopBonus;
    const costRoofBalconies = rooftopBalconyArea * a.costRoofBalconySqm;

    const costParking = rights.parkingAreaTotal * a.costParkingSqm;
    const costLandscaping = rights.plotArea * a.costLandscapingSqm;
    const costDemolition = existingUnits * a.costDemolitionPerUnit;

    const totalDirectCost =
      costMainBuild + costServiceArea + costBalconies + costRoofBalconies +
      costParking + costLandscaping + costDemolition + costExistingTenantBuild;

    // ═══════════════════════════════════════════════════════════
    // 3. SOFT COSTS (עלויות רכות — ~15% of direct)
    // ═══════════════════════════════════════════════════════════
    // Includes: consultants, permits, engineering, legal, insurance, design
    const softCosts = totalDirectCost * a.softCostsPct;

    // ═══════════════════════════════════════════════════════════
    // 4. CONTINGENCY / בלת"מ — בצ"מ (~5%)
    // ═══════════════════════════════════════════════════════════
    const contingency = totalDirectCost * a.contingencyPct;

    // Total construction = direct + soft + contingency
    const totalConstructionCost = totalDirectCost + softCosts + contingency;

    // ═══════════════════════════════════════════════════════════
    // 5. PLANNING & SUPERVISION (תכנון ופיקוח)
    // ═══════════════════════════════════════════════════════════

    const costPlanning = totalUnits * a.planningPerUnit;
    const costArchitect = totalUnits * a.architectPerUnit;
    const costResidentSupervision = a.residentSupervision;
    const costResidentLawyers = a.residentLawyers;

    const totalPlanningCost =
      costPlanning + costArchitect + costResidentSupervision + costResidentLawyers;

    // ═══════════════════════════════════════════════════════════
    // 6. MARKETING & SALES (שיווק ומכירות)
    // ═══════════════════════════════════════════════════════════
    const costMarketing = totalRevenue * a.marketingPct;

    // ═══════════════════════════════════════════════════════════
    // 7. FINANCING COSTS (עלויות מימון)
    // ═══════════════════════════════════════════════════════════

    // Senior debt (ליווי בנקאי): bank finances LTV% of direct costs
    // S-curve: avg outstanding balance ~55% of peak over construction period
    const peakDebt = totalDirectCost * a.seniorDebtLtvPct;
    const avgOutstandingDebt = peakDebt * 0.55; // S-curve avg utilization
    const seniorDebtInterest = avgOutstandingDebt * a.seniorDebtRate * constructionYears;

    // Sales law guarantee (ערבות חוק מכר)
    const costSalesLawGuarantee = totalRevenue * a.salesLawGuaranteePct;

    // Equity cost: developer's equity = total costs - bank debt
    const developerEquity = totalConstructionCost - peakDebt;
    const equityCost = Math.max(developerEquity, 0) * a.equityReturnRate * constructionYears;

    const totalFinancingCost = seniorDebtInterest + costSalesLawGuarantee + equityCost;

    // ═══════════════════════════════════════════════════════════
    // 8. TAXES & LEVIES (מיסים והיטלים)
    // ═══════════════════════════════════════════════════════════

    // Betterment Levy (היטל השבחה):
    // Standard: 50% × NET value increase per added sqm
    // NET value increase = (sale price/sqm - construction cost/sqm) × added sqm
    // This approximates (new land value after plan - old land value before plan)
    const addedSqm = rights.newAddedArea > 0
      ? rights.newAddedArea
      : Math.max(rights.totalRights - rights.existingBuildArea, 0);
    const netValuePerSqm = Math.max(a.salePriceMainSqm - a.costMainBuildSqm, 0);
    const valueIncrease = addedSqm * netValuePerSqm;
    const costBettermentLevy = valueIncrease * a.bettermentLevyRate;

    // VAT: on developer's profit (not a pass-through for residential)
    // Simplified: VAT is embedded in sale prices; for the model we show the net effect
    // Developer pays VAT on inputs but collects on sales - net is on added value
    // Approximation: VAT on profit margin
    const estimatedVatOnProfit = 0; // VAT is typically pass-through, excluded from P&L

    const totalTaxesCost = costBettermentLevy + estimatedVatOnProfit;

    // ═══════════════════════════════════════════════════════════
    // 9. RESIDENT COSTS (עלויות דיירים)
    // ═══════════════════════════════════════════════════════════

    const rentTotal = existingUnits * a.rentPerMonth * a.constructionMonths;
    const movingTotal = existingUnits * a.movingCostPerUnit * 2; // out + in

    const totalResidentCost = rentTotal + movingTotal;

    // ═══════════════════════════════════════════════════════════
    // 10. TOTALS & PROFITABILITY
    // ═══════════════════════════════════════════════════════════

    const totalExpenses =
      totalConstructionCost + totalPlanningCost + costMarketing +
      totalFinancingCost + totalTaxesCost + totalResidentCost;

    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;
    const roi = totalExpenses > 0 ? grossProfit / totalExpenses : 0;
    const profitPerUnit = newUnits > 0 ? grossProfit / newUnits : 0;

    return {
      // Units
      newUnits, existingUnits, totalUnits,

      // Existing tenants return
      existingTenantReturnArea, costExistingTenantBuild, grossSaleableMainArea,

      // Revenue
      totalSaleableMainArea, totalSaleableBalconyArea,
      revenueMainArea, revenueBalconies, revenueParking, revenueStorage,
      totalRevenue, presaleRevenue, constructionRevenue,

      // Direct construction
      mainBuildArea, serviceArea, totalBalconyArea, rooftopBalconyArea,
      costMainBuild, costServiceArea, costBalconies, costRoofBalconies,
      costParking, costLandscaping, costDemolition,
      totalDirectCost,

      // Soft + contingency
      softCosts, contingency, totalConstructionCost,

      // Planning
      costPlanning, costArchitect, costResidentSupervision, costResidentLawyers,
      totalPlanningCost,

      // Marketing
      costMarketing,

      // Financing
      peakDebt, seniorDebtInterest, costSalesLawGuarantee, equityCost,
      totalFinancingCost,

      // Taxes
      addedSqm, netValuePerSqm, valueIncrease, costBettermentLevy,
      totalTaxesCost,

      // Resident
      rentTotal, movingTotal, totalResidentCost,

      // Totals
      totalExpenses, grossProfit, profitMargin, roi, profitPerUnit,
    };
  }, [rights, assumptions]);

  // ── Input style ──
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontFamily: "'Space Grotesk', monospace",
    color: '#1a1a2e',
    outline: 'none',
    textAlign: 'left' as const,
    direction: 'ltr' as const,
  };

  // ── Editable assumption row ──
  const AssumptionRow = ({
    label,
    labelEn,
    field,
    suffix,
    isPercent,
  }: {
    label: string;
    labelEn: string;
    field: keyof Assumptions;
    suffix?: string;
    isPercent?: boolean;
  }) => {
    const val = assumptions[field];
    const displayVal = isPercent ? (val * 100).toString() : val.toString();
    return (
      <div className="flex items-center gap-3 py-1.5">
        <div className="flex-1 text-xs" style={{ color: '#4a4a6a' }}>
          {t(label, labelEn)}
        </div>
        <div className="flex items-center gap-1.5" style={{ width: 130 }}>
          <input
            type="text"
            value={fmtNum(isPercent ? val * 100 : val)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d.]/g, '');
              const num = parseFloat(raw) || 0;
              updateAssumption(field, isPercent ? (num / 100).toString() : raw);
            }}
            style={{ ...inputStyle, width: '100%' }}
          />
          {suffix && (
            <span className="text-[10px] flex-shrink-0" style={{ color: '#9ca3af' }}>
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── Section toggle header ──
  const SectionToggle = ({
    id,
    icon: Icon,
    title,
    titleEn,
    total,
    color,
  }: {
    id: string;
    icon: React.ElementType;
    title: string;
    titleEn: string;
    total?: number;
    color?: string;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center gap-3 py-3 cursor-pointer bg-transparent border-0 text-right"
      style={{ direction: 'rtl' }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color || PURPLE}15`, border: `1px solid ${color || PURPLE}25` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: color || PURPLE }} />
      </div>
      <div className="flex-1 text-xs font-bold" style={{ color: '#1a1a2e' }}>
        {t(title, titleEn)}
      </div>
      {total !== undefined && (
        <span className="text-xs font-bold" style={{ color: color || PURPLE, fontFamily: "'Space Grotesk', monospace" }}>
          ₪{fmtMoney(total)}
        </span>
      )}
      {sectionsOpen[id] ? (
        <ChevronUp className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
      ) : (
        <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
      )}
    </button>
  );

  // ── Result row ──
  const ResultRow = ({
    label,
    labelEn,
    value,
    bold,
    color,
  }: {
    label: string;
    labelEn: string;
    value: string;
    bold?: boolean;
    color?: string;
  }) => (
    <div
      className={`flex items-center justify-between py-1 ${bold ? 'border-t border-dashed' : ''}`}
      style={{
        borderColor: 'rgba(0,0,0,0.1)',
      }}
    >
      <span
        className={`text-xs ${bold ? 'font-bold' : ''}`}
        style={{ color: color || '#4a4a6a' }}
      >
        {t(label, labelEn)}
      </span>
      <span
        className={`text-xs ${bold ? 'font-bold' : ''}`}
        style={{
          color: color || '#1a1a2e',
          fontFamily: "'Space Grotesk', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );

  // ── No data state ──
  if (!rights) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <div className="fixed inset-0 z-0 overflow-hidden">
          <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
          <div className="absolute inset-0 bg-overlay-dark" />
          <div className="absolute inset-0 bg-grid" />
        </div>

        {/* Header */}
        <div className="relative z-10 border-b border-[var(--border)] sticky top-0" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 no-underline text-inherit hover:opacity-80 transition-opacity">
                <Building2 className="w-4 h-4 text-green" />
                <span className="font-bold text-sm">PROPCHECK</span>
              </a>
              <span className="text-foreground-muted text-xs">{t('| כדאיות כלכלית', '| Economic Feasibility')}</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
                <Globe className="w-3.5 h-3.5" />
                {lang === 'he' ? 'EN' : 'עב'}
              </button>
              <a href="/developer-portal" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                {t('חזרה', 'Back')}
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-8">
          <div
            className="rounded-2xl p-8 text-center max-w-md"
            style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#f59e0b' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: '#1a1a2e' }}>
              {t('חסרים נתוני זכויות בנייה', 'Missing Building Rights Data')}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              {t(
                'כדי להפעיל את הניתוח הכלכלי, יש לחשב קודם זכויות בנייה במחשבון הזכויות.',
                'To run the economic analysis, first calculate building rights in the Rights Calculator.'
              )}
            </p>
            <a
              href="/developer-portal/rights-calculator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`, boxShadow: `0 4px 16px ${PURPLE}40`, textDecoration: 'none' }}
            >
              {t('מחשבון זכויות בנייה', 'Building Rights Calculator')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative" dir="rtl">

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 border-b border-[var(--border)] sticky top-0" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 no-underline text-inherit hover:opacity-80 transition-opacity">
              <Building2 className="w-4 h-4 text-green" />
              <span className="font-bold text-sm">PROPCHECK</span>
            </a>
            <span className="text-foreground-muted text-xs">{t('| כדאיות כלכלית — תמ"א 38/2', '| Economic Feasibility — TMA 38/2')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/developer-portal/rights-calculator" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה למחשבון', 'Back to Calculator')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">

        {/* ── Title ── */}
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: PURPLE }}>
            TMA 38/2 — {t('הריסה ובנייה', 'Demolition & Reconstruction')}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t('ניתוח כדאיות כלכלית', 'Economic Feasibility Analysis')}
          </h1>
          {rights.address && (
            <p className="text-sm text-foreground-muted">{rights.address}</p>
          )}
          {(rights.blockNumber || rights.parcelNumber) && (
            <p className="text-xs text-foreground-muted mt-1">
              {rights.blockNumber && `${t('גוש', 'Block')} ${rights.blockNumber}`}
              {rights.blockNumber && rights.parcelNumber && ' | '}
              {rights.parcelNumber && `${t('חלקה', 'Parcel')} ${rights.parcelNumber}`}
            </p>
          )}
        </div>

        {/* ── Project Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t('סה"כ יח"ד', 'Total Units'), value: fmtNum(rights.maxUnits), icon: Home },
            { label: t('יח"ד חדשות למכירה', 'New Units for Sale'), value: fmtNum(model?.newUnits || 0), icon: TrendingUp },
            { label: t('זכויות בנייה', 'Building Rights'), value: `${fmtNum(rights.totalRights)} מ"ר`, icon: Building2 },
            { label: t('חניות', 'Parking'), value: fmtNum(rights.parkingSpaces), icon: Car },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <card.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: PURPLE }} />
              <div className="text-[10px] mb-1" style={{ color: '#6b7280' }}>{card.label}</div>
              <div className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ── Main Grid: Assumptions (left) + Results (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Editable Assumptions ── */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              {/* Assumptions header */}
              <div className="px-6 pt-5 pb-3 flex items-center gap-2">
                <Edit3 className="w-4 h-4" style={{ color: PURPLE }} />
                <h2 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
                  {t('הנחות עבודה (ניתן לעריכה)', 'Assumptions (Editable)')}
                </h2>
              </div>
              <div className="px-6 pb-2">
                <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: `${PURPLE}08`, border: `1px solid ${PURPLE}12` }}>
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: PURPLE }} />
                  <p className="text-[10px] leading-relaxed" style={{ color: '#6b7280' }}>
                    {t(
                      'כל ההנחות ניתנות לעריכה. שנה ערך כלשהו והחישוב יתעדכן אוטומטית.',
                      'All assumptions are editable. Change any value and the calculation updates automatically.'
                    )}
                  </p>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>

                {/* ── Direct Construction Costs ── */}
                <div className="px-6">
                  <SectionToggle id="construction" icon={Hammer} title="עלויות בנייה ישירות" titleEn="Direct Construction Costs" total={model?.totalDirectCost} />
                  {sectionsOpen.construction && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label="בנייה עיקרית למ״ר" labelEn="Main build / sqm" field="costMainBuildSqm" suffix="₪" />
                      <AssumptionRow label="שטחי שירות למ״ר" labelEn="Service areas / sqm" field="costServiceAreaSqm" suffix="₪" />
                      <AssumptionRow label="מרפסות למ״ר" labelEn="Balconies / sqm" field="costBalconySqm" suffix="₪" />
                      <AssumptionRow label="מרפסות גג למ״ר" labelEn="Roof balconies / sqm" field="costRoofBalconySqm" suffix="₪" />
                      <AssumptionRow label="חניון תת-קרקעי למ״ר" labelEn="Underground parking / sqm" field="costParkingSqm" suffix="₪" />
                      <AssumptionRow label="פיתוח סביבתי למ״ר" labelEn="Landscaping / sqm" field="costLandscapingSqm" suffix="₪" />
                      <AssumptionRow label="הריסה ליח״ד קיימת" labelEn="Demolition / existing unit" field="costDemolitionPerUnit" suffix="₪" />
                      <div className="pt-2 mt-1" style={{ borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                        <AssumptionRow label="עלויות רכות (% מישיר)" labelEn="Soft costs (% of direct)" field="softCostsPct" suffix="%" isPercent />
                        <AssumptionRow label='בלת"מ / בצ"מ (%)' labelEn="Contingency (%)" field="contingencyPct" suffix="%" isPercent />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Existing Tenant Return ── */}
                <div className="px-6">
                  <SectionToggle id="tenantReturn" icon={Users} title="החזרת שטח לדיירים קיימים" titleEn="Existing Tenant Return" total={model?.costExistingTenantBuild} color="#f59e0b" />
                  {sectionsOpen.tenantReturn && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label='שטח בנוי קיים (מ"ר)' labelEn="Existing built area (sqm)" field="existingBuiltAreaSqm" suffix='מ"ר' />
                      <AssumptionRow label="מספר דירות קיימות" labelEn="Existing apartments" field="existingApartmentCount" suffix={t('יח"ד', 'units')} />
                      <AssumptionRow label='תוספת שטח לכל דייר (מ"ר)' labelEn="Extra area per tenant (sqm)" field="extraAreaPerTenant" suffix='מ"ר' />
                      {model && (
                        <div className="pt-2 mt-1" style={{ borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>
                              {t('סה"כ שטח החזרה לדיירים', 'Total tenant return area')}
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: '#f59e0b', fontFamily: "'Space Grotesk', monospace" }}>
                              {fmtNum(model.existingTenantReturnArea)} {t('מ"ר', 'sqm')}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg mt-1" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                            <p className="text-[10px] leading-relaxed" style={{ color: '#6b7280' }}>
                              {t(
                                'שטח זה נבנה בעלות מלאה אך אינו מייצר הכנסה — מופחת ממלאי הדירות למכירה.',
                                'This area is built at full cost but generates zero revenue — deducted from saleable inventory.'
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Sale Prices ── */}
                <div className="px-6">
                  <SectionToggle id="sale" icon={DollarSign} title="מחירי מכירה" titleEn="Sale Prices" total={model?.totalRevenue} color="#16a34a" />
                  {sectionsOpen.sale && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label="מ״ר עיקרי — מכירה" labelEn="Main area / sqm" field="salePriceMainSqm" suffix="₪" />
                      <AssumptionRow label="מ״ר מרפסת — מכירה" labelEn="Balcony area / sqm" field="salePriceBalconySqm" suffix="₪" />
                      <AssumptionRow label="חניה" labelEn="Parking space" field="salePriceParkingSpace" suffix="₪" />
                      <AssumptionRow label="מחסן" labelEn="Storage unit" field="salePriceStorageUnit" suffix="₪" />
                      <AssumptionRow label="שטח ממוצע דירה" labelEn="Avg apartment sqm" field="avgAptSizeSqm" suffix='מ"ר' />
                      <div className="pt-2 mt-1" style={{ borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                        <AssumptionRow label="מכירה מוקדמת (חוק המכר)" labelEn="Presale (Hok HaMecer)" field="presalePct" suffix="%" isPercent />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Planning & Supervision ── */}
                <div className="px-6">
                  <SectionToggle id="planning" icon={FileText} title="תכנון ופיקוח" titleEn="Planning & Supervision" total={model?.totalPlanningCost} />
                  {sectionsOpen.planning && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label="תכנון כללי ליח״ד" labelEn="General planning / unit" field="planningPerUnit" suffix="₪" />
                      <AssumptionRow label="פיקוח אדריכל ליח״ד" labelEn="Architect supervision / unit" field="architectPerUnit" suffix="₪" />
                      <AssumptionRow label="פיקוח דיירים (סה״כ)" labelEn="Resident supervision (total)" field="residentSupervision" suffix="₪" />
                      <AssumptionRow label='עו"ד דיירים (סה״כ)' labelEn="Resident lawyers (total)" field="residentLawyers" suffix="₪" />
                    </div>
                  )}
                </div>

                {/* ── Financing ── */}
                <div className="px-6">
                  <SectionToggle id="bank" icon={Landmark} title="מימון ובנק" titleEn="Financing & Bank" total={model?.totalFinancingCost} />
                  {sectionsOpen.bank && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label="ריבית ליווי בנקאי (שנתי)" labelEn="Senior debt rate (annual)" field="seniorDebtRate" suffix="%" isPercent />
                      <AssumptionRow label="אחוז מימון בנקאי (LTV)" labelEn="Bank LTV (%)" field="seniorDebtLtvPct" suffix="%" isPercent />
                      <AssumptionRow label="ערבות חוק מכר" labelEn="Sales law guarantee" field="salesLawGuaranteePct" suffix="%" isPercent />
                      <AssumptionRow label="תשואה נדרשת הון עצמי" labelEn="Required equity return" field="equityReturnRate" suffix="%" isPercent />
                    </div>
                  )}
                </div>

                {/* ── Taxes & Levies ── */}
                <div className="px-6">
                  <SectionToggle id="taxes" icon={Landmark} title="מיסים והיטלים" titleEn="Taxes & Levies" total={model?.totalTaxesCost} color="#dc2626" />
                  {sectionsOpen.taxes && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label="היטל השבחה (% מעליית ערך)" labelEn="Betterment levy (% of value increase)" field="bettermentLevyRate" suffix="%" isPercent />
                      <AssumptionRow label='מע"מ' labelEn="VAT" field="vatRate" suffix="%" isPercent />
                    </div>
                  )}
                </div>

                {/* ── Resident Costs ── */}
                <div className="px-6">
                  <SectionToggle id="resident" icon={Users} title="עלויות דיירים" titleEn="Resident Costs" total={model?.totalResidentCost} />
                  {sectionsOpen.resident && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label="שכ״ד חודשי לדייר" labelEn="Monthly rent / tenant" field="rentPerMonth" suffix="₪" />
                      <AssumptionRow label="חודשי בנייה" labelEn="Construction months" field="constructionMonths" suffix={t('חודשים', 'mo.')} />
                      <AssumptionRow label="הובלה ליח״ד (×2)" labelEn="Moving cost / unit (×2)" field="movingCostPerUnit" suffix="₪" />
                    </div>
                  )}
                </div>

                {/* ── Marketing ── */}
                <div className="px-6">
                  <SectionToggle id="marketing" icon={TrendingUp} title="שיווק ומכירות" titleEn="Marketing & Sales" total={model?.costMarketing} />
                  {sectionsOpen.marketing && (
                    <div className="pb-4 space-y-0.5">
                      <AssumptionRow label="שיווק (% מהכנסות)" labelEn="Marketing (% of revenue)" field="marketingPct" suffix="%" isPercent />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Financial Summary ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── P&L Summary ── */}
            {model && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
              >
                {/* Profit header */}
                <div
                  className="p-5 text-center"
                  style={{
                    background: model.grossProfit >= 0
                      ? 'linear-gradient(135deg, rgba(22,163,106,0.08), rgba(22,163,106,0.03))'
                      : 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.03))',
                  }}
                >
                  <div className="text-xs font-bold mb-1" style={{ color: '#6b7280' }}>
                    {t('רווח גולמי צפוי', 'Expected Gross Profit')}
                  </div>
                  <div
                    className="text-3xl font-black mb-1"
                    style={{
                      fontFamily: "'Space Grotesk', monospace",
                      color: model.grossProfit >= 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    ₪{fmtMoney(model.grossProfit)}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs flex-wrap" style={{ color: '#6b7280' }}>
                    <span>
                      {t('שיעור רווח', 'Margin')}: <strong style={{ color: model.profitMargin >= 0.15 ? '#16a34a' : model.profitMargin >= 0.10 ? '#f59e0b' : '#dc2626' }}>{fmtPct(model.profitMargin)}</strong>
                    </span>
                    <span>
                      ROI: <strong style={{ color: model.roi >= 0.20 ? '#16a34a' : model.roi >= 0.12 ? '#f59e0b' : '#dc2626' }}>{fmtPct(model.roi)}</strong>
                    </span>
                    <span>
                      {t('רווח ליח"ד', 'Profit/Unit')}: <strong>₪{fmtNum(model.profitPerUnit)}</strong>
                    </span>
                  </div>
                </div>

                {/* Viability indicator */}
                <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  {model.profitMargin >= 0.15 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
                      <span className="text-xs font-bold" style={{ color: '#16a34a' }}>
                        {t('פרויקט כדאי — רווחיות מעל 15%', 'Viable Project — Margin above 15%')}
                      </span>
                    </div>
                  ) : model.profitMargin >= 0.10 ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                      <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>
                        {t('רווחיות גבולית — יש לבחון בזהירות', 'Borderline — Review carefully')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                      <span className="text-xs font-bold" style={{ color: '#dc2626' }}>
                        {t('רווחיות נמוכה — לא מומלץ', 'Low margin — Not recommended')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Revenue Breakdown ── */}
            {model && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" style={{ color: '#16a34a' }} />
                  <h3 className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                    {t('פירוט הכנסות', 'Revenue Breakdown')}
                  </h3>
                </div>
                <div className="space-y-1">
                  <ResultRow label={`מכירת דירות (${fmtNum(model.totalSaleableMainArea)} מ"ר)`} labelEn={`Apartments (${fmtNum(model.totalSaleableMainArea)} sqm)`} value={`₪${fmtMoney(model.revenueMainArea)}`} />
                  <ResultRow label={`מרפסות (${fmtNum(model.totalSaleableBalconyArea)} מ"ר)`} labelEn={`Balconies (${fmtNum(model.totalSaleableBalconyArea)} sqm)`} value={`₪${fmtMoney(model.revenueBalconies)}`} />
                  <ResultRow label={`חניות (${fmtNum(model.newUnits)})`} labelEn={`Parking (${fmtNum(model.newUnits)})`} value={`₪${fmtMoney(model.revenueParking)}`} />
                  <ResultRow label={`מחסנים (${fmtNum(model.newUnits)})`} labelEn={`Storage (${fmtNum(model.newUnits)})`} value={`₪${fmtMoney(model.revenueStorage)}`} />
                  <ResultRow label='סה"כ הכנסות' labelEn="Total Revenue" value={`₪${fmtMoney(model.totalRevenue)}`} bold color="#16a34a" />
                </div>
              </div>
            )}

            {/* ── Expense Breakdown ── */}
            {model && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Hammer className="w-4 h-4" style={{ color: '#dc2626' }} />
                  <h3 className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                    {t('פירוט הוצאות', 'Expense Breakdown')}
                  </h3>
                </div>
                <div className="space-y-1">
                  <ResultRow label="בנייה ישירה" labelEn="Direct Construction" value={`₪${fmtMoney(model.totalDirectCost)}`} />
                  <ResultRow label="עלויות רכות (15%)" labelEn="Soft Costs (15%)" value={`₪${fmtMoney(model.softCosts)}`} />
                  <ResultRow label='בלת"מ (5%)' labelEn="Contingency (5%)" value={`₪${fmtMoney(model.contingency)}`} />
                  <ResultRow label="תכנון ופיקוח" labelEn="Planning & Supervision" value={`₪${fmtMoney(model.totalPlanningCost)}`} />
                  <ResultRow label="מימון ובנק" labelEn="Financing & Bank" value={`₪${fmtMoney(model.totalFinancingCost)}`} />
                  <ResultRow label="שיווק ומכירות" labelEn="Marketing" value={`₪${fmtMoney(model.costMarketing)}`} />
                  <ResultRow label="מיסים והיטלים" labelEn="Taxes & Levies" value={`₪${fmtMoney(model.totalTaxesCost)}`} />
                  <ResultRow label="עלויות דיירים" labelEn="Resident Costs" value={`₪${fmtMoney(model.totalResidentCost)}`} />
                  <ResultRow label='סה"כ הוצאות' labelEn="Total Expenses" value={`₪${fmtMoney(model.totalExpenses)}`} bold color="#dc2626" />
                </div>
              </div>
            )}

            {/* ── Construction Cost Detail ── */}
            {model && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Hammer className="w-4 h-4" style={{ color: PURPLE }} />
                  <h3 className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                    {t('פירוט עלויות בנייה', 'Construction Cost Detail')}
                  </h3>
                </div>
                <div className="space-y-1">
                  <ResultRow label={`בנייה עיקרית (${fmtNum(model.mainBuildArea)} מ"ר)`} labelEn={`Main build (${fmtNum(model.mainBuildArea)} sqm)`} value={`₪${fmtMoney(model.costMainBuild)}`} />
                  <ResultRow label={`שטחי שירות (${fmtNum(model.serviceArea)} מ"ר)`} labelEn={`Service areas (${fmtNum(model.serviceArea)} sqm)`} value={`₪${fmtMoney(model.costServiceArea)}`} />
                  <ResultRow label={`מרפסות (${fmtNum(model.totalBalconyArea)} מ"ר)`} labelEn={`Balconies (${fmtNum(model.totalBalconyArea)} sqm)`} value={`₪${fmtMoney(model.costBalconies)}`} />
                  <ResultRow label={`מרפסות גג (${fmtNum(model.rooftopBalconyArea)} מ"ר)`} labelEn={`Roof balconies (${fmtNum(model.rooftopBalconyArea)} sqm)`} value={`₪${fmtMoney(model.costRoofBalconies)}`} />
                  <ResultRow label={`חניון (${fmtNum(rights.parkingAreaTotal)} מ"ר)`} labelEn={`Parking (${fmtNum(rights.parkingAreaTotal)} sqm)`} value={`₪${fmtMoney(model.costParking)}`} />
                  <ResultRow label={`פיתוח סביבתי (${fmtNum(rights.plotArea)} מ"ר)`} labelEn={`Landscaping (${fmtNum(rights.plotArea)} sqm)`} value={`₪${fmtMoney(model.costLandscaping)}`} />
                  <ResultRow label={`הריסה (${fmtNum(model.existingUnits)} יח"ד)`} labelEn={`Demolition (${fmtNum(model.existingUnits)} units)`} value={`₪${fmtMoney(model.costDemolition)}`} />
                  {model.existingTenantReturnArea > 0 && (
                    <ResultRow label={`החזרת שטח לדיירים (${fmtNum(model.existingTenantReturnArea)} מ"ר)`} labelEn={`Tenant return (${fmtNum(model.existingTenantReturnArea)} sqm)`} value={`₪${fmtMoney(model.costExistingTenantBuild)}`} color="#f59e0b" />
                  )}
                  <ResultRow label='סה"כ ישיר' labelEn="Total Direct" value={`₪${fmtMoney(model.totalDirectCost)}`} bold />
                  <ResultRow label={`עלויות רכות (${Math.round(assumptions.softCostsPct * 100)}%)`} labelEn={`Soft costs (${Math.round(assumptions.softCostsPct * 100)}%)`} value={`₪${fmtMoney(model.softCosts)}`} />
                  <ResultRow label={`בלת"מ (${Math.round(assumptions.contingencyPct * 100)}%)`} labelEn={`Contingency (${Math.round(assumptions.contingencyPct * 100)}%)`} value={`₪${fmtMoney(model.contingency)}`} />
                  <ResultRow label='סה"כ בנייה כולל' labelEn="Total Construction (All-in)" value={`₪${fmtMoney(model.totalConstructionCost)}`} bold color={PURPLE} />
                </div>
              </div>
            )}

            {/* ── Financing Detail ── */}
            {model && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Landmark className="w-4 h-4" style={{ color: PURPLE }} />
                  <h3 className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                    {t('פירוט מימון ומיסים', 'Financing & Tax Detail')}
                  </h3>
                </div>
                <div className="space-y-1">
                  <ResultRow label={`ריבית ליווי (S-curve, ${fmtPct(assumptions.seniorDebtRate)})`} labelEn={`Senior debt interest (S-curve, ${fmtPct(assumptions.seniorDebtRate)})`} value={`₪${fmtMoney(model.seniorDebtInterest)}`} />
                  <ResultRow label="ערבות חוק מכר" labelEn="Sales law guarantee" value={`₪${fmtMoney(model.costSalesLawGuarantee)}`} />
                  <ResultRow label="עלות הון עצמי" labelEn="Equity cost" value={`₪${fmtMoney(model.equityCost)}`} />
                  <ResultRow label='סה"כ מימון' labelEn="Total Financing" value={`₪${fmtMoney(model.totalFinancingCost)}`} bold />
                </div>
                <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <ResultRow label={`היטל השבחה (${fmtNum(model.addedSqm)} מ"ר × ₪${fmtNum(assumptions.salePriceMainSqm)} × ${Math.round(assumptions.bettermentLevyRate * 100)}%)`} labelEn={`Betterment levy (${fmtNum(model.addedSqm)} sqm)`} value={`₪${fmtMoney(model.costBettermentLevy)}`} color="#dc2626" />
                </div>
              </div>
            )}

            {/* ── CTA ── */}
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)', color: '#1a1a2e' }}
            >
              <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
                {t(
                  'לקבלת ניתוח מעמיק ומותאם אישית, פנה לצוות המומחים שלנו.',
                  'For in-depth personalized analysis, contact our expert team.'
                )}
              </p>
              <a
                href="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`, boxShadow: `0 4px 16px ${PURPLE}40`, textDecoration: 'none' }}
              >
                {t('פגישת ייעוץ — ₪2,500', 'Consultation — ₪2,500')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto"
        style={{ background: 'rgba(13,17,23,0.9)' }}
      >
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('ניתוח כדאיות כלכלית — תמ"א 38/2 הריסה ובנייה', 'Economic Feasibility — TMA 38/2 Demolition & Reconstruction')}</span>
      </div>
    </div>
  );
}
