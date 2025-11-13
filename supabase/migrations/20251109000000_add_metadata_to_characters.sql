-- Migration: Add metadata column to characters table
-- Date: 2025-11-09
-- Purpose: Store character creation attributes like style, ethnicity, age, etc.

-- Add metadata column to store character creation details
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for better performance when querying metadata
CREATE INDEX IF NOT EXISTS idx_characters_metadata 
ON characters USING GIN (metadata);

-- Add comment to document the column
COMMENT ON COLUMN characters.metadata IS 'Stores character creation attributes like style, ethnicity, age, etc.';
