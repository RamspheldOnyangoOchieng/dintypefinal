-- ========================================
-- QUICK ADMIN SETUP - Run in Supabase SQL Editor
-- ========================================

-- Step 1: View your user ID from auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Copy your user ID and add to admin_users
-- Replace YOUR_USER_ID_HERE with your actual UUID from Step 1
-- Example: INSERT INTO public.admin_users (user_id, email) VALUES ('8e0833c1-4abc-41ef-bb4e-f88b0b473357', 'your@email.com');

-- After finding your ID, run this (modify with your values):
-- INSERT INTO public.admin_users (user_id, email) 
-- VALUES ('YOUR_UUID_HERE', 'your@email.com')
-- ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Fix RLS to allow reading admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow reading admin_users" ON public.admin_users;
CREATE POLICY "Allow reading admin_users"
ON public.admin_users FOR SELECT
USING (true);

GRANT SELECT ON public.admin_users TO anon;
GRANT SELECT ON public.admin_users TO authenticated;

-- Step 4: Verify admin_users table content
SELECT 'Admin Users:' as info;
SELECT * FROM public.admin_users;

-- Step 5: Verify the policy works
SELECT 'RLS Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'admin_users';
