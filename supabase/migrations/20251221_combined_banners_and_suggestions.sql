-- ========================================
-- COMBINED MIGRATION: Banners & Image Suggestions Tables
-- Date: 2025-12-21
-- ========================================

-- ========================================
-- 1. CREATE BANNERS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for banners
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON public.banners(created_at DESC);

-- Enable Row Level Security for banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banners
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners"
  ON public.banners
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view all banners" ON public.banners;
CREATE POLICY "Authenticated users can view all banners"
  ON public.banners
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert banners" ON public.banners;
CREATE POLICY "Admins can insert banners"
  ON public.banners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
CREATE POLICY "Admins can update banners"
  ON public.banners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;
CREATE POLICY "Admins can delete banners"
  ON public.banners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create trigger function for banners
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS banners_updated_at_trigger ON public.banners;
CREATE TRIGGER banners_updated_at_trigger
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION update_banners_updated_at();

-- Insert default banners
INSERT INTO public.banners (image_url, title, subtitle, button_text, button_link, link_url, is_active)
VALUES 
  (
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Su53G51ysIhrgtDSCWxEtmb5YHfRhN.png',
    'IMAGE GENERATOR',
    'Create the perfect image in seconds',
    'GENERATE NOW',
    '/generate',
    '/generate',
    true
  ),
  (
    '/placeholder.svg?height=244&width=1222',
    'PREMIUM FEATURES',
    'Unlock exclusive content with our premium plan',
    'UPGRADE NOW',
    '/premium',
    '/premium',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. CREATE IMAGE_SUGGESTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.image_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for image_suggestions
CREATE INDEX IF NOT EXISTS idx_image_suggestions_category ON public.image_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_image_suggestions_is_active ON public.image_suggestions(is_active);
CREATE INDEX IF NOT EXISTS idx_image_suggestions_created_at ON public.image_suggestions(created_at DESC);

-- Enable Row Level Security for image_suggestions
ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_suggestions
DROP POLICY IF EXISTS "Public can view active image suggestions" ON public.image_suggestions;
CREATE POLICY "Public can view active image suggestions"
  ON public.image_suggestions
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view all image suggestions" ON public.image_suggestions;
CREATE POLICY "Authenticated users can view all image suggestions"
  ON public.image_suggestions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert image suggestions" ON public.image_suggestions;
CREATE POLICY "Admins can insert image suggestions"
  ON public.image_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update image suggestions" ON public.image_suggestions;
CREATE POLICY "Admins can update image suggestions"
  ON public.image_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete image suggestions" ON public.image_suggestions;
CREATE POLICY "Admins can delete image suggestions"
  ON public.image_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create trigger function for image_suggestions
CREATE OR REPLACE FUNCTION update_image_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS image_suggestions_updated_at_trigger ON public.image_suggestions;
CREATE TRIGGER image_suggestions_updated_at_trigger
  BEFORE UPDATE ON public.image_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_image_suggestions_updated_at();

-- Insert default image suggestions
INSERT INTO public.image_suggestions (name, category, image, is_active)
VALUES 
  ('Professional Portrait', 'People', 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Portrait', true),
  ('Mountain Landscape', 'Nature', 'https://via.placeholder.com/400x300/10b981/ffffff?text=Landscape', true),
  ('Abstract Painting', 'Art', 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Abstract', true),
  ('Modern City', 'Urban', 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=City', true),
  ('Ocean Sunset', 'Nature', 'https://via.placeholder.com/400x300/ec4899/ffffff?text=Sunset', true),
  ('Coffee Shop Interior', 'Interior', 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Interior', true),
  ('Minimalist Design', 'Art', 'https://via.placeholder.com/400x300/06b6d4/ffffff?text=Minimal', true),
  ('Wildlife Photography', 'Animals', 'https://via.placeholder.com/400x300/84cc16/ffffff?text=Wildlife', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- Run this script in your Supabase SQL Editor
-- Tables created: banners, image_suggestions
-- RLS policies configured for both tables
-- Default data inserted
-- ========================================
