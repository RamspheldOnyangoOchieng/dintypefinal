-- =================================================================
-- GRANT ULTIMATE ADMIN POWER to admin@sinsync.co.uk
-- User ID: 8e0833c1-4abc-41ef-bb4e-f88b0b473357
-- =================================================================

-- 1. Insert into admin_users (The primary check)
INSERT INTO public.admin_users (user_id, email)
VALUES ('8e0833c1-4abc-41ef-bb4e-f88b0b473357', 'admin@sinsync.co.uk')
ON CONFLICT (user_id) 
DO UPDATE SET email = 'admin@sinsync.co.uk';

-- 2. Update Profile to be admin (The fallback check)
UPDATE public.profiles
SET is_admin = true,
    username = 'SuperAdmin',
    full_name = 'SinSync Admin'
WHERE id = '8e0833c1-4abc-41ef-bb4e-f88b0b473357';

-- 3. Update Auth Metadata (The auth-level check)
-- This ensures that even the session contains the admin role
UPDATE auth.users
SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"role": "admin", "isAdmin": true, "access_level": "superuser"}'::jsonb
WHERE id = '8e0833c1-4abc-41ef-bb4e-f88b0b473357';

-- 4. Ensure RLS doesn't block this admin
-- Make sure the admin policies exist and are enabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Re-create the reading policy just in case
DROP POLICY IF EXISTS "Allow reading admin_users" ON public.admin_users;
CREATE POLICY "Allow reading admin_users" ON public.admin_users
    FOR SELECT USING (true);

-- 5. Grant access to everything (Permission level)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- 6. Verify result
SELECT 
    u.email as auth_email,
    u.id as user_id,
    p.is_admin as profile_admin,
    EXISTS(SELECT 1 FROM public.admin_users au WHERE au.user_id = u.id) as is_in_admin_table,
    u.raw_user_meta_data
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id = '8e0833c1-4abc-41ef-bb4e-f88b0b473357';
