/**
 * Analysis Results API Service
 * Save and retrieve analysis results from Supabase
 */

import { supabase, type DbAnalysisResult } from '../supabase-client';
import type { AnalysisResult } from '@/types';

/**
 * Save analysis result to database
 */
export async function saveAnalysisResult(
  result: AnalysisResult,
  userId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const dbResult: Partial<DbAnalysisResult> = {
    user_id: userId || null,
    user_type: 'homeowner', // Can be determined from context
    address: result.property.address,
    block: result.property.block,
    parcel: result.property.parcel,
    plot_size: result.property.plotSize,
    current_built_area: result.property.currentBuiltArea,
    current_floors: result.property.currentFloors,
    plan_number: result.zoningPlan.planNumber,
    max_buildable_area: result.calculations.maxBuildableArea,
    additional_buildable_area: result.calculations.additionalBuildableArea,
    tma38_eligible: result.urbanRenewalEligibility.tma38Eligible,
    tma38_additional_area: result.urbanRenewalEligibility.tmaAdditionalArea,
    urban_renewal_eligible: result.urbanRenewalEligibility.urbanRenewalPlanEligible,
    urban_renewal_additional_area: result.urbanRenewalEligibility.urbanRenewalAdditionalArea,
    estimated_value: result.financial.additionalValueEstimate,
    estimated_cost: result.financial.estimatedConstructionCost,
    estimated_profit: result.financial.estimatedProfit,
    roi_percent: result.financial.estimatedProfit > 0
      ? Math.round((result.financial.estimatedProfit / result.financial.estimatedConstructionCost) * 100)
      : 0,
    full_report: result as unknown,
    audit_trail: result.auditTrail as unknown || [],
    analysis_date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('analysis_results')
    .insert(dbResult)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[Analysis API] Failed to save result:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}

/**
 * Get user's analysis history
 */
export async function getUserAnalyses(userId: string): Promise<DbAnalysisResult[]> {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('user_id', userId)
    .order('analysis_date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Analysis API] Failed to fetch analyses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(id: string): Promise<AnalysisResult | null> {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[Analysis API] Failed to fetch analysis:', error);
    return null;
  }

  if (!data || !data.full_report) return null;

  return data.full_report as unknown as AnalysisResult;
}

/**
 * Get recent analyses (for dashboard/stats)
 */
export async function getRecentAnalyses(limit: number = 10): Promise<{
  address: string;
  date: string;
  additional_area: number;
  profit: number;
}[]> {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('address, analysis_date, additional_buildable_area, estimated_profit')
    .order('analysis_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Analysis API] Failed to fetch recent analyses:', error);
    return [];
  }

  return (data || []).map(item => ({
    address: item.address,
    date: item.analysis_date,
    additional_area: item.additional_buildable_area || 0,
    profit: item.estimated_profit || 0,
  }));
}
