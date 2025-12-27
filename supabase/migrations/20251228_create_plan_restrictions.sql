-- Create plan_restrictions table
CREATE TABLE IF NOT EXISTS public.plan_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium')),
    restriction_key TEXT NOT NULL,
    restriction_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_type, restriction_key)
);

-- Enable RLS
ALTER TABLE public.plan_restrictions ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
DROP POLICY IF EXISTS "Admins can manage plan_restrictions" ON public.plan_restrictions;
CREATE POLICY "Admins can manage plan_restrictions"
ON public.plan_restrictions FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Users can read their own plan restrictions (indirectly)
DROP POLICY IF EXISTS "Authenticated users can read restrictions" ON public.plan_restrictions;
CREATE POLICY "Authenticated users can read restrictions"
ON public.plan_restrictions FOR SELECT
TO authenticated
USING (true);

-- Seed initial restrictions
INSERT INTO public.plan_restrictions (plan_type, restriction_key, restriction_value, description) VALUES
('free', 'max_characters', '1', 'Maximum number of AI characters a free user can create'),
('free', 'can_generate_nsfw', 'false', 'Whether free users can generate NSFW content'),
('free', 'daily_free_messages', '3', 'Number of free messages per day'),
('free', 'can_use_flux', 'false', 'Whether free users can use the Flux model'),
('free', 'can_use_stability', 'true', 'Whether free users can use the Stability model'),
('free', 'image_generation_limit', '1', 'Total free images for free users (SFW only)'),
('premium', 'max_characters', 'null', 'Maximum number of AI characters a premium user can create (null for unlimited)'),
('premium', 'can_generate_nsfw', 'true', 'Whether premium users can generate NSFW content'),
('premium', 'daily_free_messages', 'null', 'Number of free messages per day (null for unlimited)'),
('premium', 'can_use_flux', 'true', 'Whether premium users can use the Flux model'),
('premium', 'can_use_stability', 'true', 'Whether premium users can use the Stability model'),
('premium', 'image_generation_limit', 'null', 'Total free images for premium users (null for unlimited)')
ON CONFLICT (plan_type, restriction_key) DO NOTHING;
