
-- Fix user_tokens RLS and permissions
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- 1. Fix Schema: Add created_at column if it's missing
ALTER TABLE public.user_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Allow users to read their own tokens
DROP POLICY IF EXISTS "Users can view own token balance" ON public.user_tokens;
CREATE POLICY "Users can view own token balance" ON public.user_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- IMPORTANT: Grant permissions to authenticated users and service_role
GRANT ALL ON public.user_tokens TO service_role;
GRANT SELECT ON public.user_tokens TO authenticated;

-- Also fix profiles just in case
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Ensure generated_images and other tables are accessible
GRANT ALL ON public.generated_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO authenticated;

-- Manual fix for the specific user's tokens to ensure they can test
-- Uses the most recently created user
-- Manual fix for the specific user's tokens to ensure they can test
-- Uses the most recently created user
INSERT INTO public.user_tokens (user_id, balance, created_at, updated_at)
SELECT 
    id,
    100,
    NOW(),
    NOW()
FROM auth.users
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (user_id)
DO UPDATE SET balance = 100, updated_at = NOW();

-- Also ensure user has a profile
INSERT INTO public.profiles (id, is_premium)
SELECT 
    id,
    false
FROM auth.users
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Log the transaction
INSERT INTO public.token_transactions (user_id, amount, type, description, created_at)
SELECT 
    id,
    100,
    'bonus',
    'System adjustment',
    NOW()
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;
