-- Recreate/Fix subscription_plans table to support text IDs (slugs)
-- This is necessary because the frontend sends 'premium_monthly' as an ID, but the table might expect UUIDs.

DO $$ 
BEGIN
    -- Check if id column is UUID, if so we need to change it or drop table
    -- Since we want to ensure 'premium_monthly' works, we'll force it to TEXT.
    -- If the table is empty or data is disposable, we can drop it.
    -- For safety, let's try to alter it.
    
    -- First, ensure the table exists
    CREATE TABLE IF NOT EXISTS subscription_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        original_price NUMERIC NOT NULL,
        discounted_price NUMERIC,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- If it existed with UUID, we might need to convert
    BEGIN
        ALTER TABLE subscription_plans ALTER COLUMN id TYPE TEXT;
    EXCEPTION
        WHEN OTHERS THEN
            NULL; -- Ignore if already text or valid
    END;

    -- Ensure columns exist
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features TEXT[];
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration INTEGER;
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS original_price NUMERIC;
    ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS discounted_price NUMERIC;

END $$;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON subscription_plans;
CREATE POLICY "Public read access" ON subscription_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access" ON subscription_plans;
CREATE POLICY "Admin full access" ON subscription_plans
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
      )
    );

-- Insert the default premium plan
INSERT INTO subscription_plans (id, name, description, duration, original_price, discounted_price, active, features)
VALUES (
    'premium_monthly', 
    'Premium Membership', 
    'Unlimited access for 1 month', 
    1, 
    110, -- 110 SEK
    NULL, 
    true,
    ARRAY['Unlimited Chat', 'Unlimited Image Generation', 'Access to all Characters']
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    original_price = EXCLUDED.original_price,
    description = EXCLUDED.description;
