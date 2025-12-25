-- ========================================
-- ADMIN STATUS DIAGNOSTIC
-- Run this in Supabase SQL Editor to check admin setup
-- ========================================

-- 1. Check your current user sessions
SELECT 
    'Current Auth Users' as section,
    id, 
    email, 
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data->>'role' as metadata_role
FROM auth.users 
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- 2. Check admin_users table
SELECT 
    'Admin Users Table' as section,
    au.id,
    au.user_id,
    au.email,
    au.created_at,
    u.email as auth_email
FROM public.admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id
ORDER BY au.created_at DESC;

-- 3. Check profiles table for is_admin
SELECT 
    'Profiles with Admin Flag' as section,
    p.id,
    p.email,
    p.username,
    p.is_admin,
    u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = true
ORDER BY p.created_at DESC;

-- 4. Check RLS policies on admin_users
SELECT 
    'Admin Users RLS Policies' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'admin_users'
ORDER BY policyname;

-- 5. Check table permissions
SELECT 
    'admin_users Table Grants' as section,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'admin_users'
ORDER BY grantee, privilege_type;

-- ========================================
-- QUICK FIX: Add your user as admin
-- ========================================
-- Uncomment and update with YOUR email:

-- INSERT INTO public.admin_users (user_id, email)
-- SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
-- ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- UPDATE public.profiles 
-- SET is_admin = true 
-- WHERE email = 'YOUR_EMAIL_HERE';
