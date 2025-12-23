-- Fix RLS policies for banners table to allow anonymous (public) read access

-- First, let's ensure RLS is enabled
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active banners" ON public.banners;
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.banners;

-- Create a permissive policy for anonymous users to read active banners
CREATE POLICY "Allow public read access to active banners"
ON public.banners
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Optional: Allow authenticated users to see all banners
DROP POLICY IF EXISTS "Authenticated users view all" ON public.banners;
CREATE POLICY "Authenticated users view all"
ON public.banners
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
WHERE tablename = 'banners';
