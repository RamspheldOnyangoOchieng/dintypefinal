-- ============================================================================
-- CHAT SYSTEM TABLES
-- Migration: 20251113000001_create_chat_tables.sql
-- Description: Create database tables for persistent chat storage
-- ============================================================================

-- ============================================================================
-- 1. CONVERSATION_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  title TEXT, -- Auto-generated from first message
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversation_sessions
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON public.conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_character_id ON public.conversation_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_last_message_at ON public.conversation_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_character ON public.conversation_sessions(user_id, character_id);

-- Unique constraint: one active session per user-character pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_sessions_user_character_active 
  ON public.conversation_sessions(user_id, character_id) 
  WHERE is_archived = false;

COMMENT ON TABLE public.conversation_sessions IS 'Chat sessions between users and characters';
COMMENT ON COLUMN public.conversation_sessions.title IS 'Auto-generated from first message content';
COMMENT ON COLUMN public.conversation_sessions.message_count IS 'Cached count of messages in this session';

-- ============================================================================
-- 2. MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  is_image BOOLEAN DEFAULT false,
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- For token cost, API response time, model used, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON public.messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);

COMMENT ON TABLE public.messages IS 'Individual chat messages in conversation sessions';
COMMENT ON COLUMN public.messages.role IS 'Message sender: user, assistant (AI), or system';
COMMENT ON COLUMN public.messages.metadata IS 'Additional data: token_cost, api_latency, model, etc.';

-- ============================================================================
-- 3. MESSAGE_USAGE_TRACKING TABLE
-- ============================================================================

-- Track daily message counts for rate limiting (free vs premium)
CREATE TABLE IF NOT EXISTS public.message_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_message_usage_tracking_user_id ON public.message_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_tracking_date ON public.message_usage_tracking(date);

COMMENT ON TABLE public.message_usage_tracking IS 'Daily message counts for enforcing free plan limits';

-- ============================================================================
-- 4. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update conversation session on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversation_sessions
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW(),
    -- Auto-generate title from first user message
    title = CASE 
      WHEN title IS NULL AND NEW.role = 'user' 
      THEN LEFT(NEW.content, 50) 
      ELSE title 
    END
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating conversation on message insert
DROP TRIGGER IF EXISTS on_message_insert_update_conversation ON public.messages;
CREATE TRIGGER on_message_insert_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to increment daily message usage
CREATE OR REPLACE FUNCTION increment_message_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count user messages (not AI responses)
  IF NEW.role = 'user' THEN
    INSERT INTO public.message_usage_tracking (user_id, date, message_count)
    VALUES (NEW.user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
      message_count = public.message_usage_tracking.message_count + 1,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for incrementing message usage
DROP TRIGGER IF EXISTS on_message_insert_increment_usage ON public.messages;
CREATE TRIGGER on_message_insert_increment_usage
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_message_usage();

-- Function to get or create conversation session
CREATE OR REPLACE FUNCTION get_or_create_conversation_session(
  p_user_id UUID,
  p_character_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Try to find existing active session
  SELECT id INTO v_session_id
  FROM public.conversation_sessions
  WHERE user_id = p_user_id 
    AND character_id = p_character_id 
    AND is_archived = false
  LIMIT 1;
  
  -- Create new session if none exists
  IF v_session_id IS NULL THEN
    INSERT INTO public.conversation_sessions (user_id, character_id)
    VALUES (p_user_id, p_character_id)
    RETURNING id INTO v_session_id;
  END IF;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_or_create_conversation_session(UUID, UUID) TO authenticated;

-- Function to check daily message limit
CREATE OR REPLACE FUNCTION check_daily_message_limit(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  is_premium BOOLEAN
) AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Check if user has active premium
  SELECT EXISTS (
    SELECT 1 FROM public.premium_profiles
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expires_at > NOW()
  ) INTO v_is_premium;
  
  -- Set limit based on premium status
  v_limit := CASE WHEN v_is_premium THEN 999999 ELSE 100 END;
  
  -- Get today's usage
  SELECT COALESCE(message_count, 0) INTO v_current_usage
  FROM public.message_usage_tracking
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  RETURN QUERY SELECT 
    (v_current_usage < v_limit) AS allowed,
    v_current_usage AS current_usage,
    v_limit AS limit_value,
    v_is_premium AS is_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_daily_message_limit(UUID) TO authenticated;

-- Function to get conversation history
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_user_id UUID,
  p_character_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  is_image BOOLEAN,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Get the active session
  SELECT conversation_sessions.id INTO v_session_id
  FROM public.conversation_sessions
  WHERE user_id = p_user_id 
    AND character_id = p_character_id 
    AND is_archived = false
  LIMIT 1;
  
  -- Return messages if session exists
  IF v_session_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      m.id,
      m.role,
      m.content,
      m.is_image,
      m.image_url,
      m.created_at
    FROM public.messages m
    WHERE m.session_id = v_session_id
    ORDER BY m.created_at ASC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_conversation_history(UUID, UUID, INTEGER) TO authenticated;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_usage_tracking ENABLE ROW LEVEL SECURITY;

-- conversation_sessions policies
DROP POLICY IF EXISTS "Users can view own conversation_sessions" ON public.conversation_sessions;
CREATE POLICY "Users can view own conversation_sessions"
  ON public.conversation_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own conversation_sessions" ON public.conversation_sessions;
CREATE POLICY "Users can create own conversation_sessions"
  ON public.conversation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversation_sessions" ON public.conversation_sessions;
CREATE POLICY "Users can update own conversation_sessions"
  ON public.conversation_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversation_sessions" ON public.conversation_sessions;
CREATE POLICY "Users can delete own conversation_sessions"
  ON public.conversation_sessions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all conversation_sessions" ON public.conversation_sessions;
CREATE POLICY "Admins can view all conversation_sessions"
  ON public.conversation_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage conversation_sessions" ON public.conversation_sessions;
CREATE POLICY "Service role can manage conversation_sessions"
  ON public.conversation_sessions FOR ALL
  USING (true) WITH CHECK (true);

-- messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own messages" ON public.messages;
CREATE POLICY "Users can create own messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage messages" ON public.messages;
CREATE POLICY "Service role can manage messages"
  ON public.messages FOR ALL
  USING (true) WITH CHECK (true);

-- message_usage_tracking policies
DROP POLICY IF EXISTS "Users can view own message_usage_tracking" ON public.message_usage_tracking;
CREATE POLICY "Users can view own message_usage_tracking"
  ON public.message_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all message_usage_tracking" ON public.message_usage_tracking;
CREATE POLICY "Admins can view all message_usage_tracking"
  ON public.message_usage_tracking FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage message_usage_tracking" ON public.message_usage_tracking;
CREATE POLICY "Service role can manage message_usage_tracking"
  ON public.message_usage_tracking FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS set_conversation_sessions_updated_at ON public.conversation_sessions;
CREATE TRIGGER set_conversation_sessions_updated_at
  BEFORE UPDATE ON public.conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_message_usage_tracking_updated_at ON public.message_usage_tracking;
CREATE TRIGGER set_message_usage_tracking_updated_at
  BEFORE UPDATE ON public.message_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Chat system tables added: conversation_sessions, messages, message_usage_tracking';
