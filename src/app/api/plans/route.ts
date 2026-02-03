import { NextRequest, NextResponse } from 'next/server';
import { getApprovedPlans } from '@/services/govil-api';
import { findPlanById, findPlanByAddress, addressMappings } from '@/data/zoning-plans';

/**
 * API Route: /api/plans
 * Finds approved detailed plans (תב"עות מפורטות) for a parcel
 * Uses iplan API with local DB fallback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const block = searchParams.get('block');
  const parcel = searchParams.get('parcel');
  const address = searchParams.get('address');
  const x = searchParams.get('x');
  const y = searchParams.get('y');

  if (!block && !address) {
    return NextResponse.json(
      { error: 'Missing block/parcel or address' },
      { status: 400 }
    );
  }

  // Try real iplan API first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let plans: any[] = [];
  try {
    if (block && parcel) {
      plans = await getApprovedPlans(
        block,
        parcel,
        x ? parseFloat(x) : undefined,
        y ? parseFloat(y) : undefined
      );
    }
  } catch {
    console.log('[API/plans] iplan API unavailable, falling back to local DB');
  }

  // Fallback to local database
  if (plans.length === 0) {
    let mapping = null;
    if (address) {
      mapping = findPlanByAddress(address);
    } else if (block && parcel) {
      mapping = addressMappings.find(
        (m) => m.block === block && m.parcel === parcel
      );
    }

    if (mapping) {
      const plan = findPlanById(mapping.planId);
      if (plan) {
        plans = [
          {
            planId: plan.id,
            planNumber: plan.planNumber,
            planName: plan.name,
            planType: 'תכנית מפורטת',
            status: plan.status === 'active' ? 'מאושרת' : plan.status,
            approvalDate: plan.approvalDate,
            landUse: plan.zoningType,
            mainBuildingPercent: plan.buildingRights.mainBuildingPercent,
            serviceBuildingPercent: plan.buildingRights.serviceBuildingPercent,
            maxFloors: plan.buildingRights.maxFloors,
            maxHeight: plan.buildingRights.maxHeight,
            documentUrl: plan.sourceDocument.url || '',
            municipality: plan.city,
            source: 'local_db',
          },
        ];
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: plans,
    count: plans.length,
    note: plans.length === 0
      ? 'לא נמצאו תוכניות מפורטות מאושרות'
      : `נמצאו ${plans.length} תוכניות מפורטות`,
    timestamp: new Date().toISOString(),
  });
}
