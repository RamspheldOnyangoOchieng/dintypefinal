
-- 1. Ensure column exists.
ALTER TABLE public.user_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Grant yourself 100 tokens. 
-- This selects the most recently created user (you) and gives them tokens.
INSERT INTO public.user_tokens (user_id, balance, created_at, updated_at)
SELECT id, 100, NOW(), NOW()
FROM auth.users
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (user_id) 
DO UPDATE SET balance = 100, updated_at = NOW();
