'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import {
  Building2, Ruler, Layers, Users, ChevronLeft, Home,
  ArrowUpDown, Info, Warehouse, Car, ParkingCircle,
  Shield, Merge, RectangleHorizontal, Loader2, MapPin, AlertCircle,
} from 'lucide-react';
import { getCityPlan } from '@/data/plans';
import { calculateCityPlan } from '@/services/city-plan-calculator';
import type { CityPlanInput, CityPlanConfig, CityPlanResult, ExtraRuleConfig } from '@/data/plans/types';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('he-IL');
}

// ── Main Page ──────────────────────────────────────────────────

export default function CityPlanPage() {
  const params = useParams();
  const slug = params.slug as string;
  const config = getCityPlan(slug);

  if (!config) {
    notFound();
  }

  return <CityPlanCalculator config={config} />;
}

function CityPlanCalculator({ config }: { config: CityPlanConfig }) {
  const [input, setInput] = useState<CityPlanInput>({
    plotArea: 0,
    plotWidth: 0,
    plotDepth: 0,
    existingFloors: config.coefficientTable[0].existingFloors,
    existingBuiltArea: 0,
    existingUnits: 0,
    existingAvgUnitSize: 0,
    smallApartmentPct: config.unitSizes.smallPctDefault,
    hasRoofApartment: false,
    selectedBonusIds: [],
  });

  const [gush, setGush] = useState('');
  const [helka, setHelka] = useState('');
  const [parcelLookup, setParcelLookup] = useState<{
    loading: boolean;
    found: boolean | null;
    city?: string;
    address?: string;
    areaSqm?: number;
    estimatedWidth?: number;
    estimatedDepth?: number;
    existingFloors?: number;
    existingUnits?: number;
    avgUnitSize?: number;
    estimatedBuiltArea?: number;
    ownership?: string;
    zoning?: string;
    planNumber?: string;
    error?: string;
  }>({ loading: false, found: null });
  const manuallyEdited = useRef<Set<string>>(new Set());

  // Auto-lookup when gush + helka are both filled
  useEffect(() => {
    const g = parseInt(gush);
    const h = parseInt(helka);
    if (!g || !h || g <= 0 || h <= 0) {
      setParcelLookup({ loading: false, found: null });
      return;
    }

    const controller = new AbortController();
    setParcelLookup({ loading: true, found: null });

    fetch(`/api/parcel?gush=${g}&helka=${h}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.found) {
          setParcelLookup({
            loading: false,
            found: true,
            city: data.city,
            address: data.address,
            areaSqm: data.areaSqm,
            estimatedWidth: data.estimatedWidth,
            estimatedDepth: data.estimatedDepth,
            existingFloors: data.existingFloors,
            existingUnits: data.existingUnits,
            avgUnitSize: data.avgUnitSize,
            estimatedBuiltArea: data.estimatedBuiltArea,
            ownership: data.ownership,
            zoning: data.zoning,
            planNumber: data.planNumber,
          });
          // Auto-fill fields that haven't been manually edited
          setInput(prev => {
            const next = { ...prev };
            const m = manuallyEdited.current;
            if (data.areaSqm && !m.has('plotArea')) next.plotArea = data.areaSqm;
            if (data.estimatedWidth && !m.has('plotWidth')) next.plotWidth = data.estimatedWidth;
            if (data.estimatedDepth && !m.has('plotDepth')) next.plotDepth = data.estimatedDepth;
            if (data.existingFloors && !m.has('existingFloors')) {
              const validFloors = config.coefficientTable.map(c => c.existingFloors);
              const closest = validFloors.reduce((a, b) =>
                Math.abs(b - data.existingFloors) < Math.abs(a - data.existingFloors) ? b : a,
              );
              next.existingFloors = closest;
            }
            if (data.existingUnits && !m.has('existingUnits')) next.existingUnits = data.existingUnits;
            if (data.avgUnitSize && !m.has('existingAvgUnitSize')) next.existingAvgUnitSize = data.avgUnitSize;
            if (data.estimatedBuiltArea && !m.has('existingBuiltArea')) next.existingBuiltArea = data.estimatedBuiltArea;
            return next;
          });
        } else {
          setParcelLookup({ loading: false, found: false, error: data.error });
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setParcelLookup({ loading: false, found: false, error: 'שגיאה בחיפוש' });
        }
      });

    return () => controller.abort();
  }, [gush, helka, config.coefficientTable]);

  const result = useMemo(
    () => input.plotArea > 0 ? calculateCityPlan(input, config) : null,
    [input, config],
  );

  const update = (field: keyof CityPlanInput, value: number | boolean | string[]) => {
    manuallyEdited.current.add(field);
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const toggleBonus = (id: string) => {
    setInput(prev => {
      const ids = prev.selectedBonusIds.includes(id)
        ? prev.selectedBonusIds.filter(b => b !== id)
        : [...prev.selectedBonusIds, id];
      return { ...prev, selectedBonusIds: ids };
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back nav */}
        <a href="/" className="inline-flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground mb-6 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>חזרה לדף הבית</span>
        </a>

        {/* Header */}
        <div className="db-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6 text-green" />
            <div>
              <div className="text-xs text-foreground-muted tracking-widest uppercase mb-1">מחשבון זכויות בנייה</div>
              <h1 className="text-xl font-bold">{config.planName}</h1>
              <div className="text-sm text-foreground-muted mt-1">תכנית {config.planNumber} | {config.city}</div>
            </div>
          </div>
        </div>

        {/* Gush/Helka with auto-lookup */}
        <div className="db-card p-5 mb-4" style={{ borderColor: parcelLookup.found === true ? 'var(--green)' : parcelLookup.found === false ? '#e53e3e' : 'var(--accent)' }}>
          <SectionLabel icon={<MapPin className="w-3.5 h-3.5" />} label="גוש / חלקה — חיפוש אוטומטי" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="גוש" value={gush} onChange={setGush} type="text" placeholder="לדוגמה: 7662" />
            <Field label="חלקה" value={helka} onChange={setHelka} type="text" placeholder="לדוגמה: 100" />
          </div>
          {parcelLookup.loading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              מחפש חלקה ב-GovMap...
            </div>
          )}
          {parcelLookup.found === true && (
            <div className="mt-3 p-3 rounded-lg text-xs space-y-1.5" style={{ background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.2)' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--green)' }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-bold">
                  חלקה נמצאה{parcelLookup.city ? ` — ${parcelLookup.city}` : ''}
                  {parcelLookup.address ? `, ${parcelLookup.address}` : ''}
                </span>
              </div>
              <div className="text-foreground-muted mr-5 flex flex-wrap gap-x-4 gap-y-0.5">
                {parcelLookup.areaSqm && <span>שטח רשום: {parcelLookup.areaSqm.toLocaleString('he-IL')} מ"ר</span>}
                {parcelLookup.estimatedWidth && parcelLookup.estimatedDepth && (
                  <span>מידות: ~{parcelLookup.estimatedWidth}×{parcelLookup.estimatedDepth} מ'</span>
                )}
                {parcelLookup.ownership && <span>בעלות: {parcelLookup.ownership}</span>}
              </div>
              {(parcelLookup.zoning || parcelLookup.planNumber) && (
                <div className="text-foreground-muted mr-5 flex flex-wrap gap-x-4 gap-y-0.5">
                  {parcelLookup.planNumber && <span>תכנית: {parcelLookup.planNumber}</span>}
                  {parcelLookup.zoning && <span>ייעוד: {parcelLookup.zoning}</span>}
                </div>
              )}
              {(parcelLookup.existingFloors || parcelLookup.existingUnits) && (
                <div className="text-foreground-muted mr-5 flex flex-wrap gap-x-4 gap-y-0.5">
                  {parcelLookup.existingFloors && <span>קומות: {parcelLookup.existingFloors}</span>}
                  {parcelLookup.existingUnits && <span>דירות: ~{parcelLookup.existingUnits}</span>}
                  {parcelLookup.avgUnitSize && <span>שטח ממוצע: {parcelLookup.avgUnitSize} מ"ר</span>}
                </div>
              )}
            </div>
          )}
          {parcelLookup.found === false && (
            <div className="mt-3 p-2 rounded-lg text-xs flex items-center gap-2" style={{ background: 'rgba(229,62,62,0.1)', color: '#e53e3e' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{parcelLookup.error || 'חלקה לא נמצאה'} — </span>
              <a href={`https://www.govmap.gov.il/?q=גוש ${gush} חלקה ${helka}`} target="_blank" rel="noopener noreferrer" className="underline">
                חפש ב-GovMap
              </a>
            </div>
          )}
        </div>

        {/* Parcel inputs */}
        <div className="db-card p-5 mb-4">
          <SectionLabel icon={<Ruler className="w-3.5 h-3.5" />} label="נתוני מגרש" />
          <div className="grid grid-cols-3 gap-3">
            <NumberField label='שטח מגרש (מ"ר)' value={input.plotArea} onChange={v => update('plotArea', v)}
              hint={input.plotArea > 0 ? `${(input.plotArea / 1000).toFixed(3)} דונם` : ''} />
            <NumberField label="רוחב מגרש (מ')" value={input.plotWidth} onChange={v => update('plotWidth', v)} />
            <NumberField label="עומק מגרש (מ')" value={input.plotDepth} onChange={v => update('plotDepth', v)} />
          </div>
        </div>

        {/* Existing building */}
        <div className="db-card p-5 mb-4">
          <SectionLabel icon={<Building2 className="w-3.5 h-3.5" />} label="מבנה קיים" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">קומות קיימות</label>
              <select
                className="input-field w-full"
                value={input.existingFloors}
                onChange={e => update('existingFloors', parseInt(e.target.value))}
              >
                {config.coefficientTable.map(c => (
                  <option key={c.existingFloors} value={c.existingFloors}>{c.existingFloors} קומות</option>
                ))}
              </select>
            </div>
            <NumberField label='שטח בנוי בקרקע (מ"ר)' value={input.existingBuiltArea} onChange={v => update('existingBuiltArea', v)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label={'יח"ד קיימות'} value={input.existingUnits} onChange={v => update('existingUnits', v)} />
            <NumberField label='שטח ממוצע לדירה (מ"ר)' value={input.existingAvgUnitSize} onChange={v => update('existingAvgUnitSize', v)} />
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">דירת גג מוצמדת</label>
              <select
                className="input-field w-full"
                value={input.hasRoofApartment ? '1' : '0'}
                onChange={e => {
                  const has = e.target.value === '1';
                  update('hasRoofApartment', has);
                  if (has && !input.selectedBonusIds.includes('roof')) {
                    toggleBonus('roof');
                  }
                }}
              >
                <option value="0">לא</option>
                <option value="1">כן</option>
              </select>
            </div>
          </div>
        </div>

        {/* Unit mix slider */}
        <div className="db-card p-5 mb-4">
          <SectionLabel icon={<Users className="w-3.5 h-3.5" />} label="תמהיל דירות" />
          <div className="flex items-center gap-4">
            <span className="text-xs text-foreground-muted whitespace-nowrap">דירות קטנות: {input.smallApartmentPct}%</span>
            <input
              type="range"
              min={config.unitSizes.smallPctMin}
              max={config.unitSizes.smallPctMax}
              value={input.smallApartmentPct}
              onChange={e => update('smallApartmentPct', parseInt(e.target.value))}
              className="flex-1 accent-[var(--green)]"
            />
            <span className="text-xs text-foreground-muted whitespace-nowrap">גדולות: {100 - input.smallApartmentPct}%</span>
          </div>
        </div>

        {/* Bonus cards */}
        <div className="db-card p-5 mb-4">
          <SectionLabel icon={<ArrowUpDown className="w-3.5 h-3.5" />} label="בונוסים (סעיף 6.1)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.bonuses.map(bonus => (
              <BonusCard
                key={bonus.id}
                bonus={bonus}
                active={input.selectedBonusIds.includes(bonus.id)}
                onToggle={() => toggleBonus(bonus.id)}
              />
            ))}
          </div>
          {input.selectedBonusIds.length > 0 && (
            <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'rgba(var(--green-rgb, 72,187,120), 0.1)', border: '1px solid rgba(var(--green-rgb, 72,187,120), 0.2)' }}>
              <Info className="w-3.5 h-3.5 inline ml-1 text-green" />
              בונוסים מחויבים בהפקדת תצ"ר + אישור מהנדס העיר
            </div>
          )}
        </div>

        {/* Results */}
        {result && input.plotArea > 0 && (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard label={'סה"כ שטחי בנייה'} value={fmt(result.totalAboveGround)} unit='מ"ר' highlight />
              <MetricCard label="זכויות מגורים" value={fmt(result.residentialRights)} unit='מ"ר' />
              <MetricCard label={'מקס\' יח"ד'} value={String(result.maxUnits)} unit="יחידות דיור" />
              <MetricCard label="מקס' קומות" value={result.maxFloorsLabel} unit={result.totalBonusPct > 0 ? "עד ק'+9+גג עם בונוס" : ''} />
            </div>

            {/* Breakdown */}
            <div className="db-card p-5 mb-4">
              <SectionLabel icon={<Layers className="w-3.5 h-3.5" />} label="פירוט זכויות" />
              <BreakdownRow
                title="זכויות בסיס"
                sub={`${fmt(input.plotArea)} מ"ר × תכסית ${result.coveragePct}% × מקדם ${result.coefficient}`}
                value={`${fmt(result.baseRights)} מ"ר`}
                color="blue"
              />
              {result.bonusBreakdown.map(b => (
                <BreakdownRow
                  key={b.id}
                  title={`בונוס: ${b.label}`}
                  sub={`סעיף 6.1 — ${b.pct}%`}
                  value={`+${fmt(b.area)} מ"ר`}
                  color="green"
                />
              ))}
              {result.publicUse > 0 && (
                <BreakdownRow title="מבנים ומוסדות ציבור" sub="הערה ב' — מגרש מעל 2 דונם" value={`+${result.publicUse} מ"ר`} color="orange" />
              )}
              <BreakdownRow title="שטחים משותפים לרווחת הדיירים" sub={'הערה י\' — 50 מ"ר קבוע'} value={`+${result.sharedAreas} מ"ר`} color="orange" />
              <div className="mt-3 p-3 rounded-lg flex justify-between items-center font-bold" style={{ background: 'rgba(var(--green-rgb, 72,187,120), 0.1)' }}>
                <span>סה"כ שטחי בנייה מעל הקרקע</span>
                <span className="text-green">{fmt(result.totalAboveGround)} מ"ר</span>
              </div>
              {input.plotArea <= config.constants.publicUseThreshold && (
                <div className="mt-2 text-xs text-foreground-muted p-2 rounded" style={{ background: 'rgba(255,200,50,0.08)' }}>
                  תוספת {config.constants.publicUseSqm} מ"ר ציבורית תחול רק מעל {config.constants.publicUseThreshold / 1000} דונם
                </div>
              )}
            </div>

            {/* Extra rights */}
            <div className="db-card p-5 mb-4">
              <SectionLabel icon={<RectangleHorizontal className="w-3.5 h-3.5" />} label="שטחים נוספים (מחוץ לחישוב)" />
              <BreakdownRow title="מרפסות (כולל סגורות ב-3 קירות)" sub={`הערה ה' — מקסימום ${config.constants.balconySqmPerUnit} מ"ר × ${result.maxUnits} יח"ד`} value={`עד ${fmt(result.balconies)} מ"ר`} color="green" />
              <BreakdownRow title="שטחי שירות בתת קרקע" sub={`הערה ד' — עד ${config.constants.maxUndergroundLevels} מפלסים, תכסית מקס' ${config.constants.undergroundCoveragePct}%`} value={`${fmt(result.undergroundPerLevel)} מ"ר לקומה`} />
              <BreakdownRow title="מחסנים דירתיים" sub={`בקומת מרתף/קרקע — עד ${config.constants.storageSqmPerUnit} מ"ר ליח"ד`} value={`${fmt(result.storage)} מ"ר`} />
              <BreakdownRow title="גינת ילדים / חצר ציבורית" sub="במגרש מעל 2 דונם — חצר לפי תקנות תקפות" value={input.plotArea > config.constants.publicUseThreshold ? 'נדרש' : 'לא חל'} badge />
            </div>

            {/* Unit mix */}
            <div className="db-card p-5 mb-4">
              <SectionLabel icon={<Users className="w-3.5 h-3.5" />} label="תמהיל יחידות דיור" />
              <div className="grid grid-cols-3 gap-3">
                <UnitMixCard count={result.smallUnits} label="דירות קטנות" sub={`≤${config.unitSizes.smallMaxSqm} מ"ר | ממוצע ~${config.unitSizes.smallAvgSqm} מ"ר`} pct={input.smallApartmentPct} color="blue" />
                <UnitMixCard count={result.largeUnits} label="דירות גדולות" sub={`>${config.unitSizes.smallMaxSqm} מ"ר | ממוצע ~${config.unitSizes.largeAvgSqm} מ"ר`} pct={100 - input.smallApartmentPct} color="purple" />
                <UnitMixCard count={result.maxUnits} label='סה"כ יח"ד' sub={`מגבלה: ${config.constants.densityUnitsPerDunam} יח"ד/דונם`} pct={null} color="green"
                  badge={result.maxUnitsByArea < result.maxUnitsByDensity ? 'מוגבל ע"י זכויות' : 'מוגבל ע"י צפיפות'} />
              </div>
            </div>

            {/* Setbacks & coverage */}
            {result.setbacks && (
              <div className="db-card p-5 mb-4">
                <SectionLabel icon={<Ruler className="w-3.5 h-3.5" />} label="קווי בניין ותכסית" />
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <SetbackCard label="קו בניין קדמי" value={`${result.setbacks.front} מ'`} sub="קבוע" />
                  <SetbackCard label="קו בניין צידי" value={`${result.setbacks.side} מ'`} sub={`לרוחב ${input.plotWidth} מ'`} />
                  <SetbackCard label="קו בניין אחורי" value={`${result.setbacks.rear} מ'`} sub={`לרוחב ${input.plotWidth} מ'`} />
                </div>

                {/* Coverage analysis */}
                <div className="text-xs font-bold text-foreground-muted tracking-wide mb-3 pt-3 border-t border-[var(--border)]">ניתוח תכסית</div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <SetbackCard label="תכסית מותרת" value={`${fmt(result.coverageArea)} מ"ר`} sub={`${result.coveragePct}% × ${fmt(input.plotArea)} מ"ר`} />
                  {result.buildableFootprint > 0 ? (
                    <>
                      <SetbackCard
                        label="שטח בנוי בתוך קווי בניין"
                        value={`${fmt(result.buildableFootprint)} מ"ר`}
                        sub={`${result.buildableWidth.toFixed(1)}מ' × ${result.buildableDepth.toFixed(1)}מ'`}
                        ok={result.coverageArea <= result.buildableFootprint}
                      />
                      {result.coverageArea <= result.buildableFootprint ? (
                        <SetbackCard label="תכסית נכנסת" value={`+${fmt(result.buildableFootprint - result.coverageArea)} מ"ר`} sub="גמישות — שטח פנוי בתוך קווי הבניין" ok />
                      ) : (
                        <SetbackCard label="תכסית חורגת" value={`${fmt(result.coverageArea - result.buildableFootprint)} מ"ר`} sub="התכסית גדולה מהשטח בין קווי הבניין — קווי הבניין מגבילים" ok={false} />
                      )}
                    </>
                  ) : (
                    <>
                      <SetbackCard label="שטח בין הקווים" value="—" sub="הזן עומק מגרש" />
                      <SetbackCard label="גמישות" value="—" sub="ממתין לעומק" />
                    </>
                  )}
                </div>

                {/* SVG Plot diagram */}
                {input.plotWidth > 0 && input.plotDepth > 0 && result.setbacks && (
                  <PlotDiagram
                    width={input.plotWidth}
                    depth={input.plotDepth}
                    setbacks={result.setbacks}
                    netW={result.buildableWidth}
                    netD={result.buildableDepth}
                    coverageArea={result.coverageArea}
                  />
                )}

                {/* Existing built area check */}
                {input.existingBuiltArea > 0 && (
                  <>
                    <div className="text-xs font-bold text-foreground-muted tracking-wide mb-3 pt-3 border-t border-[var(--border)]">בדיקת שטח בנוי קיים</div>
                    <BreakdownRow title="שטח בנוי קיים בקרקע" sub={`${(input.existingBuiltArea / input.plotArea * 100).toFixed(1)}% מהמגרש`} value={`${fmt(input.existingBuiltArea)} מ"ר`} />
                    <BreakdownRow title="תכסית מותרת" sub={`${result.coveragePct}% מהמגרש`} value={`${fmt(result.coverageArea)} מ"ר`} />
                    <BreakdownRow
                      title="תוצאה"
                      value={input.existingBuiltArea <= result.coverageArea
                        ? `תואם — בנוי ${fmt(result.coverageArea - input.existingBuiltArea)} מ"ר מתחת למקסימום`
                        : `חריגה — ${fmt(input.existingBuiltArea - result.coverageArea)} מ"ר מעל המותר`}
                      badge
                      color={input.existingBuiltArea <= result.coverageArea ? 'green' : 'red'}
                    />
                  </>
                )}
              </div>
            )}

            {/* Existing vs proposed */}
            {(input.existingUnits > 0 || input.existingAvgUnitSize > 0) && (
              <div className="db-card p-5 mb-4">
                <SectionLabel icon={<ArrowUpDown className="w-3.5 h-3.5" />} label="קיים מול מוצע" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold text-foreground-muted tracking-wide mb-3">מבנה קיים</div>
                    {input.existingUnits > 0 && <BreakdownRow title={'יח"ד קיימות'} value={String(input.existingUnits)} />}
                    {input.existingAvgUnitSize > 0 && <BreakdownRow title="שטח ממוצע לדירה" value={`${input.existingAvgUnitSize} מ"ר`} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground-muted tracking-wide mb-3">מוצע חדש</div>
                    <BreakdownRow title={'יח"ד מוצעות'} value={String(result.maxUnits)} color="blue" />
                    <BreakdownRow title="שטח מגורים" value={`${fmt(result.residentialRights)} מ"ר`} color="blue" />
                    <BreakdownRow title="מקסימום קומות" value={result.maxFloorsLabel} color="blue" />
                  </div>
                </div>
                {result.unitGain !== null && (
                  <div className="mt-3 p-3 rounded-lg flex justify-between items-center font-bold" style={{ background: result.unitGain > 0 ? 'rgba(72,187,120,0.1)' : 'rgba(229,62,62,0.1)' }}>
                    <span>{result.unitGain > 0 ? 'תוספת יח"ד' : 'הפרש יח"ד'}</span>
                    <span style={{ color: result.unitGain > 0 ? 'var(--green)' : '#e53e3e' }}>
                      {result.unitGain > 0 ? '+' : ''}{result.unitGain} יח"ד
                      {input.existingUnits > 0 ? ` (${Math.round(result.unitGain / input.existingUnits * 100)}%)` : ''}
                    </span>
                  </div>
                )}
                {result.unitGain !== null && result.unitGain > 0 && input.existingUnits > 0 && (
                  <div className="mt-2 text-xs p-2 rounded" style={{ background: 'rgba(72,187,120,0.08)', color: 'var(--green)' }}>
                    הפרויקט מוסיף {result.unitGain} יח"ד על פני {input.existingUnits} קיימות — יחס דייר מחליף: 1:{(result.maxUnits / input.existingUnits).toFixed(2)}
                  </div>
                )}
                {result.areaRatio !== null && (
                  <BreakdownRow title="יחס זכויות חדש / בנוי קיים" sub="שטח מגורים מוצע מחולק בשטח בנוי קיים (אומדן)" value={`×${result.areaRatio.toFixed(2)}`} color="blue" />
                )}
              </div>
            )}

            {/* Extra rules */}
            <div className="db-card p-5 mb-4">
              <SectionLabel icon={<Info className="w-3.5 h-3.5" />} label="כללים נוספים" />
              {config.extraRules.map((rule, i) => (
                <BreakdownRow
                  key={rule.id}
                  title={rule.title}
                  sub={rule.description}
                  value={rule.valueType === 'sqm' && result ? `${fmt(result.maxCommercial)} מ"ר` : rule.value}
                  badge={rule.valueType === 'badge'}
                />
              ))}
            </div>

            {/* Audit trail */}
            <div className="db-card p-5 mb-4">
              <SectionLabel icon={<Layers className="w-3.5 h-3.5" />} label="שלבי חישוב" />
              {result.steps.map(step => (
                <div key={step.step} className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-xs font-bold text-foreground-muted min-w-[24px]">{step.step}.</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-foreground-muted">{step.calculation}</div>
                  </div>
                  <span className="text-sm font-bold text-green">{step.result}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {input.plotArea <= 0 && (
          <div className="db-card p-12 text-center">
            <Building2 className="w-12 h-12 text-foreground-muted mx-auto mb-4 opacity-30" />
            <div className="text-foreground-muted text-sm">הזן שטח מגרש להתחלת חישוב</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-Components ─────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-xs font-bold tracking-wide text-foreground-muted uppercase mb-3 flex items-center gap-2">
      {icon}
      {label}
    </div>
  );
}

function Field({ label, value, onChange, type = 'number', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground-muted mb-1">{label}</label>
      <input type={type} className="input-field w-full" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function NumberField({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground-muted mb-1">{label}</label>
      <input
        type="number"
        className="input-field w-full"
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
      {hint && <div className="text-xs text-foreground-muted mt-1">{hint}</div>}
    </div>
  );
}

function BonusCard({ bonus, active, onToggle }: {
  bonus: { id: string; label: string; description: string; pct: number };
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-start gap-3 p-3 rounded-lg border transition-all text-right cursor-pointer"
      style={{
        background: active ? 'rgba(72,187,120,0.1)' : 'rgba(255,255,255,0.02)',
        borderColor: active ? 'var(--green)' : 'var(--border)',
      }}
    >
      <span className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
        borderColor: active ? 'var(--green)' : 'var(--border)',
        background: active ? 'var(--green)' : 'transparent',
        color: active ? '#000' : 'transparent',
      }}>
        {active ? '✓' : ''}
      </span>
      <div className="flex-1">
        <div className="text-sm font-medium">
          {bonus.label}
          <span className="mr-2 text-xs font-bold text-green">+{bonus.pct}%</span>
        </div>
        <div className="text-xs text-foreground-muted mt-0.5">{bonus.description}</div>
      </div>
    </button>
  );
}

function MetricCard({ label, value, unit, highlight }: {
  label: string; value: string; unit: string; highlight?: boolean;
}) {
  return (
    <div className="db-card p-4 text-center" style={highlight ? { borderColor: 'var(--green)', background: 'rgba(72,187,120,0.05)' } : {}}>
      <div className="text-xs text-foreground-muted mb-1">{label}</div>
      <div className={`text-xl font-bold ${highlight ? 'text-green' : ''}`}>{value}</div>
      <div className="text-xs text-foreground-muted mt-1">{unit}</div>
    </div>
  );
}

function BreakdownRow({ title, sub, value, color, badge }: {
  title: string; sub?: string; value: string; color?: string; badge?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: '#4299e1',
    green: 'var(--green)',
    orange: '#ed8936',
    red: '#e53e3e',
  };
  const c = color ? colorMap[color] : undefined;

  return (
    <div className="flex items-start justify-between py-2 border-b border-[var(--border)] last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {sub && <div className="text-xs text-foreground-muted mt-0.5">{sub}</div>}
      </div>
      {badge ? (
        <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: c ? `${c}20` : 'rgba(66,153,225,0.15)', color: c || '#4299e1' }}>
          {value}
        </span>
      ) : (
        <span className="text-sm font-bold whitespace-nowrap" style={c ? { color: c } : {}}>
          {value}
        </span>
      )}
    </div>
  );
}

function SetbackCard({ label, value, sub, ok }: {
  label: string; value: string; sub: string; ok?: boolean;
}) {
  const borderColor = ok === true ? 'var(--green)' : ok === false ? '#e53e3e' : 'var(--border)';
  const bgColor = ok === true ? 'rgba(72,187,120,0.05)' : ok === false ? 'rgba(229,62,62,0.05)' : 'transparent';

  return (
    <div className="p-3 rounded-lg border text-center" style={{ borderColor, background: bgColor }}>
      <div className="text-lg font-bold" style={ok === false ? { color: '#e53e3e' } : ok === true ? { color: 'var(--green)' } : {}}>{value}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
      <div className="text-xs text-foreground-muted mt-0.5">{sub}</div>
    </div>
  );
}

function UnitMixCard({ count, label, sub, pct, color, badge }: {
  count: number; label: string; sub: string; pct: number | null; color: string; badge?: string;
}) {
  const colors: Record<string, string> = { blue: '#4299e1', purple: '#9f7aea', green: 'var(--green)' };
  return (
    <div className="db-card p-4 text-center">
      <div className="text-2xl font-bold" style={{ color: colors[color] }}>{count}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-foreground-muted mt-1">{sub}</div>
      {pct !== null && (
        <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${colors[color]}20`, color: colors[color] }}>
          {pct}%
        </span>
      )}
      {badge && (
        <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${colors[color]}20`, color: colors[color] }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function PlotDiagram({ width, depth, setbacks, netW, netD, coverageArea }: {
  width: number; depth: number; setbacks: { front: number; side: number; rear: number };
  netW: number; netD: number; coverageArea: number;
}) {
  const SVG_W = 400;
  const SVG_H = 300;
  const PAD = 36;
  const scaleX = (SVG_W - PAD * 2) / width;
  const scaleY = (SVG_H - PAD * 2) / depth;
  const scale = Math.min(scaleX, scaleY);
  const plotW = width * scale;
  const plotD = depth * scale;
  const ox = (SVG_W - plotW) / 2;
  const oy = (SVG_H - plotD) / 2;
  const sF = setbacks.front * scale;
  const sS = setbacks.side * scale;
  const sR = setbacks.rear * scale;
  const innerX = ox + sS;
  const innerY = oy + sF;
  const innerW = netW * scale;
  const innerH = netD * scale;

  return (
    <div className="mt-4 pt-3 border-t border-[var(--border)]">
      <div className="text-xs font-bold tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
        תרשים סכמטי — תצוגת עין ציפור
      </div>
      <div className="p-2 rounded-lg border border-[var(--border)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" style={{ maxHeight: 260, display: 'block' }}>
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(160,174,192,0.5)" strokeWidth="1" />
            </pattern>
          </defs>
          {/* Plot boundary */}
          <rect x={ox} y={oy} width={plotW} height={plotD} fill="rgba(237,242,247,0.08)" stroke="rgba(160,174,192,0.6)" strokeWidth="2" />
          {/* Setback zones */}
          <rect x={ox} y={oy} width={plotW} height={sF} fill="url(#hatch)" opacity="0.7" />
          <rect x={ox} y={oy + plotD - sR} width={plotW} height={sR} fill="url(#hatch)" opacity="0.7" />
          <rect x={ox} y={oy + sF} width={sS} height={plotD - sF - sR} fill="url(#hatch)" opacity="0.7" />
          <rect x={ox + plotW - sS} y={oy + sF} width={sS} height={plotD - sF - sR} fill="url(#hatch)" opacity="0.7" />
          {/* Buildable zone */}
          <rect x={innerX} y={innerY} width={innerW} height={innerH} fill="rgba(66,153,225,0.12)" stroke="#3182ce" strokeWidth="1.5" strokeDasharray="5,3" />
          {/* Dimension labels */}
          <text x={ox + plotW / 2} y={oy + plotD + 22} textAnchor="middle" fontSize="10" fill="rgba(160,174,192,0.8)" fontFamily="Heebo,sans-serif">{width} מ'</text>
          <text x={ox - 22} y={oy + plotD / 2} textAnchor="middle" fontSize="10" fill="rgba(160,174,192,0.8)" fontFamily="Heebo,sans-serif" transform={`rotate(-90,${ox - 22},${oy + plotD / 2})`}>{depth} מ'</text>
          {/* Setback labels */}
          <text x={ox + plotW / 2} y={oy + sF / 2 + 4} textAnchor="middle" fontSize="9" fill="#ed8936" fontFamily="Heebo,sans-serif">קדמי {setbacks.front}מ'</text>
          <text x={ox + plotW / 2} y={oy + plotD - sR / 2 + 4} textAnchor="middle" fontSize="9" fill="#ed8936" fontFamily="Heebo,sans-serif">אחורי {setbacks.rear}מ'</text>
          <text x={ox + sS / 2} y={innerY + innerH / 2} textAnchor="middle" fontSize="9" fill="#ed8936" fontFamily="Heebo,sans-serif" transform={`rotate(-90,${ox + sS / 2},${innerY + innerH / 2})`}>צידי {setbacks.side}מ'</text>
          {/* Inner label */}
          <text x={innerX + innerW / 2} y={innerY + innerH / 2 - 4} textAnchor="middle" fontSize="10" fill="#3182ce" fontFamily="Heebo,sans-serif" fontWeight="bold">
            {netW.toFixed(1)} × {netD.toFixed(1)}
          </text>
          <text x={innerX + innerW / 2} y={innerY + innerH / 2 + 10} textAnchor="middle" fontSize="9" fill="#3182ce" fontFamily="Heebo,sans-serif">
            = {fmt(netW * netD)} מ"ר
          </text>
        </svg>
      </div>
    </div>
  );
}
