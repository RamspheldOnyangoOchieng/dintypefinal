-- ============================================================================
-- UNIFIED COMPREHENSIVE MIGRATION
-- ============================================================================
-- This file combines all migrations in proper dependency order
-- Created: 2025-11-13
-- All RLS policies and dependencies are respected
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CORE FOUNDATION TABLES (No Dependencies)
-- ============================================================================

-- Debug Helpers
CREATE TABLE IF NOT EXISTS debug_test (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_column TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
CREATE POLICY "Anyone can read settings"
  ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage settings" ON public.settings;
CREATE POLICY "Service role can manage settings"
  ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SECTION 2: USER MANAGEMENT TABLES
-- ============================================================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
CREATE POLICY "Users can check own admin status"
  ON public.admin_users FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
CREATE POLICY "Admins can insert admin_users"
  ON public.admin_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete admin_users" ON public.admin_users;
CREATE POLICY "Admins can delete admin_users"
  ON public.admin_users FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin Helper Function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Banned Users Table
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  banned_until TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  banned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON public.banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_is_active ON public.banned_users(is_active);
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_until ON public.banned_users(banned_until);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view banned_users" ON public.banned_users;
CREATE POLICY "Admins can view banned_users"
  ON public.banned_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert banned_users" ON public.banned_users;
CREATE POLICY "Admins can insert banned_users"
  ON public.banned_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update banned_users" ON public.banned_users;
CREATE POLICY "Admins can update banned_users"
  ON public.banned_users FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete banned_users" ON public.banned_users;
CREATE POLICY "Admins can delete banned_users"
  ON public.banned_users FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Banned User Check Function
CREATE OR REPLACE FUNCTION public.is_user_banned(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  ban_record RECORD;
BEGIN
  SELECT * INTO ban_record FROM public.banned_users
  WHERE user_id = user_uuid AND is_active = TRUE LIMIT 1;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF ban_record.banned_until IS NULL THEN RETURN TRUE; END IF;
  
  IF ban_record.banned_until > NOW() THEN
    RETURN TRUE;
  ELSE
    UPDATE public.banned_users SET is_active = FALSE WHERE id = ban_record.id;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_user_banned(UUID) TO authenticated, anon;

-- User Tokens Table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);

ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tokens" ON public.user_tokens;
CREATE POLICY "Users can view own tokens"
  ON public.user_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tokens" ON public.user_tokens;
CREATE POLICY "Admins can view all tokens"
  ON public.user_tokens FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage tokens" ON public.user_tokens;
CREATE POLICY "Service role can manage tokens"
  ON public.user_tokens FOR ALL
  USING (true) WITH CHECK (true);

-- Auto-create user tokens on signup
CREATE OR REPLACE FUNCTION public.create_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_tokens();

-- Decrement Tokens Function
CREATE OR REPLACE FUNCTION public.decrement_user_tokens(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance
  FROM public.user_tokens
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User tokens not found for user_id: %', p_user_id;
  END IF;
  
  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.user_tokens
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.decrement_user_tokens(UUID, INTEGER) TO authenticated, service_role;

-- ============================================================================
-- SECTION 3: PAYMENT & SUBSCRIPTION TABLES
-- ============================================================================

-- Stripe Keys Table
CREATE TABLE IF NOT EXISTS public.stripe_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_publishable_key TEXT,
  test_secret_key TEXT,
  live_publishable_key TEXT,
  live_secret_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything" ON public.stripe_keys;
CREATE POLICY "Admins can do everything" ON public.stripe_keys
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Check Stripe Keys Policies Function
CREATE OR REPLACE FUNCTION check_stripe_keys_policies()
RETURNS TEXT AS $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'stripe_keys';
  
  RETURN 'Found ' || policy_count || ' policies on stripe_keys table';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_stripe_keys_policies() TO authenticated;

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_3months DECIMAL(10,2),
  price_12months DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_3months TEXT,
  stripe_price_id_12months TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Plan Features Table
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON public.plan_features(plan_id);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan features" ON public.plan_features;
CREATE POLICY "Anyone can view plan features"
  ON public.plan_features FOR SELECT USING (true);

-- Premium Profiles Table (Note: references subscription_plans)
CREATE TABLE IF NOT EXISTS premium_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'inactive',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_premium_profiles_user_id ON public.premium_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_profiles_stripe_customer_id ON public.premium_profiles(stripe_customer_id);

ALTER TABLE public.premium_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own premium profile" ON public.premium_profiles;
CREATE POLICY "Users can view own premium profile"
  ON public.premium_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all premium profiles" ON public.premium_profiles;
CREATE POLICY "Admins can view all premium profiles"
  ON public.premium_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage premium profiles" ON public.premium_profiles;
CREATE POLICY "Service role can manage premium profiles"
  ON public.premium_profiles FOR ALL
  USING (true) WITH CHECK (true);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'sek',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.payment_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.payment_transactions;
CREATE POLICY "Service role can manage transactions"
  ON public.payment_transactions FOR ALL
  USING (true) WITH CHECK (true);

-- Payment Disputes Table (depends on payment_transactions)
CREATE TABLE IF NOT EXISTS public.payment_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  stripe_dispute_id TEXT,
  stripe_charge_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  reason TEXT,
  status TEXT DEFAULT 'pending',
  dispute_type TEXT,
  evidence JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON public.payment_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON public.payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_stripe_dispute_id ON public.payment_disputes(stripe_dispute_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_transaction_id ON public.payment_disputes(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON public.payment_disputes(created_at DESC);

ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment_disputes" ON public.payment_disputes;
CREATE POLICY "Users can view own payment_disputes"
  ON public.payment_disputes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payment_disputes" ON public.payment_disputes;
CREATE POLICY "Admins can view all payment_disputes"
  ON public.payment_disputes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert payment_disputes" ON public.payment_disputes;
CREATE POLICY "Admins can insert payment_disputes"
  ON public.payment_disputes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update payment_disputes" ON public.payment_disputes;
CREATE POLICY "Admins can update payment_disputes"
  ON public.payment_disputes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage payment_disputes" ON public.payment_disputes;
CREATE POLICY "Service role can manage payment_disputes"
  ON public.payment_disputes FOR ALL USING (true) WITH CHECK (true);

-- Revenue Transactions Table
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_transactions_user_id ON public.revenue_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_type ON public.revenue_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created_at ON public.revenue_transactions(created_at DESC);

ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all revenue" ON public.revenue_transactions;
CREATE POLICY "Admins can view all revenue"
  ON public.revenue_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage revenue" ON public.revenue_transactions;
CREATE POLICY "Service role can manage revenue"
  ON public.revenue_transactions FOR ALL
  USING (true) WITH CHECK (true);

-- Token Packages Table
CREATE TABLE IF NOT EXISTS token_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_packages_is_active ON public.token_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_token_packages_display_order ON public.token_packages(display_order);

ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.token_packages;
CREATE POLICY "Anyone can view active packages"
  ON public.token_packages FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage packages" ON public.token_packages;
CREATE POLICY "Admins can manage packages"
  ON public.token_packages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 4: COST TRACKING
-- ============================================================================

-- Cost Logs Table
CREATE TABLE IF NOT EXISTS public.cost_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  cost INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_logs_user_id ON public.cost_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_logs_action_type ON public.cost_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_cost_logs_created_at ON public.cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_logs_user_created ON public.cost_logs(user_id, created_at DESC);

ALTER TABLE public.cost_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cost_logs" ON public.cost_logs;
CREATE POLICY "Users can view own cost_logs"
  ON public.cost_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all cost_logs" ON public.cost_logs;
CREATE POLICY "Admins can view all cost_logs"
  ON public.cost_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can insert cost_logs" ON public.cost_logs;
CREATE POLICY "Service role can insert cost_logs"
  ON public.cost_logs FOR INSERT WITH CHECK (true);

-- Cost Logging Functions
CREATE OR REPLACE FUNCTION public.log_token_cost(
  p_user_id UUID,
  p_action_type TEXT,
  p_cost INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.cost_logs (user_id, action_type, cost, metadata)
  VALUES (p_user_id, p_action_type, p_cost, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_token_cost(UUID, TEXT, INTEGER, JSONB) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_user_total_cost(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(cost), 0) INTO v_total FROM public.cost_logs WHERE user_id = p_user_id;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_total_cost(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_cost_breakdown(
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (action_type TEXT, total_cost BIGINT, usage_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT cl.action_type, SUM(cl.cost)::BIGINT, COUNT(*)::BIGINT
  FROM public.cost_logs cl
  WHERE (p_user_id IS NULL OR cl.user_id = p_user_id)
    AND (p_start_date IS NULL OR cl.created_at >= p_start_date)
    AND (p_end_date IS NULL OR cl.created_at <= p_end_date)
  GROUP BY cl.action_type ORDER BY SUM(cl.cost) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_cost_breakdown(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- ============================================================================
-- SECTION 5: CHARACTERS & CONTENT TABLES
-- ============================================================================

-- Characters Table (core content table)
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  avatar_url TEXT,
  video_url TEXT,
  image_url TEXT,
  voice TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_is_active ON public.characters(is_active);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON public.characters(created_at DESC);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active characters" ON public.characters;
CREATE POLICY "Anyone can view active characters"
  ON public.characters FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage characters" ON public.characters;
CREATE POLICY "Admins can manage characters"
  ON public.characters FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage characters" ON public.characters;
CREATE POLICY "Service role can manage characters"
  ON public.characters FOR ALL
  USING (true) WITH CHECK (true);

-- Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_character_id ON public.collections(character_id);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own collections" ON public.collections;
CREATE POLICY "Users can manage own collections"
  ON public.collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Generated Images Table
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_character_id ON public.generated_images(character_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON public.generated_images(created_at DESC);

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own images" ON public.generated_images;
CREATE POLICY "Users can view own images"
  ON public.generated_images FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own images" ON public.generated_images;
CREATE POLICY "Users can insert own images"
  ON public.generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all images" ON public.generated_images;
CREATE POLICY "Admins can view all images"
  ON public.generated_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anonymous users can view public images" ON public.generated_images;
CREATE POLICY "Anonymous users can view public images"
  ON public.generated_images FOR SELECT
  USING (true);

-- Saved Prompts Table
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  category TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON public.saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_character_id ON public.saved_prompts(character_id);

ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own prompts" ON public.saved_prompts;
CREATE POLICY "Users can manage own prompts"
  ON public.saved_prompts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECTION 6: CMS & CONTENT MANAGEMENT
-- ============================================================================

-- FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_en TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  question_sv TEXT,
  answer_sv TEXT,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON public.faqs(display_order);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active FAQs" ON public.faqs;
CREATE POLICY "Anyone can view active FAQs"
  ON public.faqs FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;
CREATE POLICY "Admins can manage FAQs"
  ON public.faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Footer Content Table
CREATE TABLE IF NOT EXISTS footer_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  title_en TEXT,
  title_sv TEXT,
  content_en TEXT,
  content_sv TEXT,
  links JSONB,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.footer_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view footer content" ON public.footer_content;
CREATE POLICY "Anyone can view footer content"
  ON public.footer_content FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage footer content" ON public.footer_content;
CREATE POLICY "Admins can manage footer content"
  ON public.footer_content FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Page Meta Table
CREATE TABLE IF NOT EXISTS page_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug TEXT UNIQUE NOT NULL,
  title_en TEXT,
  title_sv TEXT,
  description_en TEXT,
  description_sv TEXT,
  keywords TEXT[],
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.page_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view page meta" ON public.page_meta;
CREATE POLICY "Anyone can view page meta"
  ON public.page_meta FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage page meta" ON public.page_meta;
CREATE POLICY "Admins can manage page meta"
  ON public.page_meta FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Premium Page Content Table
CREATE TABLE IF NOT EXISTS premium_page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  title_en TEXT,
  title_sv TEXT,
  content_en TEXT,
  content_sv TEXT,
  features JSONB,
  cta_text_en TEXT,
  cta_text_sv TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.premium_page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view premium page content" ON public.premium_page_content;
CREATE POLICY "Anyone can view premium page content"
  ON public.premium_page_content FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage premium page content" ON public.premium_page_content;
CREATE POLICY "Admins can manage premium page content"
  ON public.premium_page_content FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Blog Post Tags Table
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_name_en TEXT NOT NULL,
  tag_name_sv TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view blog tags" ON public.blog_post_tags;
CREATE POLICY "Anyone can view blog tags"
  ON public.blog_post_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage blog tags" ON public.blog_post_tags;
CREATE POLICY "Admins can manage blog tags"
  ON public.blog_post_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT UNIQUE NOT NULL,
  subject_en TEXT,
  subject_sv TEXT,
  body_en TEXT,
  body_sv TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can read email templates" ON public.email_templates;
CREATE POLICY "Service role can read email templates"
  ON public.email_templates FOR SELECT USING (true);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  doc_type TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON public.documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
CREATE POLICY "Admins can manage documents"
  ON public.documents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ============================================================================
-- SECTION 7: HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Delete User Function
CREATE OR REPLACE FUNCTION public.delete_user(user_id_to_delete UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete from auth.users (cascades to related tables)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- Create Refund Dispute Function
CREATE OR REPLACE FUNCTION public.create_refund_dispute(
  p_payment_transaction_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_reason TEXT DEFAULT NULL,
  p_stripe_charge_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_dispute_id UUID;
BEGIN
  INSERT INTO public.payment_disputes (
    payment_transaction_id, user_id, amount, reason, stripe_charge_id, dispute_type, status
  )
  VALUES (p_payment_transaction_id, p_user_id, p_amount, p_reason, p_stripe_charge_id, 'refund', 'completed')
  RETURNING id INTO v_dispute_id;
  RETURN v_dispute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_refund_dispute(UUID, UUID, DECIMAL, TEXT, TEXT) TO authenticated, service_role;

-- Get Dispute Stats Function
CREATE OR REPLACE FUNCTION public.get_dispute_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_disputes BIGINT, total_amount NUMERIC, pending_disputes BIGINT,
  resolved_disputes BIGINT, refund_count BIGINT, chargeback_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(amount), 0),
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status IN ('completed', 'resolved'))::BIGINT,
    COUNT(*) FILTER (WHERE dispute_type = 'refund')::BIGINT,
    COUNT(*) FILTER (WHERE dispute_type = 'chargeback')::BIGINT
  FROM public.payment_disputes
  WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_dispute_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Update Triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'admin_users', 'banned_users', 'user_tokens', 'settings', 'stripe_keys',
      'subscription_plans', 'premium_profiles', 'payment_transactions', 
      'payment_disputes', 'token_packages', 'revenue_transactions',
      'characters', 'saved_prompts', 'faqs', 'footer_content', 
      'page_meta', 'premium_page_content', 'email_templates', 'documents'
    )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at 
      BEFORE UPDATE ON public.%I 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE ✅
-- ============================================================================

-- Verify core tables were created
SELECT 
  'admin_users' as table_name, COUNT(*) as row_count FROM public.admin_users
UNION ALL SELECT 'user_tokens', COUNT(*) FROM public.user_tokens
UNION ALL SELECT 'characters', COUNT(*) FROM public.characters
UNION ALL SELECT 'payment_transactions', COUNT(*) FROM public.payment_transactions
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM public.subscription_plans
UNION ALL SELECT 'token_packages', COUNT(*) FROM public.token_packages;
