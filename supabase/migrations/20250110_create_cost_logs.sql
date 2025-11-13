-- Create cost_logs table for budget monitoring
CREATE TABLE IF NOT EXISTS cost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  api_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast monthly queries
CREATE INDEX IF NOT EXISTS idx_cost_logs_created_at ON cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_logs_user_id ON cost_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_logs_action ON cost_logs(action);

-- Grant permissions
GRANT SELECT, INSERT ON cost_logs TO authenticated;
GRANT SELECT, INSERT ON cost_logs TO anon;

-- Admin can view all cost logs
GRANT ALL ON cost_logs TO service_role;

COMMENT ON TABLE cost_logs IS 'Tracks API costs and token usage for budget monitoring';
COMMENT ON COLUMN cost_logs.action IS 'Type of action (e.g., Chat message, Image generation)';
COMMENT ON COLUMN cost_logs.tokens_used IS 'Tokens charged to user';
COMMENT ON COLUMN cost_logs.api_cost IS 'Actual API cost in USD';
