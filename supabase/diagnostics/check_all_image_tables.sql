-- ========================================
-- CHECK ALL IMAGE TABLES & THEIR STORAGE SOURCES
-- Run this in Supabase SQL Editor
-- ========================================

-- ========================================
-- PART 1: CHECK image_suggestions TABLE
-- ========================================

SELECT '=== IMAGE_SUGGESTIONS TABLE ===' as section;

SELECT 
    category,
    name,
    CASE 
        WHEN image LIKE 'https://res.cloudinary%' THEN '✅ Cloudinary'
        WHEN image LIKE '%b-cdn.net%' OR image LIKE '%bunnycdn%' THEN '✅ Bunny CDN'
        WHEN image LIKE '%supabase%' THEN '⚠️ Supabase'
        WHEN image LIKE 'https://novita%' THEN '⚠️ Novita (temp)'
        ELSE '❓ Other'
    END as storage_type,
    LEFT(image, 60) as image_preview
FROM public.image_suggestions
WHERE is_active = true
ORDER BY category, name
LIMIT 30;

-- ========================================
-- PART 2: CHECK attribute_images TABLE
-- ========================================

SELECT '=== ATTRIBUTE_IMAGES TABLE ===' as section;

SELECT 
    category,
    value,
    style,
    CASE 
        WHEN image_url LIKE 'https://res.cloudinary%' THEN '✅ Cloudinary'
        WHEN image_url LIKE '%b-cdn.net%' OR image_url LIKE '%bunnycdn%' THEN '✅ Bunny CDN'
        WHEN image_url LIKE '%supabase%' THEN '⚠️ Supabase'
        WHEN image_url LIKE 'https://novita%' THEN '⚠️ Novita (temp)'
        ELSE '❓ Other'
    END as storage_type,
    LEFT(image_url, 60) as url_preview
FROM public.attribute_images
ORDER BY category, value
LIMIT 30;

-- ========================================
-- PART 3: SUMMARY COUNT BY STORAGE TYPE
-- ========================================

SELECT '=== SUMMARY: image_suggestions ===' as section;
SELECT 
    CASE 
        WHEN image LIKE 'https://res.cloudinary%' THEN 'Cloudinary'
        WHEN image LIKE '%b-cdn.net%' OR image LIKE '%bunnycdn%' THEN 'Bunny CDN'
        WHEN image LIKE '%supabase%' THEN 'Supabase Storage'
        WHEN image LIKE 'https://novita%' THEN 'Novita (temp)'
        ELSE 'Other'
    END as storage_type,
    COUNT(*) as count
FROM public.image_suggestions
GROUP BY 1
ORDER BY count DESC;

SELECT '=== SUMMARY: attribute_images ===' as section;
SELECT 
    CASE 
        WHEN image_url LIKE 'https://res.cloudinary%' THEN 'Cloudinary'
        WHEN image_url LIKE '%b-cdn.net%' OR image_url LIKE '%bunnycdn%' THEN 'Bunny CDN'
        WHEN image_url LIKE '%supabase%' THEN 'Supabase Storage'
        WHEN image_url LIKE 'https://novita%' THEN 'Novita (temp)'
        ELSE 'Other'
    END as storage_type,
    COUNT(*) as count
FROM public.attribute_images
GROUP BY 1
ORDER BY count DESC;

-- ========================================
-- PART 4: FIX PERMISSIONS
-- ========================================

-- image_suggestions
ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON public.image_suggestions;
CREATE POLICY "public_read" ON public.image_suggestions FOR SELECT USING (true);
GRANT SELECT ON public.image_suggestions TO anon, authenticated;

-- attribute_images
ALTER TABLE public.attribute_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON public.attribute_images;
CREATE POLICY "public_read" ON public.attribute_images FOR SELECT USING (true);
GRANT SELECT ON public.attribute_images TO anon, authenticated;

-- ========================================
-- PART 5: UPDATE URLS TO CLOUDINARY (EXAMPLES - UNCOMMENT TO USE)
-- ========================================

-- Option A: Update image_suggestions - replace Supabase URLs
-- UPDATE public.image_suggestions 
-- SET image = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/suggestions/' || 
--              REGEXP_REPLACE(SPLIT_PART(image, '/', -1), '\..*$', '.jpg')
-- WHERE image LIKE '%supabase%';

-- Option B: Insert new suggestions with correct Cloudinary URLs
-- DELETE FROM public.image_suggestions;
-- INSERT INTO public.image_suggestions (name, category, image, is_active) VALUES
-- ('Blonde Hair', 'hair', 'https://res.cloudinary.com/YOUR_CLOUD/image/upload/v1/suggestions/blonde-hair.jpg', true),
-- ('Blue Eyes', 'eyes', 'https://YOUR_ZONE.b-cdn.net/suggestions/blue-eyes.jpg', true);

-- Option C: Update attribute_images - replace URLs
-- UPDATE public.attribute_images 
-- SET image_url = REPLACE(image_url, 
--     'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/attributes/',
--     'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/attributes/')
-- WHERE image_url LIKE '%supabase%';

-- ========================================
-- DONE!
-- ========================================
