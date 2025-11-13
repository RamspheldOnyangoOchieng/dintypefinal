-- ============================================
-- COMPREHENSIVE CHARACTER TABLE MIGRATION
-- Date: 2025-11-09
-- Purpose: Ensure all required columns exist for character creation
-- ============================================

-- 1. Add metadata column if it doesn't exist
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add voice column if it doesn't exist
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'default';

-- 3. Ensure other commonly needed columns exist
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS personality TEXT;

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_metadata 
ON characters USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_characters_user_id 
ON characters(user_id);

CREATE INDEX IF NOT EXISTS idx_characters_created_at 
ON characters(created_at DESC);

-- 5. Add comments to document columns
COMMENT ON COLUMN characters.metadata IS 'Stores character creation attributes like style, ethnicity, age, etc.';
COMMENT ON COLUMN characters.voice IS 'Voice preference for the character (e.g., default, feminine, etc.)';
COMMENT ON COLUMN characters.description IS 'Character description text';
COMMENT ON COLUMN characters.personality IS 'Character personality type';
COMMENT ON COLUMN characters.is_public IS 'Whether the character is publicly visible';
