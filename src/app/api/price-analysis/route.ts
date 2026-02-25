import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/price-analysis
 * Accepts property data + alternatives and returns economic analysis.
 * Calculates construction cost, betterment levy, net profit, yield for each alternative.
 */

interface Alternative {
  name: string;
  residentialSqm: number;
  publicBuiltSqm: number;
  serviceSqm: number;
  totalSqm: number;
  estimatedUnits: number | null;
  blocked: boolean;
}

interface AnalysisResult {
  name: string;
  grossRevenue: number;
  constructionCost: number;
  bettermentLevy: number;
  landValue: number;
  totalCost: number;
  netProfit: number;
  yieldPct: number;
  profitPerUnit: number | null;
  isBestValue: boolean;
}

const DEFAULT_CONSTRUCTION_COST = 12000; // ₪/sqm
const DEFAULT_BETTERMENT_LEVY_PCT = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      alternatives,
      pricePerSqm,
      landValue = 0,
      constructionCostPerSqm = DEFAULT_CONSTRUCTION_COST,
      bettermentLevyPct = DEFAULT_BETTERMENT_LEVY_PCT,
    } = body as {
      alternatives: Alternative[];
      pricePerSqm: number;
      landValue?: number;
      constructionCostPerSqm?: number;
      bettermentLevyPct?: number;
    };

    if (!alternatives || !Array.isArray(alternatives) || alternatives.length === 0) {
      return NextResponse.json(
        { error: 'Must provide alternatives array' },
        { status: 400 }
      );
    }

    if (!pricePerSqm || pricePerSqm <= 0) {
      return NextResponse.json(
        { error: 'Must provide positive pricePerSqm' },
        { status: 400 }
      );
    }

    const activeAlts = alternatives.filter(a => !a.blocked && a.totalSqm > 0);

    const results: AnalysisResult[] = activeAlts.map(alt => {
      const grossRevenue = alt.residentialSqm * pricePerSqm;
      const constructionCost = alt.totalSqm * constructionCostPerSqm;
      const addedValue = grossRevenue - landValue;
      const bettermentLevy = Math.max(0, addedValue * (bettermentLevyPct / 100));
      const totalCost = constructionCost + bettermentLevy + landValue;
      const netProfit = grossRevenue - totalCost;
      const yieldPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
      const profitPerUnit = alt.estimatedUnits && alt.estimatedUnits > 0
        ? netProfit / alt.estimatedUnits
        : null;

      return {
        name: alt.name,
        grossRevenue: Math.round(grossRevenue),
        constructionCost: Math.round(constructionCost),
        bettermentLevy: Math.round(bettermentLevy),
        landValue: Math.round(landValue),
        totalCost: Math.round(totalCost),
        netProfit: Math.round(netProfit),
        yieldPct: Math.round(yieldPct * 10) / 10,
        profitPerUnit: profitPerUnit !== null ? Math.round(profitPerUnit) : null,
        isBestValue: false,
      };
    });

    // Mark best value
    if (results.length > 0) {
      const bestIdx = results.reduce((best, curr, idx) =>
        curr.netProfit > results[best].netProfit ? idx : best, 0);
      results[bestIdx].isBestValue = true;
    }

    return NextResponse.json({
      success: true,
      analyses: results,
      params: {
        pricePerSqm,
        landValue,
        constructionCostPerSqm,
        bettermentLevyPct,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
