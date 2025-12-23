-- ========================================
-- FIX IMAGE SUGGESTIONS & PERMISSIONS
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Check current data
SELECT 'Current image_suggestions data:' as info;
SELECT id, name, category, 
       CASE WHEN image LIKE 'https://res.cloudinary%' THEN 'Cloudinary' 
            WHEN image LIKE 'https://%supabase%' THEN 'Supabase Storage' 
            ELSE 'Other' END as storage_type,
       is_active
FROM public.image_suggestions
LIMIT 20;

-- Step 2: Fix permissions
ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.image_suggestions;
CREATE POLICY "Allow public read access"
ON public.image_suggestions FOR SELECT
USING (true);

GRANT SELECT ON public.image_suggestions TO anon;
GRANT SELECT ON public.image_suggestions TO authenticated;

-- Step 3: Insert some sample image suggestions with Cloudinary URLs if table is empty
-- (Uncomment and modify if needed)
/*
INSERT INTO public.image_suggestions (name, category, image, is_active) VALUES
('Beautiful Sunset', 'nature', 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/samples/sunset.jpg', true),
('Mountain View', 'nature', 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/samples/mountain.jpg', true),
('City Lights', 'urban', 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/samples/city.jpg', true)
ON CONFLICT DO NOTHING;
*/

-- Step 4: Verify permissions
SELECT 'RLS Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'image_suggestions';

-- Step 5: Test query
SELECT 'Test query result:' as info;
SELECT COUNT(*) as total_suggestions FROM public.image_suggestions WHERE is_active = true;

-- ========================================
-- DONE!
-- ========================================
