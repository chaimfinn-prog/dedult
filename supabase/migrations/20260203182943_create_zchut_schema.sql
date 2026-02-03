/*
  # Zchut.AI Database Schema
  
  ## תיאור
  סכמת בסיס נתונים מלאה למערכת Zchut.AI - מערכת ניתוח תב"עות מבוססת AI
  
  ## טבלאות עיקריות
  
  1. **zoning_plans** - תב"עות שנסרקו ונותחו
     - מאחסן תקנוני תב"ע מלאים עם זכויות בנייה
     - כולל קישור למסמכי PDF המקוריים
     - נתונים מחולצים על ידי Claude AI
  
  2. **plan_documents** - מסמכי PDF של תב"עות
     - אחסון metadata של קבצי PDF
     - קישור לאחסון בסיסי (Supabase Storage או S3)
     - מעקב אחר סטטוס parsing
  
  3. **address_mappings** - מיפוי כתובות לתב"עות
     - חיבור בין כתובות פיזיות לתוכניות מפורטות
     - נתוני גוש/חלקה ממפ"י
     - מידות מגרש ונתונים פיזיים
  
  4. **analysis_results** - תוצאות ניתוחים שבוצעו
     - שמירת דו"חות מלאים למשתמשים
     - מעקב אחר חישובים וממצאים
     - היסטוריה של ניתוחים
  
  5. **users** - משתמשי המערכת
     - בעלי נכסים ויזמים
     - העדפות ומסלול (homeowner/developer)
  
  ## אבטחה
  - RLS (Row Level Security) מופעל על כל הטבלאות
  - משתמשים רואים רק את הניתוחים שלהם
  - אדמינים רואים הכל
*/

-- ========================================
-- טבלת משתמשים
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  user_type text NOT NULL DEFAULT 'homeowner' CHECK (user_type IN ('homeowner', 'developer', 'admin')),
  company_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========================================
-- מסמכי תב"ע (PDFs)
-- ========================================
CREATE TABLE IF NOT EXISTS plan_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number text NOT NULL,
  plan_name text NOT NULL,
  document_type text NOT NULL DEFAULT 'takkanon' CHECK (document_type IN ('takkanon', 'tashrit', 'plan_map', 'appendix', 'other')),
  city text NOT NULL DEFAULT 'רעננה',
  neighborhood text,
  
  -- קובץ PDF
  file_name text NOT NULL,
  file_size bigint,
  file_url text,
  storage_path text,
  page_count int,
  
  -- סטטוס parsing
  parse_status text DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
  parse_confidence int CHECK (parse_confidence >= 0 AND parse_confidence <= 100),
  parsed_at timestamptz,
  
  -- מטא-דאטה
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  upload_date timestamptz DEFAULT now(),
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE plan_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read plan documents"
  ON plan_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert plan documents"
  ON plan_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update plan documents"
  ON plan_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete plan documents"
  ON plan_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- ========================================
-- תב"עות מפורטות (Parsed Plans)
-- ========================================
CREATE TABLE IF NOT EXISTS zoning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number text UNIQUE NOT NULL,
  plan_name text NOT NULL,
  city text NOT NULL DEFAULT 'רעננה',
  neighborhood text,
  
  -- סטטוס תכנוני
  approval_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'cancelled')),
  zoning_type text NOT NULL CHECK (zoning_type IN ('residential_a', 'residential_b', 'residential_c', 'commercial', 'mixed_use', 'industrial', 'public', 'agricultural')),
  
  -- זכויות בנייה - עיקרי
  main_building_percent numeric(6,2) NOT NULL DEFAULT 0,
  service_building_percent numeric(6,2) NOT NULL DEFAULT 0,
  total_building_percent numeric(6,2) NOT NULL DEFAULT 0,
  
  -- מגבלות גובה וצפיפות
  max_floors int NOT NULL DEFAULT 0,
  max_height numeric(6,2) NOT NULL DEFAULT 0,
  max_units int NOT NULL DEFAULT 0,
  
  -- מרתף וגג
  basement_allowed boolean DEFAULT true,
  basement_percent numeric(6,2) DEFAULT 0,
  rooftop_percent numeric(6,2) DEFAULT 0,
  
  -- תכסית
  land_coverage_percent numeric(6,2) NOT NULL DEFAULT 0,
  
  -- קווי בניין (נסיגות)
  front_setback numeric(6,2) DEFAULT 0,
  rear_setback numeric(6,2) DEFAULT 0,
  side_setback numeric(6,2) DEFAULT 0,
  
  -- חניות ושטח ירוק
  min_parking_spaces numeric(4,2) DEFAULT 1.5,
  min_green_area_percent numeric(6,2) DEFAULT 30,
  max_land_coverage numeric(6,2) DEFAULT 40,
  
  -- תמ"א 38
  tma_eligible boolean DEFAULT false,
  tma_type text CHECK (tma_type IN ('38/1', '38/2', 'none', null)),
  tma_additional_floors numeric(4,1) DEFAULT 0,
  tma_additional_percent numeric(6,2) DEFAULT 0,
  
  -- הוכחות (Citations) - JSON array
  citations jsonb DEFAULT '[]'::jsonb,
  
  -- קישור למסמך מקור
  source_document_id uuid REFERENCES plan_documents(id) ON DELETE SET NULL,
  source_document_name text,
  source_document_url text,
  
  -- AI parsing metadata
  ai_confidence int CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_model text DEFAULT 'claude-3-5-sonnet',
  parsed_by_ai boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE zoning_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read zoning plans"
  ON zoning_plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage zoning plans"
  ON zoning_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- ========================================
-- מיפוי כתובות לתב"עות
-- ========================================
CREATE TABLE IF NOT EXISTS address_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  city text NOT NULL DEFAULT 'רעננה',
  neighborhood text,
  
  -- נתוני מפ"י (GIS)
  block text NOT NULL,
  parcel text NOT NULL,
  sub_parcel text,
  
  -- קישור לתב"ע
  zoning_plan_id uuid REFERENCES zoning_plans(id) ON DELETE CASCADE,
  
  -- נתונים פיזיים
  plot_size numeric(10,2) NOT NULL DEFAULT 0,
  plot_width numeric(6,2) DEFAULT 0,
  plot_depth numeric(6,2) DEFAULT 0,
  
  -- מבנה קיים
  existing_floors int DEFAULT 0,
  existing_area numeric(10,2) DEFAULT 0,
  existing_units int DEFAULT 0,
  year_built int,
  
  -- נתוני שוק
  avg_price_per_sqm numeric(10,2) DEFAULT 35000,
  construction_cost_per_sqm numeric(10,2) DEFAULT 8000,
  
  -- מטא-דאטה
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE address_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read address mappings"
  ON address_mappings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage address mappings"
  ON address_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- ========================================
-- תוצאות ניתוחים
-- ========================================
CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- משתמש
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user_type text DEFAULT 'homeowner' CHECK (user_type IN ('homeowner', 'developer')),
  
  -- נכס שנותח
  address text NOT NULL,
  block text,
  parcel text,
  plot_size numeric(10,2),
  current_built_area numeric(10,2),
  current_floors int,
  
  -- תב"ע שנמצאה
  zoning_plan_id uuid REFERENCES zoning_plans(id) ON DELETE SET NULL,
  plan_number text,
  
  -- תוצאות חישוב
  max_buildable_area numeric(10,2),
  additional_buildable_area numeric(10,2),
  
  -- זכאויות מיוחדות
  tma38_eligible boolean DEFAULT false,
  tma38_additional_area numeric(10,2) DEFAULT 0,
  urban_renewal_eligible boolean DEFAULT false,
  urban_renewal_additional_area numeric(10,2) DEFAULT 0,
  
  -- פיננסי
  estimated_value numeric(12,2),
  estimated_cost numeric(12,2),
  estimated_profit numeric(12,2),
  roi_percent numeric(6,2),
  
  -- דו"ח מלא (JSON)
  full_report jsonb,
  
  -- audit trail
  audit_trail jsonb DEFAULT '[]'::jsonb,
  
  -- מטא-דאטה
  analysis_date timestamptz DEFAULT now(),
  analysis_duration_seconds int,
  confidence_score int CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analysis results"
  ON analysis_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis results"
  ON analysis_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all analysis results"
  ON analysis_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- ========================================
-- אינדקסים לביצועים
-- ========================================
CREATE INDEX IF NOT EXISTS idx_plan_documents_plan_number ON plan_documents(plan_number);
CREATE INDEX IF NOT EXISTS idx_plan_documents_city ON plan_documents(city);
CREATE INDEX IF NOT EXISTS idx_plan_documents_parse_status ON plan_documents(parse_status);

CREATE INDEX IF NOT EXISTS idx_zoning_plans_plan_number ON zoning_plans(plan_number);
CREATE INDEX IF NOT EXISTS idx_zoning_plans_city ON zoning_plans(city);
CREATE INDEX IF NOT EXISTS idx_zoning_plans_status ON zoning_plans(status);

CREATE INDEX IF NOT EXISTS idx_address_mappings_address ON address_mappings(address);
CREATE INDEX IF NOT EXISTS idx_address_mappings_block_parcel ON address_mappings(block, parcel);
CREATE INDEX IF NOT EXISTS idx_address_mappings_zoning_plan ON address_mappings(zoning_plan_id);

CREATE INDEX IF NOT EXISTS idx_analysis_results_user ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_date ON analysis_results(analysis_date DESC);

-- ========================================
-- Functions & Triggers
-- ========================================

-- עדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_plan_documents_updated_at') THEN
    CREATE TRIGGER update_plan_documents_updated_at
      BEFORE UPDATE ON plan_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_zoning_plans_updated_at') THEN
    CREATE TRIGGER update_zoning_plans_updated_at
      BEFORE UPDATE ON zoning_plans
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_address_mappings_updated_at') THEN
    CREATE TRIGGER update_address_mappings_updated_at
      BEFORE UPDATE ON address_mappings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;