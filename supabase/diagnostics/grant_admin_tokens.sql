
-- 1. Ensure column exists.
ALTER TABLE public.user_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Grant tokens to the specific Admin User (by Email)
-- We use a subquery to match the email 'admin@sinsync.co.uk'
INSERT INTO public.user_tokens (user_id, balance, created_at, updated_at)
SELECT 
    id, 
    200, 
    NOW(), 
    NOW()
FROM auth.users 
WHERE email = 'admin@sinsync.co.uk'
ON CONFLICT (user_id) 
DO UPDATE SET balance = 200, updated_at = NOW();

-- 3. Just in case, grant tokens to ANY user created in the last 24 hours (for testing)
INSERT INTO public.user_tokens (user_id, balance, created_at, updated_at)
SELECT 
    id, 
    200, 
    NOW(), 
    NOW()
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 day'
ON CONFLICT (user_id) 
DO UPDATE SET balance = 200, updated_at = NOW();

-- 4. Ensure Permissions (Crucial for the app to read the balance)
GRANT ALL ON public.user_tokens TO service_role;
GRANT SELECT ON public.user_tokens TO authenticated;
