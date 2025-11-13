-- Create plan_features table to store configurable plan features
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'core', 'content', 'support', 'customization'
    free_value JSONB NOT NULL,
    premium_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plan_restrictions table for managing limits
CREATE TABLE IF NOT EXISTS plan_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_type VARCHAR(20) NOT NULL, -- 'free' or 'premium'
    restriction_key VARCHAR(100) NOT NULL,
    restriction_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_type, restriction_key)
);

-- Create user_subscriptions table to track user plans
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'free',
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create user_usage_tracking table for enforcing limits
CREATE TABLE IF NOT EXISTS user_usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) NOT NULL, -- 'messages', 'images', 'girlfriends'
    usage_count INTEGER DEFAULT 0,
    reset_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, usage_type)
);

-- Create token_packages table for pay-as-you-go options
CREATE TABLE IF NOT EXISTS token_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tokens INTEGER NOT NULL,
    equivalent_images INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plan features
INSERT INTO plan_features (feature_key, feature_name, description, category, free_value, premium_value, display_order) VALUES
('text_messages', 'Text Messages', 'Daily message limit with your AI companions', 'core', '"10 messages/day"', '"Unlimited"', 1),
('active_girlfriends', 'AI Girlfriends', 'Number of active AI companions', 'content', '"1 active, up to 2 archived"', '"3 active, up to 50 archived"', 2),
('girlfriend_creation', 'AI Girlfriend Creation', 'Customization options available', 'customization', '"Basic only: Name + 1 avatar URL + 200-char bio"', '"Unlimited bio, multiple avatars, custom prompt templates, sliders, fetishes, memory, voice options"', 3),
('image_generation', 'Image Generation', 'Generate images during conversations', 'content', '"2 images per week, watermarked, NSFW blurred"', '"100 tokens/month included (~20 images). Premium images = no watermark, NSFW allowed (not blurred)"', 4),
('queue_priority', 'Queue Priority', 'Response speed priority', 'core', '"Slower (Lower Priority)"', '"High priority (fast responses)"', 5),
('tokens', 'Tokens', 'Monthly token allocation for image generation', 'content', '"Not available"', '"100/month auto-credit"', 6),
('response_speed', 'Response Speed', 'AI response generation speed', 'core', '"Standard (slower)"', '"Priority (faster)"', 7),
('chat_history', 'Chat History', 'How long chat history is retained', 'core', '"1 day"', '"Unlimited with subscribed"', 8),
('support', 'Support', 'Customer support access', 'support', '"Email support only"', '"Priority support"', 9),
('early_access', 'Early Feature Access', 'Access to new features before public release', 'support', '"No"', '"Yes"', 10),
('customization', 'Customization', 'Advanced customization capabilities', 'customization', '"Limited"', '"Full customization options"', 11)
ON CONFLICT (feature_key) DO NOTHING;

-- Insert default plan restrictions
INSERT INTO plan_restrictions (plan_type, restriction_key, restriction_value, description) VALUES
('free', 'daily_message_limit', '10', 'Maximum messages per day'),
('free', 'weekly_image_generation', '2', 'Maximum images per week'),
('free', 'active_girlfriends', '1', 'Maximum active AI companions'),
('free', 'archived_girlfriends', '2', 'Maximum archived AI companions'),
('free', 'bio_max_length', '200', 'Maximum character count for bio'),
('free', 'chat_history_days', '1', 'Days of chat history retention'),
('free', 'image_watermark', 'true', 'Add watermark to generated images'),
('free', 'nsfw_blurred', 'true', 'Blur NSFW content'),
('free', 'queue_priority', '"low"', 'Message queue priority level'),
('free', 'avatar_limit', '1', 'Maximum number of avatars per companion'),

('premium', 'daily_message_limit', 'null', 'Unlimited messages'),
('premium', 'monthly_tokens', '100', 'Monthly token allocation'),
('premium', 'active_girlfriends', '3', 'Maximum active AI companions'),
('premium', 'archived_girlfriends', '50', 'Maximum archived AI companions'),
('premium', 'bio_max_length', 'null', 'Unlimited bio length'),
('premium', 'chat_history_days', 'null', 'Unlimited chat history'),
('premium', 'image_watermark', 'false', 'No watermark on images'),
('premium', 'nsfw_blurred', 'false', 'NSFW content not blurred'),
('premium', 'queue_priority', '"high"', 'High priority in message queue'),
('premium', 'avatar_limit', 'null', 'Unlimited avatars'),
('premium', 'tokens_per_image', '5', 'Token cost per image generation')
ON CONFLICT (plan_type, restriction_key) DO NOTHING;

-- Insert default token packages
INSERT INTO token_packages (name, tokens, equivalent_images, price, display_order) VALUES
('Small Package', 200, 40, 9.99, 1),
('Medium Package', 550, 110, 24.99, 2),
('Large Package', 1550, 310, 49.99, 3),
('Mega Package', 5800, 1160, 149.99, 4)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plan_features (read-only for all, admin can modify)
CREATE POLICY "Anyone can view plan features"
    ON plan_features FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only admins can insert plan features"
    ON plan_features FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can update plan features"
    ON plan_features FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can delete plan features"
    ON plan_features FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for plan_restrictions
CREATE POLICY "Anyone can view plan restrictions"
    ON plan_restrictions FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage plan restrictions"
    ON plan_restrictions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can view all subscriptions"
    ON user_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert subscriptions"
    ON user_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update subscriptions"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ));

-- RLS Policies for user_usage_tracking
CREATE POLICY "Users can view their own usage"
    ON user_usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage tracking"
    ON user_usage_tracking FOR ALL
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ));

-- RLS Policies for token_packages
CREATE POLICY "Anyone can view active token packages"
    ON token_packages FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only admins can manage token packages"
    ON token_packages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_plan_features_category ON plan_features(category);
CREATE INDEX idx_plan_restrictions_plan_type ON plan_restrictions(plan_type);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_usage_tracking_user_id ON user_usage_tracking(user_id);
CREATE INDEX idx_token_packages_active ON token_packages(is_active);

-- Create function to check user plan type
CREATE OR REPLACE FUNCTION get_user_plan_type(p_user_id UUID)
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT COALESCE(plan_type, 'free')
        FROM user_subscriptions
        WHERE user_id = p_user_id
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can perform action
CREATE OR REPLACE FUNCTION check_user_limit(
    p_user_id UUID,
    p_restriction_key VARCHAR,
    p_current_usage INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan_type VARCHAR;
    v_limit JSONB;
    v_limit_value INTEGER;
BEGIN
    -- Get user's plan type
    v_plan_type := get_user_plan_type(p_user_id);
    
    -- Get the restriction value
    SELECT restriction_value INTO v_limit
    FROM plan_restrictions
    WHERE plan_type = v_plan_type
    AND restriction_key = p_restriction_key;
    
    -- If limit is null (unlimited), return true
    IF v_limit IS NULL OR v_limit::text = 'null' THEN
        RETURN TRUE;
    END IF;
    
    -- Convert to integer and check
    v_limit_value := (v_limit::text)::INTEGER;
    RETURN p_current_usage < v_limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
