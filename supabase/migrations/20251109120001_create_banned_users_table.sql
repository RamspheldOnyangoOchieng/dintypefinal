-- Migration: Create banned_users table
-- Purpose: Track banned users with ban duration and reason
-- Created: 2025-11-09

-- Create banned_users table
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON public.banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_is_active ON public.banned_users(is_active);
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_until ON public.banned_users(banned_until);

-- Enable Row Level Security
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can view banned users
CREATE POLICY "Admins can view banned_users"
  ON public.banned_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policies: Only admins can insert bans
CREATE POLICY "Admins can insert banned_users"
  ON public.banned_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policies: Only admins can update bans
CREATE POLICY "Admins can update banned_users"
  ON public.banned_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Policies: Only admins can delete bans
CREATE POLICY "Admins can delete banned_users"
  ON public.banned_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  ban_record RECORD;
BEGIN
  SELECT * INTO ban_record
  FROM public.banned_users
  WHERE user_id = user_uuid
    AND is_active = TRUE
  LIMIT 1;
  
  -- No ban record found
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Permanent ban (no end date)
  IF ban_record.banned_until IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Temporary ban - check if still active
  IF ban_record.banned_until > NOW() THEN
    RETURN TRUE;
  ELSE
    -- Ban expired, deactivate it
    UPDATE public.banned_users
    SET is_active = FALSE
    WHERE id = ban_record.id;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_user_banned(UUID) TO authenticated, anon;

-- Add comment
COMMENT ON TABLE public.banned_users IS 'Tracks banned users with ban duration and reason';
