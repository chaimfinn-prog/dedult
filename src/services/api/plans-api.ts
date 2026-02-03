/**
 * Zoning Plans API Service
 * CRUD operations for zoning plans with Supabase integration
 */

import { supabase, type DbZoningPlan, type DbAddressMapping } from '../supabase-client';
import type { ZoningPlan } from '@/types';

// ─────────────────────────────────────────────────────────────
// GET Operations
// ─────────────────────────────────────────────────────────────

/**
 * Get all zoning plans from database
 */
export async function getZoningPlans(): Promise<ZoningPlan[]> {
  const { data, error } = await supabase
    .from('zoning_plans')
    .select('*')
    .eq('status', 'active')
    .order('plan_number');

  if (error) {
    console.error('[Plans API] Failed to fetch plans:', error);
    return [];
  }

  return (data || []).map(dbToZoningPlan);
}

/**
 * Get plan by plan number
 */
export async function getZoningPlanByNumber(planNumber: string): Promise<ZoningPlan | null> {
  const { data, error } = await supabase
    .from('zoning_plans')
    .select('*')
    .eq('plan_number', planNumber)
    .maybeSingle();

  if (error) {
    console.error('[Plans API] Failed to fetch plan:', error);
    return null;
  }

  return data ? dbToZoningPlan(data) : null;
}

/**
 * Get plan by ID
 */
export async function getZoningPlanById(id: string): Promise<ZoningPlan | null> {
  const { data, error } = await supabase
    .from('zoning_plans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[Plans API] Failed to fetch plan:', error);
    return null;
  }

  return data ? dbToZoningPlan(data) : null;
}

/**
 * Search plans by city or neighborhood
 */
export async function searchZoningPlans(query: string): Promise<ZoningPlan[]> {
  const { data, error } = await supabase
    .from('zoning_plans')
    .select('*')
    .or(`city.ilike.%${query}%,neighborhood.ilike.%${query}%,plan_number.ilike.%${query}%`)
    .eq('status', 'active')
    .order('plan_number')
    .limit(20);

  if (error) {
    console.error('[Plans API] Search failed:', error);
    return [];
  }

  return (data || []).map(dbToZoningPlan);
}

// ─────────────────────────────────────────────────────────────
// Address Mappings
// ─────────────────────────────────────────────────────────────

/**
 * Get all addresses
 */
export async function getAddresses(): Promise<Array<{
  address: string;
  block: string;
  parcel: string;
  planNumber: string;
}>> {
  const { data, error } = await supabase
    .from('address_mappings')
    .select(`
      address,
      block,
      parcel,
      zoning_plans!inner(plan_number)
    `)
    .order('address');

  if (error) {
    console.error('[Plans API] Failed to fetch addresses:', error);
    return [];
  }

  return (data || []).map((item) => ({
    address: item.address,
    block: item.block,
    parcel: item.parcel,
    planNumber: (item.zoning_plans as unknown as { plan_number: string }).plan_number,
  }));
}

/**
 * Get address mapping by address
 */
export async function getAddressByAddress(address: string) {
  const { data, error } = await supabase
    .from('address_mappings')
    .select('*')
    .ilike('address', `%${address}%`)
    .maybeSingle();

  if (error) {
    console.error('[Plans API] Failed to fetch address:', error);
    return null;
  }

  return data;
}

/**
 * Get address mapping by block/parcel
 */
export async function getAddressByBlockParcel(block: string, parcel: string) {
  const { data, error } = await supabase
    .from('address_mappings')
    .select('*')
    .eq('block', block)
    .eq('parcel', parcel)
    .maybeSingle();

  if (error) {
    console.error('[Plans API] Failed to fetch address:', error);
    return null;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// CREATE/UPDATE Operations
// ─────────────────────────────────────────────────────────────

/**
 * Save zoning plan to database
 */
export async function saveZoningPlan(plan: ZoningPlan): Promise<{ success: boolean; error?: string }> {
  const dbPlan = zoningPlanToDb(plan);

  const { error } = await supabase
    .from('zoning_plans')
    .upsert(dbPlan, {
      onConflict: 'plan_number',
    });

  if (error) {
    console.error('[Plans API] Failed to save plan:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Save address mapping
 */
export async function saveAddressMapping(mapping: Partial<DbAddressMapping>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('address_mappings')
    .upsert(mapping, {
      onConflict: 'address',
    });

  if (error) {
    console.error('[Plans API] Failed to save address:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Type Converters
// ─────────────────────────────────────────────────────────────

/**
 * Convert DB row to ZoningPlan type
 */
function dbToZoningPlan(db: DbZoningPlan): ZoningPlan {
  return {
    id: db.id,
    planNumber: db.plan_number,
    name: db.plan_name,
    city: db.city,
    neighborhood: db.neighborhood || '',
    approvalDate: db.approval_date || '',
    status: db.status as 'active' | 'pending' | 'expired',
    zoningType: db.zoning_type as ZoningPlan['zoningType'],
    sourceDocument: {
      name: db.source_document_name || '',
      url: db.source_document_url || '',
      lastUpdated: db.updated_at,
    },
    buildingRights: {
      mainBuildingPercent: Number(db.main_building_percent),
      serviceBuildingPercent: Number(db.service_building_percent),
      totalBuildingPercent: Number(db.total_building_percent),
      maxFloors: db.max_floors,
      maxHeight: Number(db.max_height),
      maxUnits: db.max_units,
      basementAllowed: db.basement_allowed,
      basementPercent: Number(db.basement_percent),
      rooftopPercent: Number(db.rooftop_percent),
      landCoveragePercent: Number(db.land_coverage_percent),
      floorAllocations: [],
      citations: (db.citations as []) || [],
    },
    restrictions: {
      frontSetback: Number(db.front_setback),
      rearSetback: Number(db.rear_setback),
      sideSetback: Number(db.side_setback),
      minParkingSpaces: Number(db.min_parking_spaces),
      minGreenAreaPercent: Number(db.min_green_area_percent),
      maxLandCoverage: Number(db.max_land_coverage),
    },
    tmaRights: db.tma_eligible ? {
      eligible: true,
      tmaType: db.tma_type as '38/1' | '38/2' || 'none',
      additionalFloors: Number(db.tma_additional_floors),
      additionalBuildingPercent: Number(db.tma_additional_percent),
      seismicUpgradeRequired: true,
      notes: '',
    } : undefined,
  };
}

/**
 * Convert ZoningPlan to DB row
 */
function zoningPlanToDb(plan: ZoningPlan): Partial<DbZoningPlan> {
  return {
    plan_number: plan.planNumber,
    plan_name: plan.name,
    city: plan.city,
    neighborhood: plan.neighborhood || null,
    approval_date: plan.approvalDate || null,
    status: plan.status,
    zoning_type: plan.zoningType,
    main_building_percent: plan.buildingRights.mainBuildingPercent,
    service_building_percent: plan.buildingRights.serviceBuildingPercent,
    total_building_percent: plan.buildingRights.totalBuildingPercent,
    max_floors: plan.buildingRights.maxFloors,
    max_height: plan.buildingRights.maxHeight,
    max_units: plan.buildingRights.maxUnits,
    basement_allowed: plan.buildingRights.basementAllowed,
    basement_percent: plan.buildingRights.basementPercent,
    rooftop_percent: plan.buildingRights.rooftopPercent,
    land_coverage_percent: plan.buildingRights.landCoveragePercent,
    front_setback: plan.restrictions.frontSetback,
    rear_setback: plan.restrictions.rearSetback,
    side_setback: plan.restrictions.sideSetback,
    min_parking_spaces: plan.restrictions.minParkingSpaces,
    min_green_area_percent: plan.restrictions.minGreenAreaPercent,
    max_land_coverage: plan.restrictions.maxLandCoverage,
    tma_eligible: plan.tmaRights?.eligible || false,
    tma_type: plan.tmaRights?.tmaType || null,
    tma_additional_floors: plan.tmaRights?.additionalFloors || 0,
    tma_additional_percent: plan.tmaRights?.additionalBuildingPercent || 0,
    citations: plan.buildingRights.citations as unknown,
    source_document_name: plan.sourceDocument.name,
    source_document_url: plan.sourceDocument.url,
  };
}
