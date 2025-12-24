-- Enable RLS on user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Remove conflicting policies
DROP POLICY IF EXISTS "Users can read own token balance" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can view own token balance" ON public.user_tokens;

-- Create correct policy
CREATE POLICY "Users can read own token balance"
ON public.user_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure permissions
GRANT SELECT ON public.user_tokens TO authenticated;

-- Verify
SELECT * FROM public.user_tokens LIMIT 5;
