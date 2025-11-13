-- ============================================================================
-- COMPLETE DATABASE MIGRATIONS - RUN ALL AT ONCE
-- ============================================================================
-- Purpose: Create all missing tables for admin features
-- Created: 2025-11-09
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ADMIN_USERS TABLE
-- ============================================================================

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

DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
CREATE POLICY "Admins can insert admin_users"
  ON public.admin_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete admin_users" ON public.admin_users;
CREATE POLICY "Admins can delete admin_users"
  ON public.admin_users FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ============================================================================
-- 2. BANNED_USERS TABLE
-- ============================================================================

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

-- ============================================================================
-- 3. COST_LOGS TABLE
-- ============================================================================

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
-- 4. PAYMENT_DISPUTES TABLE
-- ============================================================================

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

CREATE OR REPLACE FUNCTION public.update_payment_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_disputes_updated_at ON public.payment_disputes;
CREATE TRIGGER payment_disputes_updated_at
  BEFORE UPDATE ON public.payment_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_disputes_updated_at();

-- ============================================================================
-- COMPLETE! ✅
-- ============================================================================

-- Verify tables were created
SELECT 
  'admin_users' as table_name, 
  COUNT(*) as row_count 
FROM public.admin_users
UNION ALL
SELECT 'banned_users', COUNT(*) FROM public.banned_users
UNION ALL
SELECT 'cost_logs', COUNT(*) FROM public.cost_logs
UNION ALL
SELECT 'payment_disputes', COUNT(*) FROM public.payment_disputes;
