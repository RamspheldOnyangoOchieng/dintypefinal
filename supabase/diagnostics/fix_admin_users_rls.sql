-- ========================================
-- FIX ADMIN_USERS TABLE ACCESS
-- Allow authenticated users to check their own admin status
-- Run this in Supabase SQL Editor
-- ========================================

-- ========================================
-- STEP 1: Check current state
-- ========================================

SELECT 'Current admin_users data:' as info;
SELECT user_id, email FROM public.admin_users;

SELECT 'Current RLS policies:' as info;
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'admin_users';

-- ========================================
-- STEP 2: Make sure RLS is enabled
-- ========================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: Drop all existing policies
-- ========================================

DROP POLICY IF EXISTS "Allow admins to read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Anyone can check admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can check admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can see all admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow users to check own admin status" ON public.admin_users;

-- ========================================
-- STEP 4: Create simple policy that allows anyone to check
-- if a specific user_id is in admin_users
-- ========================================

-- This policy allows any authenticated user to SELECT rows
-- where they are checking their own user_id
CREATE POLICY "Allow users to check own admin status"
ON public.admin_users FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also allow anon to check (for initial page load)
CREATE POLICY "Allow anon to check admin status"
ON public.admin_users FOR SELECT
TO anon
USING (true);

-- ========================================
-- STEP 5: Grant permissions
-- ========================================

GRANT SELECT ON public.admin_users TO anon;
GRANT SELECT ON public.admin_users TO authenticated;

-- ========================================
-- STEP 6: Verify the fix
-- ========================================

SELECT 'Updated RLS policies:' as info;
SELECT policyname, cmd, roles, permissive
FROM pg_policies 
WHERE tablename = 'admin_users';

SELECT 'Admin users in table:' as info;
SELECT user_id, email FROM public.admin_users;

-- ========================================
-- DONE!
-- ========================================
