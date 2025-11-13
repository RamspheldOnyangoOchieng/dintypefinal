-- Create storage bucket for media library
insert into storage.buckets (id, name, public)
values ('media-library', 'media-library', true)
on conflict (id) do nothing;

-- Storage policies are managed through the admin API routes
-- The bucket is public for reading, but uploads/deletes are controlled by:
-- 1. API routes that check admin role via auth.users metadata
-- 2. Server-side Supabase client with service role key

-- Note: To set up RLS policies manually in Supabase Dashboard:
-- Go to Storage > media-library > Policies
-- 
-- Policy 1: "Public read access"
--   Operation: SELECT
--   Target roles: public
--   USING expression: bucket_id = 'media-library'
--
-- Policy 2: "Authenticated upload"
--   Operation: INSERT
--   Target roles: authenticated
--   WITH CHECK: bucket_id = 'media-library'
--
-- Policy 3: "Admin delete"
--   Operation: DELETE
--   Target roles: authenticated
--   USING: bucket_id = 'media-library' AND 
--          (auth.jwt()->>'role')::text = 'admin'
