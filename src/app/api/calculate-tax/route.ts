import { NextRequest, NextResponse } from 'next/server';
import { calcPurchaseTax, calcAcquisitionCosts } from '@/lib/tax-calculations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { price, is_single_apartment, include_costs } = body;

    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { status: 'CANNOT_COMPUTE', reason: 'מחיר חייב להיות מספר חיובי' },
        { status: 400 },
      );
    }

    if (typeof is_single_apartment !== 'boolean') {
      return NextResponse.json(
        { status: 'CANNOT_COMPUTE', reason: 'חובה לציין אם מדובר בדירה יחידה (is_single_apartment: true/false)' },
        { status: 400 },
      );
    }

    const taxResult = calcPurchaseTax(price, is_single_apartment);

    if (include_costs) {
      const costsResult = calcAcquisitionCosts(price, is_single_apartment);
      if (costsResult.status !== 'OK') {
        return NextResponse.json(costsResult, { status: 400 });
      }

      return NextResponse.json({
        status: 'OK',
        confidence: costsResult.confidence,
        data: {
          purchase_tax: {
            total: taxResult.total,
            brackets: taxResult.brackets,
            effective_rate_pct: taxResult.effectiveRatePct,
          },
          agent_fee: costsResult.data.agentFee,
          attorney_estimate: `${costsResult.data.attorneyEstimate.min}-${costsResult.data.attorneyEstimate.max}`,
          mortgage_registration: costsResult.data.mortgageRegistration,
          total_acquisition_cost: costsResult.data.totalAcquisitionCost,
          notes: costsResult.data.notes,
        },
        warnings: costsResult.warnings,
      });
    }

    return NextResponse.json({
      status: 'OK',
      confidence: 'HIGH',
      data: {
        purchase_tax: {
          total: taxResult.total,
          brackets: taxResult.brackets,
          effective_rate_pct: taxResult.effectiveRatePct,
        },
      },
      warnings: [],
    });
  } catch {
    return NextResponse.json(
      { status: 'CANNOT_COMPUTE', reason: 'שגיאה בעיבוד הבקשה' },
      { status: 500 },
    );
  }
}
