-- =========================================
-- ADMIN ACCESS FIX - Run this in Supabase SQL Editor
-- =========================================

-- Step 1: Make sure you're in the admin_users table
-- Replace 'aware1.gaming@gmail.com' with YOUR admin email

INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users 
WHERE email = 'aware1.gaming@gmail.com'  -- ⬅️ CHANGE THIS!
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- Step 2: Also mark as admin in profiles (backup method)
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'aware1.gaming@gmail.com');  -- ⬅️ CHANGE THIS!

-- Step 3: Fix RLS policies on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow anon to check admin status" ON admin_users;
DROP POLICY IF EXISTS "Anyone can check admin status" ON admin_users;
DROP POLICY IF EXISTS "Users can view admin users" ON admin_users;

-- Create new policy that allows SELECT
CREATE POLICY "Anyone can check admin status"
ON admin_users FOR SELECT
TO anon, authenticated
USING (true);

-- Grant permissions
GRANT SELECT ON admin_users TO anon, authenticated;
GRANT ALL ON admin_users TO service_role;

-- Step 4: Verify it worked
SELECT 
    'ADMIN VERIFICATION' as check_type,
    u.email,
    CASE 
        WHEN au.user_id IS NOT NULL THEN '✅ YES - In admin_users table'
        WHEN p.is_admin = true THEN '✅ YES - In profiles (is_admin=true)'
        ELSE '❌ NO - Not found as admin'
    END as admin_status
FROM auth.users u
LEFT JOIN admin_users au ON u.id = au.user_id
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'aware1.gaming@gmail.com';  -- ⬅️ CHANGE THIS!

-- You should see: "✅ YES - In admin_users table" or "✅ YES - In profiles (is_admin=true)"
-- If you see ❌ NO, check that you changed the email correctly above!

SELECT '✅ Admin access fix completed! Now LOGOUT and LOGIN again.' as status;
