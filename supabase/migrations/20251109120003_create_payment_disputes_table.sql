-- Migration: Create payment_disputes table
-- Purpose: Track payment disputes and refunds
-- Created: 2025-11-09

-- Create payment_disputes table
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
  dispute_type TEXT, -- 'refund', 'chargeback', 'inquiry'
  evidence JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON public.payment_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON public.payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_stripe_dispute_id ON public.payment_disputes(stripe_dispute_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_transaction_id ON public.payment_disputes(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON public.payment_disputes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own disputes
CREATE POLICY "Users can view own payment_disputes"
  ON public.payment_disputes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policies: Admins can view all disputes
CREATE POLICY "Admins can view all payment_disputes"
  ON public.payment_disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policies: Admins can insert disputes
CREATE POLICY "Admins can insert payment_disputes"
  ON public.payment_disputes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policies: Admins can update disputes
CREATE POLICY "Admins can update payment_disputes"
  ON public.payment_disputes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policies: Service role can manage disputes (for webhooks)
CREATE POLICY "Service role can manage payment_disputes"
  ON public.payment_disputes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to create dispute from refund
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
    payment_transaction_id,
    user_id,
    amount,
    reason,
    stripe_charge_id,
    dispute_type,
    status
  )
  VALUES (
    p_payment_transaction_id,
    p_user_id,
    p_amount,
    p_reason,
    p_stripe_charge_id,
    'refund',
    'completed'
  )
  RETURNING id INTO v_dispute_id;
  
  RETURN v_dispute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_refund_dispute(UUID, UUID, DECIMAL, TEXT, TEXT) TO authenticated, service_role;

-- Function to get dispute statistics
CREATE OR REPLACE FUNCTION public.get_dispute_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_disputes BIGINT,
  total_amount NUMERIC,
  pending_disputes BIGINT,
  resolved_disputes BIGINT,
  refund_count BIGINT,
  chargeback_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_disputes,
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_disputes,
    COUNT(*) FILTER (WHERE status IN ('completed', 'resolved'))::BIGINT as resolved_disputes,
    COUNT(*) FILTER (WHERE dispute_type = 'refund')::BIGINT as refund_count,
    COUNT(*) FILTER (WHERE dispute_type = 'chargeback')::BIGINT as chargeback_count
  FROM public.payment_disputes
  WHERE 
    (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_dispute_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_payment_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_disputes_updated_at
  BEFORE UPDATE ON public.payment_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_disputes_updated_at();

-- Add comment
COMMENT ON TABLE public.payment_disputes IS 'Tracks payment disputes, refunds, and chargebacks';
