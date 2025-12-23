-- ========================================
-- GRANT ADMIN FULL ACCESS & TOKENS
-- STEP BY STEP - Run each section separately if needed
-- ========================================

-- ========================================
-- STEP 0: CHECK TABLE STRUCTURES (run first to see columns)
-- ========================================

SELECT 'user_tokens columns:' as table_info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_tokens';

SELECT 'premium_users columns:' as table_info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'premium_users';

SELECT 'admin_users columns:' as table_info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'admin_users';

-- ========================================
-- STEP 1: Give all admin_users 200,000 tokens
-- ========================================

INSERT INTO public.user_tokens (user_id, balance, updated_at)
SELECT 
    au.user_id,
    200000,
    NOW()
FROM public.admin_users au
ON CONFLICT (user_id) 
DO UPDATE SET 
    balance = 200000,
    updated_at = NOW();

-- ========================================
-- STEP 2: Create admin_privileges table
-- ========================================

CREATE TABLE IF NOT EXISTS public.admin_privileges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    can_bypass_token_limits BOOLEAN DEFAULT TRUE,
    can_bypass_message_limits BOOLEAN DEFAULT TRUE,
    can_bypass_image_limits BOOLEAN DEFAULT TRUE,
    can_access_all_features BOOLEAN DEFAULT TRUE,
    can_manage_users BOOLEAN DEFAULT TRUE,
    can_manage_content BOOLEAN DEFAULT TRUE,
    can_manage_settings BOOLEAN DEFAULT TRUE,
    can_view_analytics BOOLEAN DEFAULT TRUE,
    unlimited_tokens BOOLEAN DEFAULT TRUE,
    max_tokens INTEGER DEFAULT 999999999,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS and grant permissions
ALTER TABLE public.admin_privileges ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.admin_privileges TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read admin_privileges" ON public.admin_privileges;
CREATE POLICY "Anyone can read admin_privileges"
ON public.admin_privileges FOR SELECT
TO anon, authenticated
USING (true);

-- ========================================
-- STEP 3: Grant full privileges to all admin users
-- ========================================

INSERT INTO public.admin_privileges (
    user_id,
    can_bypass_token_limits,
    can_bypass_message_limits,
    can_bypass_image_limits,
    can_access_all_features,
    can_manage_users,
    can_manage_content,
    can_manage_settings,
    can_view_analytics,
    unlimited_tokens,
    max_tokens
)
SELECT 
    au.user_id,
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 999999999
FROM public.admin_users au
ON CONFLICT (user_id) 
DO UPDATE SET 
    can_bypass_token_limits = TRUE,
    can_bypass_message_limits = TRUE,
    can_bypass_image_limits = TRUE,
    can_access_all_features = TRUE,
    can_manage_users = TRUE,
    can_manage_content = TRUE,
    can_manage_settings = TRUE,
    can_view_analytics = TRUE,
    unlimited_tokens = TRUE,
    max_tokens = 999999999,
    updated_at = NOW();

-- ========================================
-- STEP 4: Create helper function to check if user is admin
-- ========================================

DROP FUNCTION IF EXISTS public.is_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
    'Admin Users & Access' as info,
    au.user_id,
    au.email,
    ut.balance as tokens,
    ap.unlimited_tokens,
    ap.can_bypass_token_limits,
    ap.can_bypass_message_limits,
    ap.can_bypass_image_limits
FROM public.admin_users au
LEFT JOIN public.user_tokens ut ON ut.user_id = au.user_id
LEFT JOIN public.admin_privileges ap ON ap.user_id = au.user_id
ORDER BY au.email;

-- ========================================
-- DONE!
-- ========================================
