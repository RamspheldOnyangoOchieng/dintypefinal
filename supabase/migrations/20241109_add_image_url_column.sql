-- Add image_url column to characters table if it doesn't exist
-- This allows us to store both the image path and full URL

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE characters ADD COLUMN image_url TEXT;
    
    -- Copy existing image values to image_url for existing records
    UPDATE characters SET image_url = image WHERE image_url IS NULL;
    
    RAISE NOTICE 'Added image_url column to characters table';
  ELSE
    RAISE NOTICE 'image_url column already exists';
  END IF;
END $$;

-- Also add user_id column if it doesn't exist (for proper user ownership)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE characters ADD COLUMN user_id UUID;
    
    RAISE NOTICE 'Added user_id column to characters table';
  ELSE
    RAISE NOTICE 'user_id column already exists';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE characters ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Added updated_at column to characters table';
  ELSE
    RAISE NOTICE 'updated_at column already exists';
  END IF;
END $$;

-- Add metadata column for storing character creation details
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE characters ADD COLUMN metadata JSONB;
    
    RAISE NOTICE 'Added metadata column to characters table';
  ELSE
    RAISE NOTICE 'metadata column already exists';
  END IF;
END $$;

-- Add voice column for character voice settings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'voice'
  ) THEN
    ALTER TABLE characters ADD COLUMN voice TEXT DEFAULT 'default';
    
    RAISE NOTICE 'Added voice column to characters table';
  ELSE
    RAISE NOTICE 'voice column already exists';
  END IF;
END $$;

-- Add is_public column for sharing characters
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE characters ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Added is_public column to characters table';
  ELSE
    RAISE NOTICE 'is_public column already exists';
  END IF;
END $$;

-- Add share_revenue column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'characters' 
    AND column_name = 'share_revenue'
  ) THEN
    ALTER TABLE characters ADD COLUMN share_revenue BOOLEAN DEFAULT TRUE;
    
    RAISE NOTICE 'Added share_revenue column to characters table';
  ELSE
    RAISE NOTICE 'share_revenue column already exists';
  END IF;
END $$;

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS characters_user_id_idx ON characters (user_id);

-- Update RLS policies to allow users to manage their own characters
DROP POLICY IF EXISTS "Users can manage their own characters" ON characters;
CREATE POLICY "Users can manage their own characters" 
  ON characters FOR ALL 
  USING (auth.uid() = user_id OR user_id IS NULL);
