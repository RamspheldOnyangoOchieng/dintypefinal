-- ============================================
-- FINAL CHARACTER TABLE MIGRATION
-- Date: 2025-11-09
-- Purpose: Make non-critical columns nullable for character creation
-- ============================================

-- Make age nullable with a default value
ALTER TABLE characters 
ALTER COLUMN age DROP NOT NULL;

ALTER TABLE characters 
ALTER COLUMN age SET DEFAULT 25;

-- Make description nullable (we build it from metadata)
ALTER TABLE characters 
ALTER COLUMN description DROP NOT NULL;

ALTER TABLE characters 
ALTER COLUMN description SET DEFAULT '';

-- Make system_prompt nullable with default
ALTER TABLE characters 
ALTER COLUMN system_prompt DROP NOT NULL;

ALTER TABLE characters 
ALTER COLUMN system_prompt SET DEFAULT 'You are a helpful AI companion.';

-- Make image nullable (we use image_url instead)
ALTER TABLE characters 
ALTER COLUMN image DROP NOT NULL;
