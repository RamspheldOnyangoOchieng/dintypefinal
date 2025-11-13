-- Create Character Feature - Database Setup
-- Run this in Supabase SQL Editor to set up all necessary tables and storage

-- ============================================
-- 1. CREATE ATTRIBUTE IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attribute_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  style TEXT NOT NULL CHECK (style IN ('realistic', 'anime')),
  image_url TEXT NOT NULL,
  prompt TEXT,
  seed INTEGER,
  width INTEGER DEFAULT 512,
  height INTEGER DEFAULT 768,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value, style)
);

-- Add helpful comment
COMMENT ON TABLE attribute_images IS 'Stores generated images for character creation attributes';

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attribute_images_category 
  ON attribute_images(category);

CREATE INDEX IF NOT EXISTS idx_attribute_images_style 
  ON attribute_images(style);

CREATE INDEX IF NOT EXISTS idx_attribute_images_lookup 
  ON attribute_images(category, value, style);

CREATE INDEX IF NOT EXISTS idx_attribute_images_created 
  ON attribute_images(created_at DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE attribute_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE SECURITY POLICIES
-- ============================================

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Anyone can view attribute images" ON attribute_images;
DROP POLICY IF EXISTS "Authenticated users can insert attribute images" ON attribute_images;
DROP POLICY IF EXISTS "Authenticated users can update attribute images" ON attribute_images;

-- Allow anyone to read attribute images (they're public reference images)
CREATE POLICY "Anyone can view attribute images" 
  ON attribute_images
  FOR SELECT 
  USING (true);

-- Only authenticated users can insert (for admin/generation)
CREATE POLICY "Authenticated users can insert attribute images" 
  ON attribute_images
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update attribute images" 
  ON attribute_images
  FOR UPDATE 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================
-- 5. CREATE STORAGE BUCKET FOR ATTRIBUTE IMAGES
-- ============================================

-- Insert storage bucket (attributes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attributes', 'attributes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- 6. CREATE STORAGE POLICIES
-- ============================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public can view attribute images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attribute images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update attribute images storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete attribute images" ON storage.objects;

-- Allow public read access to attribute images
CREATE POLICY "Public can view attribute images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'attributes');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload attribute images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'attributes' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update attribute images storage" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'attributes' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

-- Allow authenticated users to delete (for cleanup)
CREATE POLICY "Authenticated users can delete attribute images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'attributes' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGER
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_attribute_images_updated_at ON attribute_images;

-- Create trigger
CREATE TRIGGER update_attribute_images_updated_at
    BEFORE UPDATE ON attribute_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VERIFY SETUP
-- ============================================

-- Check if table was created successfully
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'attribute_images';

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'attribute_images';

-- Check policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'attribute_images';

-- Check storage bucket
SELECT 
  id,
  name,
  public
FROM storage.buckets
WHERE id = 'attributes';

-- Show storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%attribute%';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- Next steps:
-- 1. Verify all queries above return expected results
-- 2. Test the API endpoint: /api/attribute-images?category=age&value=18-19&style=realistic
-- 3. Navigate to /create-character in your app and test the flow
-- 
-- Note: First time generating each attribute image will take 10-30 seconds
-- Subsequent loads will be instant as images are cached in the database
--
