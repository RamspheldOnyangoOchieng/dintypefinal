-- Migration: Create cost_logs table
-- Purpose: Track token usage costs by action type
-- Created: 2025-11-09

-- Create cost_logs table
CREATE TABLE IF NOT EXISTS public.cost_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  cost INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cost_logs_user_id ON public.cost_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_logs_action_type ON public.cost_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_cost_logs_created_at ON public.cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_logs_user_created ON public.cost_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.cost_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own cost logs
CREATE POLICY "Users can view own cost_logs"
  ON public.cost_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policies: Admins can view all cost logs
CREATE POLICY "Admins can view all cost_logs"
  ON public.cost_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policies: System can insert cost logs (service role)
CREATE POLICY "Service role can insert cost_logs"
  ON public.cost_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to log token cost
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_token_cost(UUID, TEXT, INTEGER, JSONB) TO authenticated, service_role;

-- Function to get user total costs
CREATE OR REPLACE FUNCTION public.get_user_total_cost(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(cost), 0) INTO v_total
  FROM public.cost_logs
  WHERE user_id = p_user_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_total_cost(UUID) TO authenticated;

-- Function to get cost breakdown by action type
CREATE OR REPLACE FUNCTION public.get_cost_breakdown(
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  action_type TEXT,
  total_cost BIGINT,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.action_type,
    SUM(cl.cost)::BIGINT as total_cost,
    COUNT(*)::BIGINT as usage_count
  FROM public.cost_logs cl
  WHERE 
    (p_user_id IS NULL OR cl.user_id = p_user_id)
    AND (p_start_date IS NULL OR cl.created_at >= p_start_date)
    AND (p_end_date IS NULL OR cl.created_at <= p_end_date)
  GROUP BY cl.action_type
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_cost_breakdown(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Add comment
COMMENT ON TABLE public.cost_logs IS 'Tracks token usage costs by action type for analytics';
