-- Add images column to characters table to support multiple profile photos
ALTER TABLE characters ADD COLUMN IF NOT EXISTS images TEXT[];

-- Comment: This column will store an array of image URLs (e.g. from Supabase Storage or Cloudinary)
-- Example: ARRAY['url1', 'url2', 'url3']

-- Update the view if necessary (often views need recreation if they rely on specific columns, but SELECT * usually picks it up)
-- No view recreation needed for basic SELECT * but good to be aware.
