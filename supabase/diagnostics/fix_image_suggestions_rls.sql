-- Fix RLS policies for image_suggestions table to allow anonymous (public) read access

-- First, let's ensure RLS is enabled
ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active suggestions" ON public.image_suggestions;
DROP POLICY IF EXISTS "Public can view active image suggestions" ON public.image_suggestions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.image_suggestions;

-- Create a permissive policy for anonymous users to read active suggestions
CREATE POLICY "Allow public read access to active suggestions"
ON public.image_suggestions
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Optional: Allow authenticated users to see all suggestions
DROP POLICY IF EXISTS "Authenticated users view all suggestions" ON public.image_suggestions;
CREATE POLICY "Authenticated users view all suggestions"
ON public.image_suggestions
FOR SELECT
TO authenticated
USING (true);

-- Verify the policies were created
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'image_suggestions';
