-- Diagnostic script to check banners table RLS policies and permissions
-- Run this in your Supabase SQL Editor

-- 1. Check if banners table exists
SELECT 
  tablename,
  schemaname,
  tableowner
FROM pg_tables
WHERE tablename = 'banners';

-- 2. Check RLS status on banners table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'banners';

-- 3. List all RLS policies on banners table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'banners';

-- 4. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'banners'
ORDER BY ordinal_position;

-- 5. Check if there's any data in the banners table
SELECT COUNT(*) as banner_count FROM banners;

-- 6. Try to select banners (this will show if RLS is blocking)
SELECT 
  id,
  image_url,
  title,
  is_active,
  created_at
FROM banners
LIMIT 5;

-- 7. Check if anon role can access (this simulates your frontend)
SET ROLE anon;
SELECT * FROM banners WHERE is_active = true;
RESET ROLE;
