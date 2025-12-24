-- Fix RLS policies for attribute_images table
-- This allows the service role to insert/update image metadata

-- Enable RLS if not already enabled
ALTER TABLE attribute_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can manage attribute images" ON attribute_images;
DROP POLICY IF EXISTS "Public can view attribute images" ON attribute_images;

-- Allow service role to do everything (for scripts)
CREATE POLICY "Service role can manage attribute images"
ON attribute_images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow anon/authenticated users to read
CREATE POLICY "Public can view attribute images"
ON attribute_images
FOR SELECT
TO anon, authenticated
USING (true);

-- Grant permissions
GRANT ALL ON attribute_images TO service_role;
GRANT SELECT ON attribute_images TO anon, authenticated;

-- Verify the table structure (should have these columns)
-- If missing, add them:
DO $$ 
BEGIN
    -- Add category column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'category') THEN
        ALTER TABLE attribute_images ADD COLUMN category TEXT NOT NULL DEFAULT 'personality';
    END IF;

    -- Add value column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'value') THEN
        ALTER TABLE attribute_images ADD COLUMN value TEXT NOT NULL;
    END IF;

    -- Add style column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'style') THEN
        ALTER TABLE attribute_images ADD COLUMN style TEXT NOT NULL DEFAULT 'realistic';
    END IF;

    -- Add image_url column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'image_url') THEN
        ALTER TABLE attribute_images ADD COLUMN image_url TEXT NOT NULL;
    END IF;

    -- Add prompt column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'prompt') THEN
        ALTER TABLE attribute_images ADD COLUMN prompt TEXT;
    END IF;

    -- Add width column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'width') THEN
        ALTER TABLE attribute_images ADD COLUMN width INTEGER;
    END IF;

    -- Add height column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'height') THEN
        ALTER TABLE attribute_images ADD COLUMN height INTEGER;
    END IF;

    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'created_at') THEN
        ALTER TABLE attribute_images ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attribute_images' AND column_name = 'updated_at') THEN
        ALTER TABLE attribute_images ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'attribute_images_category_value_style_key'
    ) THEN
        ALTER TABLE attribute_images 
        ADD CONSTRAINT attribute_images_category_value_style_key 
        UNIQUE (category, value, style);
    END IF;
END $$;

-- Show current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attribute_images'
ORDER BY ordinal_position;
