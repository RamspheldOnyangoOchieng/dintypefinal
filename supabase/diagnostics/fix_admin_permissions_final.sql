-- =================================================================
-- FIX ADMIN PERMISSIONS, RLS, AND SETUP
-- =================================================================

-- 1. Ensure the admin_users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow reading admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- 4. Create RLS Policies

-- Policy: Allow users to see if THEY are in the admin table.
-- This is critical for the "isUserAdmin" check to work for the user themselves.
CREATE POLICY "Users can read own admin status" ON public.admin_users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow service_role (server-side admin) full access.
-- (Implicitly true for service_role, but good for clarity if using other roles)

-- 5. Insert the Admin User
-- User ID: 8e0833c1-4abc-41ef-bb4e-f88b0b473357
-- Email: admin@sinsync.co.uk
INSERT INTO public.admin_users (user_id, email)
VALUES ('8e0833c1-4abc-41ef-bb4e-f88b0b473357', 'admin@sinsync.co.uk')
ON CONFLICT (user_id) 
DO UPDATE SET email = EXCLUDED.email;

-- 6. Fix Profiles RLS and Data
-- Ensure profiles table exists (it should)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow reading profiles (needed for checking is_admin column fallback)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Update the specific profile to be admin
UPDATE public.profiles
SET is_admin = true
WHERE id = '8e0833c1-4abc-41ef-bb4e-f88b0b473357';

-- 7. Update strict User Metadata (Auth level)
-- This puts the admin role in the JWT itself, which some middleware might check
UPDATE auth.users
SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"role": "admin", "isAdmin": true, "access_level": "superuser"}'::jsonb
WHERE id = '8e0833c1-4abc-41ef-bb4e-f88b0b473357';

-- 8. Verify the setup
SELECT 
    u.id as user_id,
    u.email,
    p.is_admin as profile_admin,
    (SELECT count(*) FROM public.admin_users au WHERE au.user_id = u.id) as admin_table_entry,
    u.raw_user_meta_data->>'role' as auth_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id = '8e0833c1-4abc-41ef-bb4e-f88b0b473357';
