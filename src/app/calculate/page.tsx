'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ruler, Building2, Search, ArrowLeft, ChevronDown,
  AlertTriangle, CheckCircle2, Calculator, MapPin,
  TrendingUp, Layers, Box, ArrowRight, Zap,
} from 'lucide-react';
import type { ZoningPlan, CalculationResult, FormulaResult } from '@/types';
import { ruleCategoryLabels } from '@/types';
import { getAllPlans, findPlansByLocation, evaluateFormula } from '@/services/db';
import { calculateBuildingEnvelope, validateAreaFitsEnvelope } from '@/services/envelope-calculator';

// ── Isometric 3D Building ────────────────────────────────────

const GREEN = '#4ade80';
const GREEN_DARK = '#22c55e';
const GREEN_DARKER = '#16a34a';
const GREEN_LIGHT = '#86efac';
const GOLD = '#fbbf24';

function MassingSVG({ result }: { result: CalculationResult }) {
  const { plan, input, buildable } = result;
  const floorH = 16;
  const bW = 100;
  const bD = 60;
  const numFloors = plan.buildingRights.maxFloors || 4;

  const svgW = 420;
  const svgH = 380;
  const originX = svgW / 2;
  const originY = svgH - 60;

  const COS30 = Math.cos((30 * Math.PI) / 180);
  const SIN30 = Math.sin((30 * Math.PI) / 180);

  function iso(x: number, y: number, z: number): [number, number] {
    return [originX + (x - y) * COS30, originY - z - (x + y) * SIN30];
  }

  function face(pts: [number, number, number][]): string {
    const projected = pts.map(([x, y, z]) => iso(x, y, z));
    return `M ${projected.map(([px, py]) => `${px},${py}`).join(' L ')} Z`;
  }

  const plotW = Math.min(input.plotWidth * 2.5, 140);
  const plotD = Math.min(input.plotDepth * 2.5, 100);

  const gridLines: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const sp = 60;
    const [x1, y1] = iso(-180, i * sp, 0);
    const [x2, y2] = iso(180, i * sp, 0);
    gridLines.push(`M ${x1},${y1} L ${x2},${y2}`);
    const [x3, y3] = iso(i * sp, -180, 0);
    const [x4, y4] = iso(i * sp, 180, 0);
    gridLines.push(`M ${x3},${y3} L ${x4},${y4}`);
  }

  const hw = bW / 2;
  const hd = bD / 2;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-md mx-auto" style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }}>
      <defs>
        <linearGradient id="ground" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      <path d={face([[-180, -180, 0], [180, -180, 0], [180, 180, 0], [-180, 180, 0]])} fill="url(#ground)" />

      {gridLines.map((d, i) => (
        <path key={i} d={d} stroke="rgba(100,116,139,0.12)" strokeWidth="0.5" fill="none" />
      ))}

      <path
        d={face([[-plotW / 2, -plotD / 2, 0], [plotW / 2, -plotD / 2, 0], [plotW / 2, plotD / 2, 0], [-plotW / 2, plotD / 2, 0]])}
        fill="rgba(74,222,128,0.08)"
        stroke={GREEN}
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />

      {Array.from({ length: numFloors }).map((_, i) => {
        const z0 = i * floorH;
        const z1 = z0 + floorH - 1;

        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.4, type: 'spring' }}
          >
            <path d={face([[hw, -hd, z0], [hw, -hd, z1], [hw, hd, z1], [hw, hd, z0]])} fill={GREEN_DARKER} stroke="#15803d" strokeWidth="0.5" />
            <path d={face([[-hw, hd, z0], [hw, hd, z0], [hw, hd, z1], [-hw, hd, z1]])} fill={GREEN_DARK} stroke="#15803d" strokeWidth="0.5" />
            <path d={face([[-hw, -hd, z1], [hw, -hd, z1], [hw, hd, z1], [-hw, hd, z1]])} fill={GREEN_LIGHT} stroke="#15803d" strokeWidth="0.5" />

            <g opacity="0.25">
              {Array.from({ length: 5 }).map((_, wi) => {
                const t = (wi + 0.5) / 5;
                const [fbl] = [iso(-hw, hd, z0)];
                const [fbr] = [iso(hw, hd, z0)];
                const [ftl] = [iso(-hw, hd, z1)];
                const wx = fbl[0] + (fbr[0] - fbl[0]) * t;
                const wy = fbl[1] + (fbr[1] - fbl[1]) * t;
                const wty = ftl[1] + (ftl[1] - fbl[1]) * 0.3;
                return (
                  <rect key={wi} x={wx - 2} y={wy + (wty - wy) * 0.3} width={3} height={Math.abs(wty - wy) * 0.4} fill="#d1fae5" rx={0.5} />
                );
              })}
            </g>
          </motion.g>
        );
      })}

      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <line
          x1={iso(-hw - 15, -hd, 0)[0]} y1={iso(-hw - 15, -hd, 0)[1]}
          x2={iso(-hw - 15, -hd, numFloors * floorH)[0]} y2={iso(-hw - 15, -hd, numFloors * floorH)[1]}
          stroke={GREEN} strokeWidth="0.8" opacity="0.6"
        />
        <text
          x={iso(-hw - 25, -hd, (numFloors * floorH) / 2)[0]}
          y={iso(-hw - 25, -hd, (numFloors * floorH) / 2)[1]}
          fontSize="9" fill={GREEN} textAnchor="middle" fontFamily="monospace" fontWeight="bold"
        >
          {numFloors}F
        </text>
      </motion.g>

      <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>
        <rect x={svgW / 2 - 50} y={10} width={100} height={24} rx={6} fill="rgba(0,0,0,0.6)" stroke={GREEN} strokeWidth="0.5" />
        <text x={svgW / 2} y={26} fontSize="10" fill={GREEN} textAnchor="middle" fontFamily="monospace" fontWeight="bold">
          {buildable.totalBuildableSqm.toLocaleString()} {"מ\"ר"}
        </text>
      </motion.g>
    </svg>
  );
}

// ── Calculator Page ──────────────────────────────────────────

export default function CalculatePage() {
  const [plans, setPlans] = useState<ZoningPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ZoningPlan | null>(null);
  const [block, setBlock] = useState('');
  const [parcel, setParcel] = useState('');
  const [city, setCity] = useState('');
  const [plotWidth, setPlotWidth] = useState('');
  const [plotDepth, setPlotDepth] = useState('');
  const [plotArea, setPlotArea] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllPlans().then(setPlans);
  }, []);

  useEffect(() => {
    const w = parseFloat(plotWidth);
    const d = parseFloat(plotDepth);
    if (w > 0 && d > 0) {
      setPlotArea(String(Math.round(w * d)));
    }
  }, [plotWidth, plotDepth]);

  useEffect(() => {
    if (city.length >= 2 && !selectedPlan) {
      findPlansByLocation(city).then((matches) => {
        if (matches.length === 1) {
          setSelectedPlan(matches[0]);
        }
      });
    }
  }, [city, selectedPlan]);

  const filteredPlans = plans.filter(
    (p) => !planSearch || p.planNumber.includes(planSearch) || p.name.includes(planSearch) || (p.city && p.city.includes(planSearch))
  );

  const handleCalculate = () => {
    setError('');
    setResult(null);

    if (!selectedPlan) {
      setError('יש לבחור תכנית מהמערכת.');
      return;
    }

    const area = parseFloat(plotArea);
    const width = parseFloat(plotWidth);
    const depth = parseFloat(plotDepth);

    if (!area || area <= 0) {
      setError('יש להזין שטח מגרש.');
      return;
    }
    if (!width || width <= 0 || !depth || depth <= 0) {
      setError('יש להזין רוחב ועומק מגרש.');
      return;
    }

    const plan = selectedPlan;
    const rights = plan.buildingRights;
    const hasRules = plan.rules && plan.rules.length > 0;

    // Formula variables
    const vars: Record<string, number> = {
      Plot_Area: area,
      Plot_Width: width,
      Plot_Depth: depth,
      Num_Units: rights.maxUnits || 1,
      Num_Floors: rights.maxFloors || 1,
    };

    let mainAreaSqm: number;
    let serviceAreaSqm: number;
    const formulaResults: FormulaResult[] = [];

    if (hasRules) {
      // Formula-based calculation
      for (const rule of plan.rules) {
        const result = evaluateFormula(rule.formula, vars);
        const usedVars: Record<string, number> = {};
        for (const [k, v] of Object.entries(vars)) {
          if (rule.formula.includes(k)) usedVars[k] = v;
        }

        // Build readable calculation string
        let calcStr = rule.formula;
        for (const [k, v] of Object.entries(usedVars)) {
          calcStr = calcStr.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(v));
        }

        formulaResults.push({
          rule,
          inputValues: usedVars,
          result,
          calculation: `${rule.formula} = ${calcStr} = ${result.toLocaleString()}`,
        });
      }

      // Get main and service from formula results
      const mainResult = formulaResults.find(r => r.rule.category === 'main_rights');
      const serviceResult = formulaResults.find(r => r.rule.category === 'service_area');
      mainAreaSqm = mainResult ? Math.round(mainResult.result) : Math.round((rights.mainBuildingPercent / 100) * area);
      serviceAreaSqm = serviceResult ? Math.round(serviceResult.result) : Math.round((rights.serviceBuildingPercent / 100) * area);
    } else {
      // Legacy flat-value calculation
      mainAreaSqm = Math.round((rights.mainBuildingPercent / 100) * area);
      serviceAreaSqm = Math.round((rights.serviceBuildingPercent / 100) * area);
    }

    const totalBuildableSqm = mainAreaSqm + serviceAreaSqm;

    // Envelope Verification
    const envelopeInput = {
      plotWidth: width,
      plotDepth: depth,
      plotArea: area,
      frontSetback: plan.restrictions.frontSetback,
      rearSetback: plan.restrictions.rearSetback,
      sideSetback: plan.restrictions.sideSetback,
      maxCoverage: plan.restrictions.maxLandCoverage || rights.landCoveragePercent || 40,
      maxFloors: rights.maxFloors || 4,
      maxHeight: rights.maxHeight || 15,
      floorHeight: 3.0,
    };

    const envelopeResult = calculateBuildingEnvelope(envelopeInput);
    const validation = validateAreaFitsEnvelope(totalBuildableSqm, envelopeResult);

    setResult({
      plan,
      input: { block, parcel, city, plotWidth: width, plotDepth: depth, plotArea: area },
      buildable: { mainAreaSqm, serviceAreaSqm, totalBuildableSqm },
      envelope: {
        netFootprint: envelopeResult.netFootprint,
        maxCoverageArea: envelopeResult.maxCoverageArea,
        effectiveFootprint: envelopeResult.effectiveFootprint,
        totalEnvelopeVolume: envelopeResult.totalVolume,
        requestedArea: totalBuildableSqm,
        fits: validation.fits,
        utilizationPercent: validation.utilizationPercent,
        message: validation.message,
        steps: envelopeResult.steps,
      },
      constraints: {
        maxFloors: rights.maxFloors,
        maxHeight: rights.maxHeight,
        maxUnits: rights.maxUnits,
        landCoverageSqm: Math.round((rights.landCoveragePercent / 100) * area),
      },
      formulaResults,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.06)] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors">
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs">ראשי</span>
            </a>
            <div className="w-px h-5 bg-[rgba(255,255,255,0.1)]" />
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent" />
              <h1 className="text-lg font-bold">מחשבון זכויות בנייה</h1>
            </div>
          </div>
          <div className="text-xs text-foreground-muted">
            {plans.length > 0 ? `${plans.length} תכניות במערכת` : 'אין תכניות — העלה תב"ע דרך /admin'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {plans.length === 0 ? (
          <div className="db-card p-10 text-center mt-10">
            <AlertTriangle className="w-12 h-12 text-gold mx-auto mb-3 opacity-60" />
            <h2 className="text-lg font-semibold mb-2">{'אין תכניות במערכת'}</h2>
            <p className="text-sm text-foreground-muted mb-4">
              {'המערכת לא למדה אף תב"ע. גש לפאנל הניהול והעלה מסמך PDF.'}
            </p>
            <a href="/admin" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />{'לפאנל ניהול'}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Left: Input Form */}
            <div className="space-y-4">
              {/* Plan Selection */}
              <div className="db-card p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-accent" />
                  {'1. בחר תכנית'}
                </h3>

                {selectedPlan ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green" />
                      <span className="font-bold text-sm">{selectedPlan.planNumber}</span>
                      {selectedPlan.city && <span className="text-xs text-foreground-muted">({selectedPlan.city})</span>}
                      {selectedPlan.rules?.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">{selectedPlan.rules.length} נוסחאות</span>
                      )}
                    </div>
                    <button onClick={() => { setSelectedPlan(null); setShowPlanPicker(true); }} className="text-xs text-accent hover:underline">שנה</button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                      <input
                        className="input-field w-full pr-10"
                        placeholder="חפש תכנית לפי מספר, שם או עיר..."
                        value={planSearch}
                        onFocus={() => setShowPlanPicker(true)}
                        onChange={(e) => { setPlanSearch(e.target.value); setShowPlanPicker(true); }}
                      />
                    </div>
                    {showPlanPicker && (
                      <div className="absolute z-50 w-full mt-1 db-card max-h-60 overflow-y-auto">
                        {filteredPlans.length === 0 && <div className="p-3 text-sm text-foreground-muted text-center">אין תכניות תואמות</div>}
                        {filteredPlans.map((p) => (
                          <button
                            key={p.id}
                            className="w-full text-right p-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0"
                            onClick={() => { setSelectedPlan(p); setShowPlanPicker(false); setPlanSearch(''); if (p.city) setCity(p.city); }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{p.planNumber}</span>
                              {p.city && <span className="text-xs text-foreground-muted">{p.city}</span>}
                              {p.rules?.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-0.5">
                                  <Zap className="w-2.5 h-2.5" />{p.rules.length}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-foreground-muted mt-0.5">
                              {p.rules?.length > 0
                                ? `${p.rules.length} נוסחאות בנייה`
                                : `${p.buildingRights.mainBuildingPercent}% עיקרי | ${p.buildingRights.maxFloors} קומות`
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Plot Identification */}
              <div className="db-card p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  {'2. פרטי חלקה'}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">גוש</label>
                    <input className="input-field w-full mt-1 text-center" value={block} onChange={(e) => setBlock(e.target.value)} placeholder="6534" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">חלקה</label>
                    <input className="input-field w-full mt-1 text-center" value={parcel} onChange={(e) => setParcel(e.target.value)} placeholder="123" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">עיר</label>
                    <input className="input-field w-full mt-1" value={city} onChange={(e) => setCity(e.target.value)} placeholder="רעננה" />
                  </div>
                </div>
              </div>

              {/* Physical Dimensions */}
              <div className="db-card p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-accent" />
                  {'3. מידות פיזיות של המגרש'}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">{"רוחב (מ')"}</label>
                    <input type="number" className="input-field w-full mt-1 text-center" value={plotWidth} onChange={(e) => setPlotWidth(e.target.value)} placeholder="15" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">{"עומק (מ')"}</label>
                    <input type="number" className="input-field w-full mt-1 text-center" value={plotDepth} onChange={(e) => setPlotDepth(e.target.value)} placeholder="20" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">{'שטח כולל (מ"ר)'}</label>
                    <input type="number" className="input-field w-full mt-1 text-center" value={plotArea} onChange={(e) => setPlotArea(e.target.value)} placeholder="300" dir="ltr" />
                  </div>
                </div>
                <p className="text-[10px] text-foreground-muted">שטח מחושב אוטומטית מרוחב x עומק, או הזן ידנית.</p>
              </div>

              {error && (
                <div className="db-card p-3 border border-[rgba(245,158,11,0.2)]">
                  <div className="flex items-center gap-2 text-sm text-gold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <button onClick={handleCalculate} className="btn-green w-full py-4 text-base flex items-center justify-center gap-2">
                <Calculator className="w-5 h-5" />
                {'חשב זכויות בנייה'}
              </button>
            </div>

            {/* Right: Results / 3D */}
            <div className="space-y-4">
              {!result && (
                <div className="db-card p-10 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                  <Box className="w-16 h-16 text-foreground-muted mx-auto mb-4 opacity-30" />
                  <h3 className="text-base font-semibold text-foreground-secondary mb-2">{'הזן נתונים ולחץ "חשב"'}</h3>
                  <p className="text-sm text-foreground-muted">
                    {'התוצאות יוצגו כאן כולל הדמיית Massing תלת-ממדית'}
                  </p>
                </div>
              )}

              {result && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* 3D Massing */}
                    <div className="db-card p-4">
                      <MassingSVG result={result} />
                    </div>

                    {/* Core Numbers */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="db-card p-4 text-center">
                        <TrendingUp className="w-5 h-5 text-green mx-auto mb-1" />
                        <div className="text-2xl font-bold font-mono text-green">{result.buildable.totalBuildableSqm.toLocaleString()}</div>
                        <div className="text-xs text-foreground-muted">{'מ"ר ניתנים לבנייה'}</div>
                      </div>
                      <div className="db-card p-4 text-center">
                        <Layers className="w-5 h-5 text-accent mx-auto mb-1" />
                        <div className="text-2xl font-bold font-mono">{result.constraints.maxFloors}</div>
                        <div className="text-xs text-foreground-muted">קומות מרביות</div>
                      </div>
                      <div className="db-card p-4 text-center">
                        <Box className="w-5 h-5 mx-auto mb-1" style={{ color: GOLD }} />
                        <div className="text-2xl font-bold font-mono" style={{ color: GOLD }}>{result.envelope.totalEnvelopeVolume.toLocaleString()}</div>
                        <div className="text-xs text-foreground-muted">{'מ"ר מעטפת'}</div>
                      </div>
                    </div>

                    {/* Formula Results (if available) */}
                    {result.formulaResults.length > 0 && (
                      <div className="db-card p-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" />
                          {'חישוב לפי נוסחאות'}
                        </h4>
                        <div className="space-y-2">
                          {result.formulaResults.map((fr, i) => (
                            <div key={i} className="p-2.5 rounded bg-[rgba(0,0,0,0.2)] space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-foreground-muted">
                                    {ruleCategoryLabels[fr.rule.category]}
                                  </span>
                                  <span className="text-xs text-foreground-secondary">{fr.rule.displayValue}</span>
                                </div>
                                <span className="font-mono font-bold text-sm text-green">{fr.result.toLocaleString()} {'מ"ר'}</span>
                              </div>
                              <pre className="text-[10px] text-foreground-muted font-mono whitespace-pre-wrap">{fr.calculation}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Breakdown (when no formulas) */}
                    {result.formulaResults.length === 0 && (
                      <div className="db-card p-4 space-y-3">
                        <h4 className="font-semibold text-sm">פירוט חישוב</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between p-2 rounded bg-[rgba(0,0,0,0.2)]">
                            <span className="text-foreground-muted">{'שטח עיקרי ('}{result.plan.buildingRights.mainBuildingPercent}{'%)'}</span>
                            <span className="font-mono font-bold">{result.buildable.mainAreaSqm.toLocaleString()} {'מ"ר'}</span>
                          </div>
                          <div className="flex justify-between p-2 rounded bg-[rgba(0,0,0,0.2)]">
                            <span className="text-foreground-muted">{'שטח שירות ('}{result.plan.buildingRights.serviceBuildingPercent}{'%)'}</span>
                            <span className="font-mono font-bold">{result.buildable.serviceAreaSqm.toLocaleString()} {'מ"ר'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="db-card p-3">
                      <div className="flex justify-between p-2 rounded bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]">
                        <span className="text-green font-semibold text-sm">{'סה"כ ניתן לבנייה'}</span>
                        <span className="font-mono font-bold text-green text-sm">{result.buildable.totalBuildableSqm.toLocaleString()} {'מ"ר'}</span>
                      </div>
                    </div>

                    {/* Envelope Verification */}
                    <div className={`db-card p-4 space-y-2 border ${result.envelope.fits ? 'border-[rgba(34,197,94,0.2)]' : 'border-[rgba(245,158,11,0.2)]'}`}>
                      <div className="flex items-center gap-2">
                        {result.envelope.fits ? (
                          <CheckCircle2 className="w-5 h-5 text-green" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-gold" />
                        )}
                        <h4 className="font-semibold text-sm">אימות מעטפת בניין</h4>
                      </div>
                      <p className="text-xs text-foreground-secondary">{result.envelope.message}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="p-2 rounded bg-[rgba(0,0,0,0.2)]">
                          <span className="text-foreground-muted">שטח נטו לאחר קווי בניין:</span>
                          <span className="font-mono font-bold mr-1">{result.envelope.netFootprint} {'מ"ר'}</span>
                        </div>
                        <div className="p-2 rounded bg-[rgba(0,0,0,0.2)]">
                          <span className="text-foreground-muted">ניצולת:</span>
                          <span className="font-mono font-bold mr-1">{result.envelope.utilizationPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Setbacks summary */}
                    <div className="db-card p-4">
                      <h4 className="font-semibold text-sm mb-2">{'קווי בניין (מתוך התב"ע)'}</h4>
                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="p-2 rounded bg-[rgba(0,0,0,0.2)]">
                          <div className="text-foreground-muted">קדמי</div>
                          <div className="font-mono font-bold text-base">{result.plan.restrictions.frontSetback}{"מ'"}</div>
                        </div>
                        <div className="p-2 rounded bg-[rgba(0,0,0,0.2)]">
                          <div className="text-foreground-muted">אחורי</div>
                          <div className="font-mono font-bold text-base">{result.plan.restrictions.rearSetback}{"מ'"}</div>
                        </div>
                        <div className="p-2 rounded bg-[rgba(0,0,0,0.2)]">
                          <div className="text-foreground-muted">צידי</div>
                          <div className="font-mono font-bold text-base">{result.plan.restrictions.sideSetback}{"מ'"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Envelope Steps */}
                    <div className="db-card p-4 space-y-3">
                      <h4 className="font-semibold text-sm">שלבי חישוב (Audit Trail)</h4>
                      {result.envelope.steps.map((step, i) => (
                        <div key={i} className="p-3 rounded bg-[rgba(0,0,0,0.2)] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-accent">שלב {step.step}: {step.title}</span>
                            <span className="text-xs text-foreground-muted">{step.source}</span>
                          </div>
                          <pre className="text-[10px] text-foreground-secondary whitespace-pre-wrap font-mono leading-relaxed">{step.calculation}</pre>
                          <div className="text-xs font-bold text-green">{step.result}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
