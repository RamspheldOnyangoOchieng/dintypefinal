-- FORCE RECREATE of subscription_plans to support TEXT IDs
-- The previous error (22P02) happened because the 'id' column was a UUID, but we tried to insert text ('premium_monthly').
-- This script drops the incompatible table and recreates it correctly.

-- 1. Drop the existing table and any foreign key constraints pointing to it
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- 2. Recreate the table with 'id' as TEXT (to support 'premium_monthly')
CREATE TABLE subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER, -- duration in months
    original_price NUMERIC,
    discounted_price NUMERIC,
    currency TEXT DEFAULT 'SEK',
    active BOOLEAN DEFAULT true,
    features TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Allow everyone to view plans
CREATE POLICY "Public read access" ON subscription_plans 
    FOR SELECT 
    USING (true);

-- Allow admins to manage plans (checking both admin_users and profiles)
CREATE POLICY "Admin full access" ON subscription_plans 
    FOR ALL 
    TO authenticated 
    USING (
      EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) 
      OR 
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 5. Insert the Required Premium Plan
INSERT INTO subscription_plans (id, name, description, duration, original_price, active, features)
VALUES (
    'premium_monthly',
    'Premium User',
    'Premium Use - 1 Month Subscription',
    1,
    110, -- Price in SEK
    true,
    ARRAY['Unlimited Chat', 'Unlimited Image Generation', '100 Free Tokens']
);

-- 6. Insert Token Packages (Optional, but good for consistency if you migrate to DB-based packages later)
-- Note: The frontend currently uses hardcoded token packages, but having them in DB is good practice.
INSERT INTO subscription_plans (id, name, description, original_price, metadata)
VALUES 
('pack_200', '200 Tokens', 'Token Pack', 99, '{"type": "token_pack", "tokens": 200}'::jsonb),
('pack_550', '550 Tokens', 'Token Pack', 249, '{"type": "token_pack", "tokens": 550}'::jsonb),
('pack_1550', '1,550 Tokens', 'Token Pack', 499, '{"type": "token_pack", "tokens": 1550}'::jsonb),
('pack_5800', '5,800 Tokens', 'Token Pack', 1499, '{"type": "token_pack", "tokens": 5800}'::jsonb);
