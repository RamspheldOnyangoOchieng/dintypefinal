-- Migration: Add voice column to characters table
-- Date: 2025-11-09
-- Purpose: Store voice preference for the character

-- Add voice column to store voice preference
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'default';

-- Add comment to document the column
COMMENT ON COLUMN characters.voice IS 'Voice preference for the character (e.g., default, feminine, etc.)';
