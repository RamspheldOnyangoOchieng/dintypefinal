-- ========================================
-- CHECK & UPDATE IMAGE SUGGESTIONS TO USE CLOUDINARY/BUNNY URLs
-- Run this in Supabase SQL Editor
-- ========================================

-- ========================================
-- STEP 1: Check current data in image_suggestions
-- ========================================

SELECT 'Current image_suggestions data:' as info;
SELECT 
    id, 
    name, 
    category, 
    CASE 
        WHEN image LIKE 'https://res.cloudinary%' THEN '✅ Cloudinary'
        WHEN image LIKE '%bunnycdn%' OR image LIKE '%b-cdn%' THEN '✅ Bunny CDN'
        WHEN image LIKE '%supabase%' THEN '⚠️ Supabase Storage'
        ELSE '❓ Other: ' || LEFT(image, 50)
    END as storage_type,
    is_active
FROM public.image_suggestions
ORDER BY category, created_at DESC;

-- ========================================
-- STEP 2: Count by storage type
-- ========================================

SELECT 'Storage type breakdown:' as info;
SELECT 
    CASE 
        WHEN image LIKE 'https://res.cloudinary%' THEN 'Cloudinary'
        WHEN image LIKE '%bunnycdn%' OR image LIKE '%b-cdn%' THEN 'Bunny CDN'
        WHEN image LIKE '%supabase%' THEN 'Supabase Storage'
        ELSE 'Other'
    END as storage_type,
    COUNT(*) as count
FROM public.image_suggestions
GROUP BY 1
ORDER BY count DESC;

-- ========================================
-- STEP 3: Show sample Supabase URLs that need to be changed
-- ========================================

SELECT 'Supabase URLs that need updating:' as info;
SELECT id, name, category, image
FROM public.image_suggestions
WHERE image LIKE '%supabase%'
LIMIT 10;

-- ========================================
-- STEP 4: UPDATE URLs from Supabase to Cloudinary
-- Uncomment and modify the URL pattern to match your Cloudinary URLs
-- ========================================

-- Example: Update specific images by ID
-- UPDATE public.image_suggestions 
-- SET image = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/suggestions/image1.jpg'
-- WHERE id = 'your-image-id-here';

-- Example: Batch update by replacing Supabase URL pattern with Cloudinary
-- UPDATE public.image_suggestions 
-- SET image = REPLACE(
--     image, 
--     'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/images/',
--     'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/'
-- )
-- WHERE image LIKE '%supabase%';

-- ========================================
-- STEP 5: Alternative - Insert new suggestions with Cloudinary URLs
-- ========================================

-- Example: Add new image suggestions with Cloudinary/Bunny URLs
-- INSERT INTO public.image_suggestions (name, category, image, is_active) VALUES
-- ('Beach Sunset', 'nature', 'https://res.cloudinary.com/YOUR_CLOUD/image/upload/v1/beach-sunset.jpg', true),
-- ('City Night', 'urban', 'https://YOUR_ZONE.b-cdn.net/city-night.jpg', true),
-- ('Mountain View', 'nature', 'https://res.cloudinary.com/YOUR_CLOUD/image/upload/v1/mountain.jpg', true)
-- ON CONFLICT DO NOTHING;

-- ========================================
-- STEP 6: Fix permissions (if not already done)
-- ========================================

ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.image_suggestions;
CREATE POLICY "Allow public read access"
ON public.image_suggestions FOR SELECT
USING (true);

GRANT SELECT ON public.image_suggestions TO anon;
GRANT SELECT ON public.image_suggestions TO authenticated;

-- ========================================
-- STEP 7: Verify changes
-- ========================================

SELECT 'Final verification:' as info;
SELECT 
    category,
    COUNT(*) as total_images,
    SUM(CASE WHEN image LIKE '%cloudinary%' THEN 1 ELSE 0 END) as cloudinary_count,
    SUM(CASE WHEN image LIKE '%bunny%' OR image LIKE '%b-cdn%' THEN 1 ELSE 0 END) as bunny_count,
    SUM(CASE WHEN image LIKE '%supabase%' THEN 1 ELSE 0 END) as supabase_count
FROM public.image_suggestions
WHERE is_active = true
GROUP BY category;

-- ========================================
-- DONE!
-- ========================================
