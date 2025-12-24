-- Admin Status Diagnostic Script
-- Run this in Supabase SQL Editor to check your admin status

-- First, get your user ID (replace the email with your admin email)
SELECT 
    id as user_id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'aware1.gaming@gmail.com'; -- ⬅️ CHANGE THIS TO YOUR ADMIN EMAIL

-- Now let's check all admin verification methods:

-- Method 1: Check admin_users table
SELECT 'admin_users' as source, user_id, email
FROM admin_users
WHERE email = 'aware1.gaming@gmail.com' -- ⬅️ CHANGE THIS TO YOUR ADMIN EMAIL
UNION ALL
-- Method 2: Check profiles.is_admin
SELECT 'profiles' as source, id::text as user_id, NULL as email
FROM profiles
WHERE is_admin = true 
AND id IN (SELECT id FROM auth.users WHERE email = 'aware1.gaming@gmail.com'); -- ⬅️ CHANGE THIS

-- If none of the above return results, you need to add yourself as admin
-- Run ONE of these fixes:

-- FIX 1: Add to admin_users table (preferred)
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users 
WHERE email = 'aware1.gaming@gmail.com' -- ⬅️ CHANGE THIS TO YOUR ADMIN EMAIL
ON CONFLICT (user_id) DO NOTHING;

-- FIX 2: Update profiles table
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'aware1.gaming@gmail.com'); -- ⬅️ CHANGE THIS

-- After running a fix, verify again:
SELECT 
    'VERIFICATION' as status,
    au.email,
    CASE 
        WHEN au.user_id IS NOT NULL THEN '✅ In admin_users'
        WHEN p.is_admin = true THEN '✅ In profiles (is_admin=true)'
        ELSE '❌ NOT ADMIN'
    END as admin_status
FROM auth.users u
LEFT JOIN admin_users au ON u.id = au.user_id
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'aware1.gaming@gmail.com'; -- ⬅️ CHANGE THIS
