-- ========================================
-- COMPLETE FIX: RLS + GRANTS for Banners & Image Suggestions
-- This adds GRANT permissions AND RLS policies
-- ========================================

-- ========================================
-- FIX BANNERS TABLE
-- ========================================

-- Step 1: Grant SELECT permission to anon and authenticated roles
GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.banners TO authenticated;

-- Step 2: Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to active banners" ON public.banners;
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.banners;
DROP POLICY IF EXISTS "Authenticated users view all" ON public.banners;

-- Step 4: Create new policies
-- Allow anonymous and authenticated users to read active banners
CREATE POLICY "Allow public read access to active banners"
ON public.banners
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users to see all banners
CREATE POLICY "Authenticated users view all"
ON public.banners
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- FIX IMAGE_SUGGESTIONS TABLE
-- ========================================

-- Step 1: Grant SELECT permission to anon and authenticated roles
GRANT SELECT ON public.image_suggestions TO anon;
GRANT SELECT ON public.image_suggestions TO authenticated;

-- Step 2: Enable RLS
ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to active suggestions" ON public.image_suggestions;
DROP POLICY IF EXISTS "Public can view active image suggestions" ON public.image_suggestions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.image_suggestions;
DROP POLICY IF EXISTS "Authenticated users view all suggestions" ON public.image_suggestions;

-- Step 4: Create new policies
-- Allow anonymous and authenticated users to read active suggestions
CREATE POLICY "Allow public read access to active suggestions"
ON public.image_suggestions
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow authenticated users to see all suggestions
CREATE POLICY "Authenticated users view all suggestions"
ON public.image_suggestions
FOR SELECT
TO authenticated
USING (true);

-- ========================================
-- VERIFICATION (view policies created)
-- ========================================

-- Show banners policies
SELECT 
  'banners' as table_name,
  policyname,
  roles::text,
  cmd
FROM pg_policies
WHERE tablename = 'banners';

-- Show image_suggestions policies
SELECT 
  'image_suggestions' as table_name,
  policyname,
  roles::text,
  cmd
FROM pg_policies
WHERE tablename = 'image_suggestions';

-- ========================================
-- SUCCESS!
-- ========================================
-- If you see the policies listed above with no errors,
-- the fix is complete! Refresh your frontend.
-- ========================================
