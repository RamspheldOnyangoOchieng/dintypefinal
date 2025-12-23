-- Enable RLS (if not enabled)
ALTER TABLE attribute_images ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service_role and postgres
GRANT ALL ON TABLE attribute_images TO service_role;
GRANT ALL ON TABLE attribute_images TO postgres;
GRANT ALL ON TABLE attribute_images TO anon;
GRANT ALL ON TABLE attribute_images TO authenticated;

-- Create policy for service_role to have full access (explicitly)
DROP POLICY IF EXISTS "Service role full access" ON attribute_images;
CREATE POLICY "Service role full access"
ON attribute_images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for public read access
DROP POLICY IF EXISTS "Public read access" ON attribute_images;
CREATE POLICY "Public read access"
ON attribute_images
FOR SELECT
TO anon, authenticated
USING (true);

-- Debug: Check policies
SELECT * FROM pg_policies WHERE tablename = 'attribute_images';
