-- Premium Page Database Updates
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. UPDATE TOKEN PACKAGES TABLE
-- =====================================================

-- Add description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'token_packages' AND column_name = 'description') THEN
        ALTER TABLE token_packages ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'token_packages' AND column_name = 'active') THEN
        ALTER TABLE token_packages ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'token_packages' AND column_name = 'created_at') THEN
        ALTER TABLE token_packages ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'token_packages' AND column_name = 'updated_at') THEN
        ALTER TABLE token_packages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Clear existing packages and insert new ones
TRUNCATE TABLE token_packages RESTART IDENTITY CASCADE;

INSERT INTO token_packages (name, tokens, price, description, active, created_at, updated_at) VALUES
('100 tokens (FREE)', 100, 0, 'Gratis med Premium prenumeration', true, NOW(), NOW()),
('200 tokens', 200, 99, '200 tokens för 9,99€ / 99kr', true, NOW(), NOW()),
('550 tokens', 550, 249, '550 tokens för 24,99€ / 249kr', true, NOW(), NOW()),
('1,550 tokens', 1550, 499, '1,550 tokens för 49,99€ / 499kr', true, NOW(), NOW()),
('5,800 tokens', 5800, 1499, '5,800 tokens för 149,99€ / 1,499kr', true, NOW(), NOW());

-- =====================================================
-- 2. CREATE/UPDATE PREMIUM SUBSCRIPTION TABLE
-- =====================================================

-- Create premium_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS premium_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
    plan_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
    price_eur DECIMAL(10,2) NOT NULL DEFAULT 11.00,
    price_sek DECIMAL(10,2) NOT NULL DEFAULT 110.00,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stripe_subscription_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);

-- Enable RLS
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can view own subscriptions"
ON premium_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON premium_subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
ON premium_subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON premium_subscriptions TO authenticated;
GRANT ALL ON premium_subscriptions TO service_role;

-- =====================================================
-- 3. UPDATE PREMIUM FEATURES TABLE
-- =====================================================

-- Clear and insert new features
TRUNCATE TABLE plan_features RESTART IDENTITY CASCADE;

INSERT INTO plan_features (
    feature_key,
    feature_label_en,
    feature_label_sv,
    free_value_en,
    free_value_sv,
    premium_value_en,
    premium_value_sv,
    sort_order,
    active,
    created_at,
    updated_at
) VALUES
('price', 'Price', 'Pris', '0 EUR / 0 SEK', '0 EUR / 0 SEK', '11 EUR / 110 SEK month', '11 EUR / 110 SEK månad', 1, true, NOW(), NOW()),
('text_messages', 'Text Messages', 'Textmeddelanden', '3 free messages', '3 fria meddelanden', 'Unlimited (NSFW & SFW)', 'Obegränsat (NSFW & SFW)', 2, true, NOW(), NOW()),
('create_ai_girlfriend', 'Create AI Girlfriend', 'Skapa AI flickvän', 'Not possible', 'Inte möjligt', 'Unlimited', 'Obegränsat', 3, true, NOW(), NOW()),
('create_images', 'Create Images', 'Skapa bilder', '1 free SFW', '1 gratis SFW', 'Unlimited (NSFW & SFW)', 'Obegränsat (NSFW & SFW)', 4, true, NOW(), NOW()),
('free_tokens', 'Free Tokens', 'Gratis tokens', 'Not available', 'Ingår ej', '100 free tokens', '100 gratis tokens', 5, true, NOW(), NOW()),
('buy_tokens', 'Buy Tokens', 'Köpa tokens', 'No', 'Nej', 'Yes', 'Ja', 6, true, NOW(), NOW());

-- =====================================================
-- 4. CREATE TOKEN COSTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS token_costs (
    id BIGSERIAL PRIMARY KEY,
    feature_key TEXT NOT NULL UNIQUE,
    feature_name_en TEXT NOT NULL,
    feature_name_sv TEXT NOT NULL,
    cost_tokens INTEGER NOT NULL,
    description_en TEXT,
    description_sv TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear and insert token costs
TRUNCATE TABLE token_costs RESTART IDENTITY CASCADE;

INSERT INTO token_costs (
    feature_key,
    feature_name_en,
    feature_name_sv,
    cost_tokens,
    description_en,
    description_sv,
    active
) VALUES
('text_message', 'Text Messages', 'Textmeddelanden', 5, '5 tokens per message', '5 tokens per message', true),
('create_girlfriend', 'Create AI Girlfriend', 'Skapa AI flickvän', 2, '2 tokens per girlfriend', '2 tokens per flickvän', true),
('image_generation_stability', 'Create Images (Stability)', 'Skapa bilder (Stability)', 5, 'Stability AI model', 'Stability AI modell', true),
('image_generation_flux', 'Create Images (Flux)', 'Skapa bilder (Flux)', 10, 'Flux AI model', 'Flux AI modell', true);

-- Enable RLS
ALTER TABLE token_costs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to token costs
DROP POLICY IF EXISTS "Anyone can view token costs" ON token_costs;
CREATE POLICY "Anyone can view token costs"
ON token_costs FOR SELECT
TO authenticated, anon
USING (active = true);

-- Service role can manage
DROP POLICY IF EXISTS "Service role can manage token costs" ON token_costs;
CREATE POLICY "Service role can manage token costs"
ON token_costs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON token_costs TO authenticated, anon;
GRANT ALL ON token_costs TO service_role;

-- =====================================================
-- 5. UPDATE USER PROFILES WITH PREMIUM STATUS
-- =====================================================

-- Add premium columns to profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
        ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'premium_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN premium_expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- Create index for premium status
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- =====================================================
-- 6. CREATE FUNCTION TO CHECK PREMIUM STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_premium_status(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_premium BOOLEAN;
BEGIN
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM premium_subscriptions 
                WHERE user_id = p_user_id 
                AND status = 'active'
                AND (current_period_end IS NULL OR current_period_end > NOW())
            ) THEN true
            ELSE false
        END INTO v_is_premium;
    
    RETURN v_is_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE FUNCTION TO GRANT FREE TOKENS TO NEW PREMIUM USERS
-- =====================================================

CREATE OR REPLACE FUNCTION grant_premium_welcome_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- If user just became premium, grant 100 free tokens
    IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
        -- Add 100 tokens to user_tokens
        INSERT INTO user_tokens (user_id, token_balance, updated_at)
        VALUES (NEW.user_id, 100, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            token_balance = user_tokens.token_balance + 100,
            updated_at = NOW();
        
        -- Record transaction
        INSERT INTO token_transactions (
            user_id,
            amount,
            transaction_type,
            description,
            metadata
        ) VALUES (
            NEW.user_id,
            100,
            'premium_bonus',
            'Welcome to Premium! 100 free tokens',
            jsonb_build_object('subscription_id', NEW.id, 'reason', 'premium_signup')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS grant_welcome_tokens_trigger ON premium_subscriptions;
CREATE TRIGGER grant_welcome_tokens_trigger
    AFTER INSERT OR UPDATE ON premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION grant_premium_welcome_tokens();

-- =====================================================
-- 8. VERIFY TABLES EXIST
-- =====================================================

-- Show all premium-related tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN (
    'token_packages',
    'premium_subscriptions', 
    'plan_features',
    'token_costs',
    'user_tokens',
    'token_transactions'
)
AND table_schema = 'public'
ORDER BY table_name;

-- Show token packages
SELECT id, name, tokens, price, active FROM token_packages ORDER BY tokens;

-- Show plan features  
SELECT feature_key, feature_label_sv, free_value_sv, premium_value_sv 
FROM plan_features 
WHERE active = true 
ORDER BY sort_order;

-- Show token costs
SELECT feature_key, feature_name_sv, cost_tokens 
FROM token_costs 
WHERE active = true;

SELECT '✅ Premium database setup complete!' as status;
