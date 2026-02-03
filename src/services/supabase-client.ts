/**
 * Supabase Client Configuration
 * Manages connection to Supabase for data persistence
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// ─────────────────────────────────────────────────────────────
// Database Types (generated from Supabase schema)
// ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_type: 'homeowner' | 'developer' | 'admin';
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPlanDocument {
  id: string;
  plan_number: string;
  plan_name: string;
  document_type: 'takkanon' | 'tashrit' | 'plan_map' | 'appendix' | 'other';
  city: string;
  neighborhood: string | null;
  file_name: string;
  file_size: number | null;
  file_url: string | null;
  storage_path: string | null;
  page_count: number | null;
  parse_status: 'pending' | 'processing' | 'completed' | 'failed';
  parse_confidence: number | null;
  parsed_at: string | null;
  uploaded_by: string | null;
  upload_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbZoningPlan {
  id: string;
  plan_number: string;
  plan_name: string;
  city: string;
  neighborhood: string | null;
  approval_date: string | null;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  zoning_type: string;
  main_building_percent: number;
  service_building_percent: number;
  total_building_percent: number;
  max_floors: number;
  max_height: number;
  max_units: number;
  basement_allowed: boolean;
  basement_percent: number;
  rooftop_percent: number;
  land_coverage_percent: number;
  front_setback: number;
  rear_setback: number;
  side_setback: number;
  min_parking_spaces: number;
  min_green_area_percent: number;
  max_land_coverage: number;
  tma_eligible: boolean;
  tma_type: '38/1' | '38/2' | 'none' | null;
  tma_additional_floors: number;
  tma_additional_percent: number;
  citations: unknown; // jsonb
  source_document_id: string | null;
  source_document_name: string | null;
  source_document_url: string | null;
  ai_confidence: number | null;
  ai_model: string | null;
  parsed_by_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAddressMapping {
  id: string;
  address: string;
  city: string;
  neighborhood: string | null;
  block: string;
  parcel: string;
  sub_parcel: string | null;
  zoning_plan_id: string | null;
  plot_size: number;
  plot_width: number;
  plot_depth: number;
  existing_floors: number;
  existing_area: number;
  existing_units: number;
  year_built: number | null;
  avg_price_per_sqm: number;
  construction_cost_per_sqm: number;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAnalysisResult {
  id: string;
  user_id: string | null;
  user_type: 'homeowner' | 'developer';
  address: string;
  block: string | null;
  parcel: string | null;
  plot_size: number | null;
  current_built_area: number | null;
  current_floors: number | null;
  zoning_plan_id: string | null;
  plan_number: string | null;
  max_buildable_area: number | null;
  additional_buildable_area: number | null;
  tma38_eligible: boolean;
  tma38_additional_area: number;
  urban_renewal_eligible: boolean;
  urban_renewal_additional_area: number;
  estimated_value: number | null;
  estimated_cost: number | null;
  estimated_profit: number | null;
  roi_percent: number | null;
  full_report: unknown; // jsonb
  audit_trail: unknown; // jsonb
  analysis_date: string;
  analysis_duration_seconds: number | null;
  confidence_score: number | null;
  created_at: string;
}
