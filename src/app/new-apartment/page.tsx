'use client';

import { useState, useMemo } from 'react';
import {
  Building2, ArrowRight, Globe, TrendingUp, DollarSign,
  Home as HomeIcon, Maximize, MapPin, AlertTriangle, CheckCircle2,
  BarChart3, ShieldAlert, Sparkles, ArrowUpRight, ArrowDownRight,
  Layers, Target, Info,
} from 'lucide-react';
import {
  Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
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

// ── Market Intelligence Engine ───────────────────────────────

interface MarketIntelligence {
  cityTier: 'premium' | 'major' | 'mid' | 'peripheral';
  avgPricePerSqm: number;
  userPricePerSqm: number;
  priceDiffPercent: number;
  supplyLevel: 'High' | 'Medium' | 'Low';
  supplyLevelHe: 'גבוהה' | 'בינונית' | 'נמוכה';
  developerPressure: 'High' | 'Medium' | 'Low';
  developerPressureHe: 'גבוה' | 'בינוני' | 'נמוך';
  riskFactors: { he: string; en: string; type: 'risk' | 'opportunity' | 'neutral' }[];
  marketTrend: 'rising' | 'stable' | 'cooling';
  marketTrendHe: 'עולה' | 'יציב' | 'מתקרר';
  demandScore: number; // 1-10
  cityNameHe: string;
  cityNameEn: string;
}

const CITY_DATA: Record<string, {
  tier: 'premium' | 'major' | 'mid' | 'peripheral';
  basePricePerSqm: number;
  supply: 'High' | 'Medium' | 'Low';
  supplyHe: 'גבוהה' | 'בינונית' | 'נמוכה';
  pressure: 'High' | 'Medium' | 'Low';
  pressureHe: 'גבוה' | 'בינוני' | 'נמוך';
  trend: 'rising' | 'stable' | 'cooling';
  trendHe: 'עולה' | 'יציב' | 'מתקרר';
  demand: number;
  he: string;
  en: string;
}> = {
  'תל אביב': { tier: 'premium', basePricePerSqm: 68000, supply: 'Low', supplyHe: 'נמוכה', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 9.5, he: 'תל אביב', en: 'Tel Aviv' },
  'tel aviv': { tier: 'premium', basePricePerSqm: 68000, supply: 'Low', supplyHe: 'נמוכה', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 9.5, he: 'תל אביב', en: 'Tel Aviv' },
  'רמת גן': { tier: 'premium', basePricePerSqm: 48000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 8, he: 'רמת גן', en: 'Ramat Gan' },
  'ramat gan': { tier: 'premium', basePricePerSqm: 48000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 8, he: 'רמת גן', en: 'Ramat Gan' },
  'גבעתיים': { tier: 'premium', basePricePerSqm: 52000, supply: 'Low', supplyHe: 'נמוכה', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 8.5, he: 'גבעתיים', en: 'Givatayim' },
  'givatayim': { tier: 'premium', basePricePerSqm: 52000, supply: 'Low', supplyHe: 'נמוכה', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 8.5, he: 'גבעתיים', en: 'Givatayim' },
  'הרצליה': { tier: 'premium', basePricePerSqm: 55000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 8.5, he: 'הרצליה', en: 'Herzliya' },
  'herzliya': { tier: 'premium', basePricePerSqm: 55000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 8.5, he: 'הרצליה', en: 'Herzliya' },
  'ירושלים': { tier: 'major', basePricePerSqm: 45000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7.5, he: 'ירושלים', en: 'Jerusalem' },
  'jerusalem': { tier: 'major', basePricePerSqm: 45000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7.5, he: 'ירושלים', en: 'Jerusalem' },
  'חיפה': { tier: 'major', basePricePerSqm: 28000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 6, he: 'חיפה', en: 'Haifa' },
  'haifa': { tier: 'major', basePricePerSqm: 28000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 6, he: 'חיפה', en: 'Haifa' },
  'באר שבע': { tier: 'mid', basePricePerSqm: 22000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 5.5, he: 'באר שבע', en: 'Beer Sheva' },
  'beer sheva': { tier: 'mid', basePricePerSqm: 22000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 5.5, he: 'באר שבע', en: 'Beer Sheva' },
  'נתניה': { tier: 'mid', basePricePerSqm: 32000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'cooling', trendHe: 'מתקרר', demand: 6.5, he: 'נתניה', en: 'Netanya' },
  'netanya': { tier: 'mid', basePricePerSqm: 32000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'cooling', trendHe: 'מתקרר', demand: 6.5, he: 'נתניה', en: 'Netanya' },
  'ראשון לציון': { tier: 'major', basePricePerSqm: 38000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 7.5, he: 'ראשון לציון', en: 'Rishon LeZion' },
  'rishon lezion': { tier: 'major', basePricePerSqm: 38000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 7.5, he: 'ראשון לציון', en: 'Rishon LeZion' },
  'פתח תקווה': { tier: 'major', basePricePerSqm: 36000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7, he: 'פתח תקווה', en: 'Petah Tikva' },
  'petah tikva': { tier: 'major', basePricePerSqm: 36000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7, he: 'פתח תקווה', en: 'Petah Tikva' },
  'אשדוד': { tier: 'mid', basePricePerSqm: 26000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'cooling', trendHe: 'מתקרר', demand: 5.5, he: 'אשדוד', en: 'Ashdod' },
  'ashdod': { tier: 'mid', basePricePerSqm: 26000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'cooling', trendHe: 'מתקרר', demand: 5.5, he: 'אשדוד', en: 'Ashdod' },
  'אשקלון': { tier: 'peripheral', basePricePerSqm: 20000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'cooling', trendHe: 'מתקרר', demand: 4.5, he: 'אשקלון', en: 'Ashkelon' },
  'ashkelon': { tier: 'peripheral', basePricePerSqm: 20000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'cooling', trendHe: 'מתקרר', demand: 4.5, he: 'אשקלון', en: 'Ashkelon' },
  'כרמיאל': { tier: 'peripheral', basePricePerSqm: 17000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 4, he: 'כרמיאל', en: 'Karmiel' },
  'karmiel': { tier: 'peripheral', basePricePerSqm: 17000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 4, he: 'כרמיאל', en: 'Karmiel' },
  'עפולה': { tier: 'peripheral', basePricePerSqm: 16000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 3.5, he: 'עפולה', en: 'Afula' },
  'afula': { tier: 'peripheral', basePricePerSqm: 16000, supply: 'High', supplyHe: 'גבוהה', pressure: 'High', pressureHe: 'גבוה', trend: 'stable', trendHe: 'יציב', demand: 3.5, he: 'עפולה', en: 'Afula' },
  'הוד השרון': { tier: 'major', basePricePerSqm: 42000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 7.5, he: 'הוד השרון', en: 'Hod HaSharon' },
  'hod hasharon': { tier: 'major', basePricePerSqm: 42000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 7.5, he: 'הוד השרון', en: 'Hod HaSharon' },
  'רעננה': { tier: 'premium', basePricePerSqm: 50000, supply: 'Low', supplyHe: 'נמוכה', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 8.5, he: 'רעננה', en: "Ra'anana" },
  "ra'anana": { tier: 'premium', basePricePerSqm: 50000, supply: 'Low', supplyHe: 'נמוכה', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 8.5, he: 'רעננה', en: "Ra'anana" },
  'raanana': { tier: 'premium', basePricePerSqm: 50000, supply: 'Low', supplyHe: 'נמוכה', pressure: 'Low', pressureHe: 'נמוך', trend: 'rising', trendHe: 'עולה', demand: 8.5, he: 'רעננה', en: "Ra'anana" },
  'כפר סבא': { tier: 'major', basePricePerSqm: 38000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7, he: 'כפר סבא', en: 'Kfar Saba' },
  'kfar saba': { tier: 'major', basePricePerSqm: 38000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7, he: 'כפר סבא', en: 'Kfar Saba' },
  'בת ים': { tier: 'mid', basePricePerSqm: 35000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 6.5, he: 'בת ים', en: 'Bat Yam' },
  'bat yam': { tier: 'mid', basePricePerSqm: 35000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'rising', trendHe: 'עולה', demand: 6.5, he: 'בת ים', en: 'Bat Yam' },
  'חולון': { tier: 'mid', basePricePerSqm: 34000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 6.5, he: 'חולון', en: 'Holon' },
  'holon': { tier: 'mid', basePricePerSqm: 34000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 6.5, he: 'חולון', en: 'Holon' },
  'מודיעין': { tier: 'major', basePricePerSqm: 35000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7, he: 'מודיעין', en: "Modi'in" },
  "modi'in": { tier: 'major', basePricePerSqm: 35000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7, he: 'מודיעין', en: "Modi'in" },
  'modiin': { tier: 'major', basePricePerSqm: 35000, supply: 'Medium', supplyHe: 'בינונית', pressure: 'Medium', pressureHe: 'בינוני', trend: 'stable', trendHe: 'יציב', demand: 7, he: 'מודיעין', en: "Modi'in" },
};

const DEFAULT_CITY = {
  tier: 'mid' as const,
  basePricePerSqm: 28000,
  supply: 'Medium' as const,
  supplyHe: 'בינונית' as const,
  pressure: 'Medium' as const,
  pressureHe: 'בינוני' as const,
  trend: 'stable' as const,
  trendHe: 'יציב' as const,
  demand: 5.5,
  he: '',
  en: '',
};

function extractCity(address: string): string {
  const trimmed = address.trim().toLowerCase();
  // Try direct match first
  if (CITY_DATA[trimmed]) return trimmed;
  // Check if the address contains a known city name
  for (const key of Object.keys(CITY_DATA)) {
    if (trimmed.includes(key)) return key;
  }
  // Try the original (non-lowered) for Hebrew
  const original = address.trim();
  if (CITY_DATA[original]) return original;
  for (const key of Object.keys(CITY_DATA)) {
    if (original.includes(key)) return key;
  }
  return '';
}

function generateMarketIntelligence(addressInput: string, sqm: number, price: number): MarketIntelligence | null {
  if (!addressInput.trim()) return null;

  const cityKey = extractCity(addressInput);
  const cityInfo = cityKey ? CITY_DATA[cityKey] : null;
  const data = cityInfo || DEFAULT_CITY;

  // Size adjustment: smaller apartments cost more per sqm
  const sizeMultiplier = sqm > 0 ? (sqm < 60 ? 1.12 : sqm < 80 ? 1.0 : sqm < 100 ? 0.95 : 0.88) : 1.0;
  const avgPricePerSqm = Math.round(data.basePricePerSqm * sizeMultiplier);

  const userPricePerSqm = sqm > 0 && price > 0 ? Math.round(price / sqm) : 0;
  const priceDiffPercent = avgPricePerSqm > 0 && userPricePerSqm > 0
    ? ((userPricePerSqm - avgPricePerSqm) / avgPricePerSqm) * 100
    : 0;

  // Generate risk factors based on city tier and market conditions
  const riskFactors: { he: string; en: string; type: 'risk' | 'opportunity' | 'neutral' }[] = [];

  if (data.supply === 'High') {
    riskFactors.push({
      he: 'היצע גבוה באזור — כוח מיקוח חזק לקונה',
      en: 'High supply in area — strong buyer bargaining power',
      type: 'opportunity',
    });
  }
  if (data.supply === 'Low') {
    riskFactors.push({
      he: 'היצע נמוך — תחרות גבוהה על נכסים, מחירים עלולים לעלות',
      en: 'Low supply — high competition for properties, prices may rise',
      type: 'risk',
    });
  }

  if (data.trend === 'rising') {
    riskFactors.push({
      he: 'מגמת עלייה במחירים — פוטנציאל לעליית ערך',
      en: 'Rising price trend — appreciation potential',
      type: 'opportunity',
    });
  }
  if (data.trend === 'cooling') {
    riskFactors.push({
      he: 'שוק מתקרר — ייתכן שהמחירים יתמתנו בטווח הקרוב',
      en: 'Cooling market — prices may moderate in near term',
      type: 'risk',
    });
  }

  if (priceDiffPercent > 15) {
    riskFactors.push({
      he: `המחיר המבוקש גבוה ב-${Math.round(priceDiffPercent)}% מהממוצע באזור — בדוק אם יש הצדקה`,
      en: `Asking price is ${Math.round(priceDiffPercent)}% above area average — verify justification`,
      type: 'risk',
    });
  } else if (priceDiffPercent < -10) {
    riskFactors.push({
      he: `המחיר המבוקש נמוך ב-${Math.round(Math.abs(priceDiffPercent))}% מהממוצע — הזדמנות אפשרית`,
      en: `Asking price is ${Math.round(Math.abs(priceDiffPercent))}% below area average — potential opportunity`,
      type: 'opportunity',
    });
  }

  if (data.pressure === 'High') {
    riskFactors.push({
      he: 'יזמים תחת לחץ מכירה — אפשרות למשא ומתן על הנחות',
      en: 'Developers under selling pressure — room for discount negotiations',
      type: 'opportunity',
    });
  }

  if (data.tier === 'premium') {
    riskFactors.push({
      he: 'אזור פרימיום — ביקוש גבוה ויציב, סיכון נמוך יחסית',
      en: 'Premium area — high stable demand, relatively low risk',
      type: 'neutral',
    });
  } else if (data.tier === 'peripheral') {
    riskFactors.push({
      he: 'אזור פריפריאלי — תשואת שכירות פוטנציאלית גבוהה, סיכון נזילות',
      en: 'Peripheral area — potentially high rental yield, liquidity risk',
      type: 'neutral',
    });
  }

  // Always add a general tip
  riskFactors.push({
    he: 'מומלץ לבצע בדיקת שמאי עצמאי לפני חתימה',
    en: 'Recommended to get an independent appraisal before signing',
    type: 'neutral',
  });

  return {
    cityTier: data.tier,
    avgPricePerSqm,
    userPricePerSqm,
    priceDiffPercent,
    supplyLevel: data.supply,
    supplyLevelHe: data.supplyHe,
    developerPressure: data.pressure,
    developerPressureHe: data.pressureHe,
    riskFactors,
    marketTrend: data.trend,
    marketTrendHe: data.trendHe,
    demandScore: data.demand,
    cityNameHe: cityInfo ? data.he : addressInput.trim(),
    cityNameEn: cityInfo ? data.en : addressInput.trim(),
  };
}

// ── Shared Styles ────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
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
};

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 'var(--radius)',
  color: '#1a1a2e',
};

// ── Badge Component ──────────────────────────────────────────

function Badge({ color, children }: { color: 'green' | 'gold' | 'red' | 'blue' | 'gray'; children: React.ReactNode }) {
  const colors = {
    green: { bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.25)', text: '#16a34a' },
    gold: { bg: 'rgba(202,138,4,0.1)', border: 'rgba(202,138,4,0.25)', text: '#ca8a04' },
    red: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.25)', text: '#dc2626' },
    blue: { bg: 'rgba(91,141,238,0.1)', border: 'rgba(91,141,238,0.25)', text: '#5B8DEE' },
    gray: { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', text: '#6b7280' },
  };
  const c = colors[color];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      {children}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────

export default function NewApartmentPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const isHe = lang === 'he';

  // ── User inputs (raw strings for formatting) ──

  const [addressRaw, setAddressRaw] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [equityRaw, setEquityRaw] = useState('');
  const [rentRaw, setRentRaw] = useState('');
  const [sqmRaw, setSqmRaw] = useState('');
  const [marketValueRaw, setMarketValueRaw] = useState('');

  // ── Parsed values ──

  const price = parseNum(priceRaw);
  const equity = parseNum(equityRaw);
  const rent = parseNum(rentRaw);
  const sqm = parseNum(sqmRaw);
  const marketValue = parseNum(marketValueRaw);

  // ── Market Intelligence ──

  const marketIntel = useMemo(() => {
    return generateMarketIntelligence(addressRaw, sqm, price);
  }, [addressRaw, sqm, price]);

  // ── Renewal Premium ──

  const renewalPremium = useMemo(() => {
    if (price <= 0 || marketValue <= 0) return null;
    const premium = price - marketValue;
    const percentage = (premium / marketValue) * 100;
    return { premium, percentage };
  }, [price, marketValue]);

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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#5B8DEE';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(0,0,0,0.12)';
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

  // ── Supply / Pressure badge color helper ──

  function levelColor(level: 'High' | 'Medium' | 'Low', invert = false): 'green' | 'gold' | 'red' {
    if (invert) {
      return level === 'High' ? 'green' : level === 'Medium' ? 'gold' : 'red';
    }
    return level === 'Low' ? 'green' : level === 'Medium' ? 'gold' : 'red';
  }

  function trendColor(trend: 'rising' | 'stable' | 'cooling'): 'green' | 'gold' | 'blue' {
    return trend === 'rising' ? 'green' : trend === 'cooling' ? 'blue' : 'gold';
  }

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
              'הזן כתובת ו-4 נתונים וקבל ניתוח פיננסי מלא כולל מודיעין שוק, תשואה ותחזית ל-10 שנים.',
              'Enter an address and 4 data points for a full financial analysis with market intelligence, yield, and 10-year projection.'
            )}
          </p>
        </div>

        {/* ── Glass Calculator Card ── */}
        <div className="mx-auto max-w-4xl" style={{ ...glassCard, padding: 0 }}>

          {/* ── Address Input ── */}
          <div className="p-6 sm:p-8 pb-0 sm:pb-0">
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" style={{ color: '#5B8DEE' }} />
                  {t('כתובת הנכס (רחוב + עיר)', 'Property Address (Street + City)')}
                </span>
              </label>
              <input
                type="text"
                dir={isHe ? 'rtl' : 'ltr'}
                placeholder={t('לדוגמה: רוטשילד 10, תל אביב', 'e.g. 10 Rothschild, Tel Aviv')}
                value={addressRaw}
                onChange={(e) => setAddressRaw(e.target.value)}
                style={{
                  ...inputStyle,
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  padding: '12px 16px',
                  background: 'rgba(91,141,238,0.04)',
                  border: '1.5px solid rgba(91,141,238,0.2)',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#5B8DEE'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(91,141,238,0.2)'; }}
              />
              {addressRaw.trim() && !extractCity(addressRaw) && (
                <p className="text-[10px] mt-1.5" style={{ color: '#ca8a04' }}>
                  {t(
                    'העיר לא זוהתה — יוצגו נתוני שוק כלליים. נסה להזין שם עיר מוכר.',
                    'City not recognized — showing general market data. Try entering a known city name.'
                  )}
                </p>
              )}
            </div>
          </div>

          {/* ── Numeric Inputs ── */}
          <div className="p-6 sm:p-8 pt-0 sm:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                  <span className="flex items-center gap-1.5">
                    <HomeIcon className="w-3.5 h-3.5" />
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
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>
          </div>

          {/* ── Market Intelligence Report ── */}
          {marketIntel && addressRaw.trim().length >= 3 && (
            <>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '0 24px' }} />

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4.5 h-4.5" style={{ color: '#5B8DEE' }} />
                  <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
                    {t('דו"ח מודיעין שוק', 'Market Intelligence Report')}
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(91,141,238,0.1)', color: '#5B8DEE' }}>
                    {t(marketIntel.cityNameHe, marketIntel.cityNameEn)}
                  </span>
                </div>

                {/* ── 4 Metric Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

                  {/* Supply Analysis */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#6b7280' }}>
                        {t('רמת היצע', 'Supply Level')}
                      </span>
                    </div>
                    <div className="mb-1.5">
                      <Badge color={levelColor(marketIntel.supplyLevel, true)}>
                        {t(marketIntel.supplyLevelHe, marketIntel.supplyLevel)}
                      </Badge>
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: '#6b7280' }}>
                      {marketIntel.supplyLevel === 'High'
                        ? t('היצע גבוה של דירות חדשות — כוח מיקוח לקונה', 'High new apartment supply — buyer leverage')
                        : marketIntel.supplyLevel === 'Low'
                          ? t('היצע נמוך — תחרות גבוהה בין קונים', 'Low supply — high buyer competition')
                          : t('היצע בינוני — שוק מאוזן', 'Moderate supply — balanced market')}
                    </p>
                  </div>

                  {/* Developer Pressure */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShieldAlert className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#6b7280' }}>
                        {t('לחץ יזמים', 'Developer Pressure')}
                      </span>
                    </div>
                    <div className="mb-1.5">
                      <Badge color={levelColor(marketIntel.developerPressure, true)}>
                        {t(marketIntel.developerPressureHe, marketIntel.developerPressure)}
                      </Badge>
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: '#6b7280' }}>
                      {marketIntel.developerPressure === 'High'
                        ? t('יזמים תחת לחץ — מקום למו"מ על מחיר', 'Developers pressured — room for price negotiation')
                        : marketIntel.developerPressure === 'Low'
                          ? t('יזמים בעמדה חזקה — פחות גמישות', 'Developers in strong position — less flexibility')
                          : t('לחץ בינוני — מו"מ סביר אפשרי', 'Moderate pressure — reasonable negotiation possible')}
                    </p>
                  </div>

                  {/* Average Price / sqm */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#6b7280' }}>
                        {t('מחיר ממוצע למ"ר', 'Avg. Price/sqm')}
                      </span>
                    </div>
                    <div
                      className="text-xl font-black mb-1"
                      style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}
                    >
                      {'\u20AA'}{marketIntel.avgPricePerSqm.toLocaleString('he-IL')}
                    </div>
                    {marketIntel.userPricePerSqm > 0 && (
                      <div className="flex items-center gap-1">
                        {marketIntel.priceDiffPercent > 5 ? (
                          <ArrowUpRight className="w-3 h-3" style={{ color: '#dc2626' }} />
                        ) : marketIntel.priceDiffPercent < -5 ? (
                          <ArrowDownRight className="w-3 h-3" style={{ color: '#16a34a' }} />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" style={{ color: '#16a34a' }} />
                        )}
                        <span className="text-[10px] font-medium" style={{
                          color: Math.abs(marketIntel.priceDiffPercent) <= 5 ? '#16a34a'
                            : marketIntel.priceDiffPercent > 15 ? '#dc2626'
                              : '#ca8a04',
                        }}>
                          {t('שלך', 'Yours')}: {'\u20AA'}{marketIntel.userPricePerSqm.toLocaleString('he-IL')}/m{'\u00B2'}
                          {' '}({marketIntel.priceDiffPercent > 0 ? '+' : ''}{marketIntel.priceDiffPercent.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Market Trend & Demand */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#6b7280' }}>
                        {t('מגמת שוק', 'Market Trend')}
                      </span>
                    </div>
                    <div className="mb-1.5">
                      <Badge color={trendColor(marketIntel.marketTrend)}>
                        {t(marketIntel.marketTrendHe, marketIntel.marketTrend === 'rising' ? 'Rising' : marketIntel.marketTrend === 'cooling' ? 'Cooling' : 'Stable')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>
                        {t('ציון ביקוש', 'Demand')}:
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: i < Math.round(marketIntel.demandScore)
                                ? (marketIntel.demandScore >= 7 ? '#16a34a' : marketIntel.demandScore >= 5 ? '#ca8a04' : '#dc2626')
                                : 'rgba(0,0,0,0.08)',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold" style={{ fontFamily: "'Space Grotesk', monospace", color: '#1a1a2e' }}>
                        {marketIntel.demandScore}/10
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Risk Factors & Opportunities ── */}
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#ca8a04' }} />
                    <span className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                      {t('גורמי סיכון והזדמנויות', 'Risk Factors & Opportunities')}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {marketIntel.riskFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0">
                          {factor.type === 'opportunity' ? (
                            <Sparkles className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
                          ) : factor.type === 'risk' ? (
                            <ShieldAlert className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                          ) : (
                            <Info className="w-3.5 h-3.5" style={{ color: '#5B8DEE' }} />
                          )}
                        </span>
                        <span className="text-[11px] leading-relaxed" style={{ color: '#4a4a6a' }}>
                          {t(factor.he, factor.en)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

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
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
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

        {/* ── Urban Renewal Premium Analysis Section ── */}
        {calc && (
          <div className="mx-auto max-w-4xl mt-6" style={{ ...glassCard, padding: 0 }}>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4.5 h-4.5" style={{ color: '#5B8DEE' }} />
                <h3 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
                  {t('ניתוח פרמיית התחדשות עירונית', 'Renewal Premium Analysis')}
                </h3>
              </div>
              <p className="text-[11px] mb-5" style={{ color: '#6b7280' }}>
                {t(
                  'בדוק האם הפרמיה שמבקשים על דירה בפרויקט התחדשות עירונית מוצדקת ביחס לשווי שוק של דירה דומה ללא התחדשות.',
                  'Check whether the premium being asked for an urban renewal project apartment is justified compared to a similar apartment without renewal.'
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                {/* Market Value Input */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {t('שווי שוק דירה דומה (ללא התחדשות)', 'Similar Apt Market Value (without renewal)')} ({'\u20AA'})
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder={t('לדוגמה: 1,800,000', 'e.g. 1,800,000')}
                    value={marketValueRaw}
                    onChange={handleInput(setMarketValueRaw)}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Asking Price (read-only, from above) */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4a4a6a' }}>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      {t('מחיר מבוקש (מהמחשבון למעלה)', 'Asking Price (from calculator above)')} ({'\u20AA'})
                    </span>
                  </label>
                  <div
                    style={{
                      ...inputStyle,
                      background: 'rgba(0,0,0,0.03)',
                      cursor: 'default',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {priceRaw || '—'}
                  </div>
                </div>
              </div>

              {/* Premium Results */}
              {renewalPremium && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Premium Amount */}
                  <div
                    className="text-center p-5 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                      {t('פרמיית התחדשות', 'Renewal Premium')}
                    </div>
                    <div
                      className="text-2xl sm:text-3xl font-black"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: renewalPremium.premium >= 0 ? '#1a1a2e' : '#16a34a',
                      }}
                    >
                      {renewalPremium.premium >= 0 ? '+' : ''}{'\u20AA'}{fmtILS(Math.round(renewalPremium.premium))}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                      {t('מחיר מבוקש פחות שווי שוק', 'Asking price minus market value')}
                    </div>
                  </div>

                  {/* Premium Percentage */}
                  <div
                    className="text-center p-5 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                      {t('אחוז פרמיה', 'Premium Percentage')}
                    </div>
                    <div
                      className="text-2xl sm:text-3xl font-black"
                      style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: renewalPremium.percentage <= 10 ? '#16a34a'
                          : renewalPremium.percentage <= 25 ? '#ca8a04'
                            : '#dc2626',
                      }}
                    >
                      {renewalPremium.percentage > 0 ? '+' : ''}{renewalPremium.percentage.toFixed(1)}%
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                      {t('פרמיה / שווי שוק', 'Premium / market value')}
                    </div>
                  </div>

                  {/* Verdict */}
                  <div
                    className="text-center p-5 rounded-xl"
                    style={{
                      background: renewalPremium.percentage <= 10
                        ? 'rgba(22,163,74,0.05)'
                        : renewalPremium.percentage <= 25
                          ? 'rgba(202,138,4,0.05)'
                          : 'rgba(220,38,38,0.05)',
                      border: `1px solid ${renewalPremium.percentage <= 10
                        ? 'rgba(22,163,74,0.2)'
                        : renewalPremium.percentage <= 25
                          ? 'rgba(202,138,4,0.2)'
                          : 'rgba(220,38,38,0.2)'
                        }`,
                    }}
                  >
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                      {t('הערכה', 'Verdict')}
                    </div>
                    <div className="mb-2">
                      {renewalPremium.percentage <= 0 ? (
                        <Badge color="green">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('מחיר מתחת לשוק', 'Below Market')}
                        </Badge>
                      ) : renewalPremium.percentage <= 10 ? (
                        <Badge color="green">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('פרמיה מוצדקת', 'Justified Premium')}
                        </Badge>
                      ) : renewalPremium.percentage <= 25 ? (
                        <Badge color="gold">
                          <AlertTriangle className="w-3 h-3" />
                          {t('פרמיה גבולית', 'Borderline Premium')}
                        </Badge>
                      ) : (
                        <Badge color="red">
                          <ShieldAlert className="w-3 h-3" />
                          {t('פרמיה מוגזמת', 'Excessive Premium')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: '#6b7280' }}>
                      {renewalPremium.percentage <= 0
                        ? t(
                          'המחיר נמוך משווי השוק — עסקה אטרקטיבית, בדוק את הסיבה.',
                          'Price is below market value — attractive deal, investigate the reason.'
                        )
                        : renewalPremium.percentage <= 10
                          ? t(
                            'פרמיה של עד 10% נחשבת סבירה בפרויקטי התחדשות עירונית, בשל המפרט הגבוה והאחריות.',
                            'A premium up to 10% is considered reasonable for renewal projects, due to higher specs and warranty.'
                          )
                          : renewalPremium.percentage <= 25
                            ? t(
                              'פרמיה של 10-25% דורשת בדיקה — האם המפרט, המיקום או ערך השוק מצדיקים?',
                              'A 10-25% premium requires scrutiny — do specs, location, or market value justify it?'
                            )
                            : t(
                              'פרמיה מעל 25% היא חריגה. מומלץ לבדוק חלופות ולבצע שמאות עצמאית.',
                              'A premium above 25% is exceptional. Check alternatives and get an independent appraisal.'
                            )}
                    </p>
                  </div>
                </div>
              )}

              {/* Empty state for renewal premium */}
              {!renewalPremium && (
                <div
                  className="p-5 rounded-xl text-center"
                  style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.1)' }}
                >
                  <p className="text-[11px]" style={{ color: '#9ca3af' }}>
                    {t(
                      'הזן שווי שוק של דירה דומה כדי לחשב את פרמיית ההתחדשות.',
                      'Enter the market value of a similar apartment to calculate the renewal premium.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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
