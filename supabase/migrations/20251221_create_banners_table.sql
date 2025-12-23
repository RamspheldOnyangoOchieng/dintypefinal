-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active banners
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON public.banners(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banners
-- Allow public read access to active banners
CREATE POLICY "Public can view active banners"
  ON public.banners
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to view all banners
CREATE POLICY "Authenticated users can view all banners"
  ON public.banners
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to insert banners (you can adjust this based on your admin setup)
CREATE POLICY "Admins can insert banners"
  ON public.banners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Allow admin users to update banners
CREATE POLICY "Admins can update banners"
  ON public.banners
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

-- Allow admin users to delete banners
CREATE POLICY "Admins can delete banners"
  ON public.banners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banners_updated_at_trigger
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION update_banners_updated_at();

-- Insert default banners
INSERT INTO public.banners (image_url, title, subtitle, button_text, button_link, link_url, is_active)
VALUES 
  (
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Su53G51ysIhrgtDSCWxEtmb5YHfRhN.png',
    'IMAGE GENERATOR',
    'Create the perfect image in seconds',
    'GENERATE NOW',
    '/generate',
    '/generate',
    true
  ),
  (
    '/placeholder.svg?height=244&width=1222',
    'PREMIUM FEATURES',
    'Unlock exclusive content with our premium plan',
    'UPGRADE NOW',
    '/premium',
    '/premium',
    true
  )
ON CONFLICT DO NOTHING;
