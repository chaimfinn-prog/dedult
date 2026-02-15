'use client';

import { useState, useMemo } from 'react';
import {
  Building2, ArrowRight, Globe, TrendingUp, DollarSign,
  Home, Maximize,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

// ── Helpers ──────────────────────────────────────────────────

function fmtILS(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  }
  return n.toLocaleString('he-IL');
}

function fmtPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

function parseNum(raw: string): number {
  return parseFloat(raw.replace(/,/g, '')) || 0;
}

function commaFormat(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('he-IL');
}

// ── PMT formula ──────────────────────────────────────────────

function pmt(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

// ── Loan balance at month N ──────────────────────────────────

function loanBalanceAtMonth(principal: number, annualRate: number, totalMonths: number, month: number): number {
  if (principal <= 0 || totalMonths <= 0 || month <= 0) return principal;
  const r = annualRate / 12;
  if (r === 0) return principal * (1 - month / totalMonths);
  const payment = pmt(principal, annualRate, totalMonths);
  return principal * Math.pow(1 + r, month) - payment * ((Math.pow(1 + r, month) - 1) / r);
}

// ── Component ────────────────────────────────────────────────

export default function NewApartmentPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const isHe = lang === 'he';

  // ── User inputs (raw strings for formatting) ──

  const [priceRaw, setPriceRaw] = useState('');
  const [equityRaw, setEquityRaw] = useState('');
  const [rentRaw, setRentRaw] = useState('');
  const [sqmRaw, setSqmRaw] = useState('');

  // ── Parsed values ──

  const price = parseNum(priceRaw);
  const equity = parseNum(equityRaw);
  const rent = parseNum(rentRaw);
  const sqm = parseNum(sqmRaw);

  // ── Calculations (auto via useMemo) ────────────────────────

  const calc = useMemo(() => {
    if (price <= 0) return null;

    // A. One-Time Purchase Costs
    const purchaseTax = price * 0.08;
    const legalFee = price * 0.005 * 1.17;
    const brokerFee = price * 0.02 * 1.17;
    const renovation = sqm * 800;
    const incidentals = 5000;
    const totalExpenses = purchaseTax + legalFee + brokerFee + renovation + incidentals;
    const totalInvestment = price + totalExpenses;

    // B. Mortgage
    const loanAmount = Math.max(price - equity, 0);
    const interestRate = 0.05;
    const termMonths = 300; // 25 years
    const monthlyMortgage = pmt(loanAmount, interestRate, termMonths);
    const annualMortgage = monthlyMortgage * 12;

    // C. Ongoing Costs
    const occupancyRate = 0.95;
    const maintenance = 150;
    const insurance = 150;
    const monthlyOngoingCosts = maintenance + insurance;
    const annualOngoingCosts = monthlyOngoingCosts * 12;

    // D. Annual Income
    const annualGrossRent = rent * 12 * occupancyRate;
    const annualNetIncome = annualGrossRent - annualOngoingCosts;

    // Dashboard Metrics
    // 1. Annual Net Yield
    const annualNetYield = totalInvestment > 0
      ? ((annualGrossRent - annualOngoingCosts) / totalInvestment) * 100
      : 0;

    // 2. Cash-on-Cash Return
    const cashOutlay = equity + totalExpenses;
    const annualCashFlow = annualNetIncome - annualMortgage;
    const cashOnCash = cashOutlay > 0
      ? (annualCashFlow / cashOutlay) * 100
      : 0;

    // 3. Projected Value 5 Years
    const appreciationRate = 0.03;
    const projectedValue5y = price * Math.pow(1 + appreciationRate, 5);

    // Chart data: 10-year wealth accumulation
    const chartData = Array.from({ length: 11 }, (_, year) => {
      const propertyValue = Math.round(price * Math.pow(1 + appreciationRate, year));
      const monthAtYear = year * 12;
      const loanBal = monthAtYear === 0
        ? loanAmount
        : Math.max(Math.round(loanBalanceAtMonth(loanAmount, interestRate, termMonths, monthAtYear)), 0);
      const equityValue = propertyValue - loanBal;

      return {
        year,
        label: `${year}`,
        propertyValue,
        loanBalance: loanBal,
        equity: equityValue,
      };
    });

    return {
      purchaseTax,
      legalFee,
      brokerFee,
      renovation,
      incidentals,
      totalExpenses,
      totalInvestment,
      loanAmount,
      monthlyMortgage,
      annualMortgage,
      annualGrossRent,
      annualNetIncome,
      annualOngoingCosts,
      annualNetYield,
      cashOnCash,
      projectedValue5y,
      chartData,
    };
  }, [price, equity, rent, sqm]);

  // ── Input handler with comma formatting ──

  const handleInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(commaFormat(e.target.value));
  };

  // ── Custom Tooltip ──

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div
        style={{
          background: 'rgba(22,27,34,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px 16px',
          direction: isHe ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#F8FAFD' }}>
          {t(`שנה ${label}`, `Year ${label}`)}
        </div>
        {payload.map((entry: any, i: number) => (
          <div key={i} style={{ fontSize: 11, color: entry.color, marginBottom: 2 }}>
            {entry.name}: <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', monospace" }}>{'\u20AA'}{Number(entry.value).toLocaleString('he-IL')}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-cinematic bg-cover bg-center"
          style={{ backgroundImage: `url('${FALLBACK_IMG}')` }}
        />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* ── Header ── */}
      <div
        className="relative z-10 border-b border-[var(--border)] sticky top-0"
        style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-green" />
            <span className="font-bold text-sm">PROPCHECK</span>
            <span className="text-foreground-muted text-xs">
              {t('| מחשבון השקעה', '| Investment Calculator')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : '\u05E2\u05D1'}
            </button>
            <a
              href="/"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              {t('\u05D7\u05D6\u05E8\u05D4', 'Back')}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t('מחשבון כדאיות השקעה — דירה חדשה', 'New Apartment Investment Calculator')}
          </h1>
          <p className="text-sm text-foreground-muted max-w-xl mx-auto">
            {t(
              'הזן 4 נתונים בלבד וקבל ניתוח פיננסי מלא כולל תשואה, תזרים ותחזית ל-10 שנים.',
              'Enter just 4 data points and get a full financial analysis including yield, cash flow, and a 10-year projection.'
            )}
          </p>
        </div>

        {/* ── Glass Calculator Card ── */}
        <div
          className="mx-auto max-w-4xl"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 'var(--radius)',
            color: '#1a1a2e',
            padding: 0,
          }}
        >

          {/* ── Inputs ── */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                  <span className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" />
                    {t('מחיר הנכס', 'Property Price')} ({'\u20AA'})
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="2,500,000"
                  value={priceRaw}
                  onChange={handleInput(setPriceRaw)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', monospace",
                    color: '#1a1a2e',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#5B8DEE'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                />
              </div>

              {/* Equity */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    {t('הון עצמי', 'Equity / Cash')} ({'\u20AA'})
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="800,000"
                  value={equityRaw}
                  onChange={handleInput(setEquityRaw)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', monospace",
                    color: '#1a1a2e',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#5B8DEE'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                />
              </div>

              {/* Monthly Rent */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t('שכירות חודשית צפויה', 'Expected Monthly Rent')} ({'\u20AA'})
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="5,500"
                  value={rentRaw}
                  onChange={handleInput(setRentRaw)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', monospace",
                    color: '#1a1a2e',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#5B8DEE'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                />
              </div>

              {/* Sqm */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                  <span className="flex items-center gap-1.5">
                    <Maximize className="w-3.5 h-3.5" />
                    {t('גודל במ"ר', 'Property Size (sqm)')}
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="75"
                  value={sqmRaw}
                  onChange={handleInput(setSqmRaw)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: '15px',
                    fontFamily: "'Space Grotesk', monospace",
                    color: '#1a1a2e',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#5B8DEE'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                />
              </div>
            </div>
          </div>

          {/* ── Results Section ── */}
          {calc && (
            <>
              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '0 24px' }} />

              {/* ── 3 Big Metrics ── */}
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Annual Net Yield */}
                  <div
                    className="text-center p-5 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                      {t('תשואה שנתית נטו', 'Annual Net Yield')}
                    </div>
                    <div
                      className="text-3xl sm:text-4xl font-black"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: calc.annualNetYield >= 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {fmtPercent(calc.annualNetYield)}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                      {t('הכנסה נטו / סה"כ השקעה', 'Net income / total investment')}
                    </div>
                  </div>

                  {/* Cash-on-Cash */}
                  <div
                    className="text-center p-5 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                      {t('תשואה על ההון', 'Cash-on-Cash Return')}
                    </div>
                    <div
                      className="text-3xl sm:text-4xl font-black"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: calc.cashOnCash >= 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {fmtPercent(calc.cashOnCash)}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                      {t('תזרים שנתי / הון עצמי + הוצאות', 'Annual cashflow / equity + expenses')}
                    </div>
                  </div>

                  {/* Projected Value 5Y */}
                  <div
                    className="text-center p-5 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                      {t('שווי בעוד 5 שנים', 'Projected Value (5Y)')}
                    </div>
                    <div
                      className="text-3xl sm:text-4xl font-black"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: '#5B8DEE',
                      }}
                    >
                      {'\u20AA'}{fmtILS(Math.round(calc.projectedValue5y))}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                      {t('עליית ערך שנתית 3%', '3% annual appreciation')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '0 24px' }} />

              {/* ── Cost Breakdown ── */}
              <div className="p-6 sm:p-8">
                <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1a2e' }}>
                  {t('פירוט עלויות רכישה', 'Purchase Cost Breakdown')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: t('מס רכישה', 'Purchase Tax'), value: calc.purchaseTax },
                    { label: t('שכ"ט עו"ד', 'Legal Fee'), value: calc.legalFee },
                    { label: t('עמלת תיווך', 'Broker Fee'), value: calc.brokerFee },
                    { label: t('שיפוץ', 'Renovation'), value: calc.renovation },
                    { label: t('שונות', 'Incidentals'), value: calc.incidentals },
                    { label: t('סה"כ השקעה', 'Total Investment'), value: calc.totalInvestment, highlight: true },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg text-center"
                      style={{
                        background: item.highlight ? 'rgba(91,141,238,0.08)' : 'rgba(0,0,0,0.03)',
                        border: item.highlight ? '1px solid rgba(91,141,238,0.2)' : '1px solid rgba(0,0,0,0.04)',
                      }}
                    >
                      <div className="text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>
                        {item.label}
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{
                          fontFamily: "'Space Grotesk', monospace",
                          color: item.highlight ? '#5B8DEE' : '#1a1a2e',
                        }}
                      >
                        {'\u20AA'}{fmtILS(Math.round(item.value))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mortgage summary row */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>
                      {t('סכום משכנתא', 'Loan Amount')}
                    </div>
                    <div className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>
                      {'\u20AA'}{fmtILS(Math.round(calc.loanAmount))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>
                      {t('החזר חודשי', 'Monthly Payment')}
                    </div>
                    <div className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#dc2626' }}>
                      {'\u20AA'}{fmtILS(Math.round(calc.monthlyMortgage))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>
                      {t('הכנסה שנתית נטו (לפני משכנתא)', 'Annual Net Income (pre-mortgage)')}
                    </div>
                    <div
                      className="text-sm font-bold"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: calc.annualNetIncome >= 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {'\u20AA'}{fmtILS(Math.round(calc.annualNetIncome))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '0 24px' }} />

              {/* ── 10-Year Chart ── */}
              <div className="p-6 sm:p-8">
                <h3 className="text-sm font-bold mb-1" style={{ color: '#1a1a2e' }}>
                  {t('צבירת הון — 10 שנים', 'Wealth Accumulation — 10 Years')}
                </h3>
                <p className="text-[11px] mb-5" style={{ color: '#6b7280' }}>
                  {t(
                    'הפער בין שווי הנכס ליתרת ההלוואה מייצג את ההון העצמי הגדל שלך.',
                    'The gap between property value and loan balance represents your growing equity.'
                  )}
                </p>

                <div style={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={calc.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProperty" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5B8DEE" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#5B8DEE" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                        tickLine={false}
                        label={{
                          value: t('שנים', 'Years'),
                          position: 'insideBottom',
                          offset: -2,
                          style: { fontSize: 10, fill: '#9ca3af' },
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                        width={50}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        formatter={(value: string) => (
                          <span style={{ color: '#4a4a6a', fontSize: 11 }}>{value}</span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="propertyValue"
                        name={t('שווי הנכס', 'Property Value')}
                        stroke="#5B8DEE"
                        strokeWidth={2.5}
                        fill="url(#colorProperty)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#5B8DEE' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="loanBalance"
                        name={t('יתרת הלוואה', 'Loan Balance')}
                        stroke="#dc2626"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#dc2626' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        name={t('הון עצמי', 'Net Equity')}
                        stroke="#16a34a"
                        strokeWidth={1.5}
                        fill="rgba(22,163,106,0.08)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#16a34a' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Assumptions Note ── */}
              <div
                className="px-6 sm:px-8 pb-6 sm:pb-8"
              >
                <div
                  className="p-4 rounded-lg text-[10px] leading-relaxed"
                  style={{ background: 'rgba(0,0,0,0.03)', color: '#9ca3af', border: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <span style={{ fontWeight: 700, color: '#6b7280' }}>{t('הנחות חישוב', 'Assumptions')}: </span>
                  {t(
                    'מס רכישה 8% | שכ"ט עו"ד 0.5%+מע"מ | תיווך 2%+מע"מ | שיפוץ 800\u20AA/מ"ר | ריבית 5% | תקופה 25 שנה | תפוסה 95% | ביטוח+ועד 300\u20AA/חודש | עליית ערך 3%/שנה',
                    'Purchase tax 8% | Legal 0.5%+VAT | Broker 2%+VAT | Reno 800\u20AA/sqm | Rate 5% | Term 25yr | Occupancy 95% | Insurance+Maint 300\u20AA/mo | Appreciation 3%/yr'
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Empty state ── */}
          {!calc && (
            <div className="p-10 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#d1d5db', opacity: 0.5 }} />
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {t('הזן את נתוני הנכס למעלה כדי לראות ניתוח מלא', 'Enter property data above to see full analysis')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto"
        style={{ background: 'rgba(13,17,23,0.9)' }}
      >
        <span>PROPCHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('בדיקת כדאיות לנדל"ן', 'Real Estate Due Diligence')}</span>
      </div>
    </div>
  );
}
