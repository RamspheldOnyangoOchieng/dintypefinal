-- COMBINED FIX: RLS Policies for Both Tables
-- This script fixes Row Level Security policies to allow frontend access

-- ========================================
-- FIX BANNERS TABLE RLS
-- ========================================

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for banners
DROP POLICY IF EXISTS "Allow public read access to active banners" ON public.banners;
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.banners;
DROP POLICY IF EXISTS "Authenticated users view all" ON public.banners;

-- Allow anonymous and authenticated users to read active banners
CREATE POLICY "Allow public read access to active banners"
ON public.banners
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users to see all banners (active and inactive)
CREATE POLICY "Authenticated users view all"
ON public.banners
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- FIX IMAGE_SUGGESTIONS TABLE RLS
-- ========================================

ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for image_suggestions
DROP POLICY IF EXISTS "Allow public read access to active suggestions" ON public.image_suggestions;
DROP POLICY IF EXISTS "Public can view active image suggestions" ON public.image_suggestions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.image_suggestions;
DROP POLICY IF EXISTS "Authenticated users view all suggestions" ON public.image_suggestions;

-- Allow anonymous and authenticated users to read active suggestions
CREATE POLICY "Allow public read access to active suggestions"
ON public.image_suggestions
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users to see all suggestions (active and inactive)
CREATE POLICY "Authenticated users view all suggestions"
ON public.image_suggestions
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- VERIFICATION
-- ========================================

-- Check banners policies
SELECT 
  'banners' as table_name,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'banners';

-- Check image_suggestions policies
SELECT 
  'image_suggestions' as table_name,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'image_suggestions';

-- Test anonymous access to banners
SET ROLE anon;
SELECT COUNT(*) as accessible_banners FROM public.banners WHERE is_active = true;
RESET ROLE;

-- Test anonymous access to image_suggestions
SET ROLE anon;
SELECT COUNT(*) as accessible_suggestions FROM public.image_suggestions WHERE is_active = true;
RESET ROLE;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- If you see counts above and no errors, the fix worked!
-- Your frontend should now be able to fetch data.
-- ========================================
