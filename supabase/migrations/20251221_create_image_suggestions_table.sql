-- Create image_suggestions table
CREATE TABLE IF NOT EXISTS public.image_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_image_suggestions_category ON public.image_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_image_suggestions_is_active ON public.image_suggestions(is_active);
CREATE INDEX IF NOT EXISTS idx_image_suggestions_created_at ON public.image_suggestions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_suggestions
-- Allow public read access to active suggestions
CREATE POLICY "Public can view active image suggestions"
  ON public.image_suggestions
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to view all suggestions
CREATE POLICY "Authenticated users can view all image suggestions"
  ON public.image_suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to insert suggestions
CREATE POLICY "Admins can insert image suggestions"
  ON public.image_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Allow admin users to update suggestions
CREATE POLICY "Admins can update image suggestions"
  ON public.image_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Allow admin users to delete suggestions
CREATE POLICY "Admins can delete image suggestions"
  ON public.image_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER image_suggestions_updated_at_trigger
  BEFORE UPDATE ON public.image_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_image_suggestions_updated_at();

-- Insert some default image suggestions (you can customize these)
INSERT INTO public.image_suggestions (name, category, image, is_active)
VALUES 
  ('Portrait', 'People', 'https://example.com/portrait.jpg', true),
  ('Landscape', 'Nature', 'https://example.com/landscape.jpg', true),
  ('Abstract Art', 'Art', 'https://example.com/abstract.jpg', true),
  ('City Skyline', 'Urban', 'https://example.com/city.jpg', true),
  ('Sunset Beach', 'Nature', 'https://example.com/beach.jpg', true)
ON CONFLICT DO NOTHING;
