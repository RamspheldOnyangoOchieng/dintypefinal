-- Add metadata column to characters table for storing character creation details
-- This column stores the detailed attributes selected during character creation

-- Add metadata column as JSONB for flexible attribute storage
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add a comment explaining what this column is for
COMMENT ON COLUMN characters.metadata IS 'Stores character creation attributes like style, ethnicity, age, hair color, etc.';

-- Create an index on metadata for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_characters_metadata 
ON characters USING gin (metadata);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'characters' AND column_name = 'metadata';
