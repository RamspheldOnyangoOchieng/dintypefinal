-- Fix PROFILES table RLS
-- Allows users to read their own profile, and admins to read all

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 1. Users can view own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- 2. Users can update own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 3. Users can insert own profile (if not exists)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 4. Admins can view all profiles (assuming admin_users table exists and has the user)
-- Note: This depends on how isAdmin is defined in SQL. 
-- For simplicity, we can trust the app logic or use a simple service_role check for admin operations for now, 
-- but if we want RLS to enforce admin access:
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON profiles TO postgres, service_role;
GRANT SELECT, UPDATE, INSERT ON profiles TO authenticated;

-- Ensure is_premium column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
        ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;
END $$;


-- Fix FOOTER_CONTENT table
CREATE TABLE IF NOT EXISTS footer_content (
    id SERIAL PRIMARY KEY,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for footer
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;

-- Drop footer policies
DROP POLICY IF EXISTS "Details are viewable by everyone" ON footer_content;
DROP POLICY IF EXISTS "Admins can update footer" ON footer_content;

-- Everyone can read footer
CREATE POLICY "Details are viewable by everyone" 
ON footer_content FOR SELECT 
TO anon, authenticated 
USING (true);

-- Only admins/service role can update (we'll just allow authenticated for now to unblock, or restrict to admin logic)
-- Letting service role do updates is safe. For the admin dashboard to update it, the user needs to be admin.
CREATE POLICY "Admins can update footer" 
ON footer_content FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

GRANT ALL ON footer_content TO postgres, service_role;
GRANT SELECT ON footer_content TO anon, authenticated;
GRANT ALL ON footer_content TO authenticated; -- Needed for upsert if policy allows

-- Insert default footer content if empty
INSERT INTO footer_content (id, content)
SELECT 1, '{
    "companyName": "Dintyp.se",
    "companyDescription": "AI Karaktärsutforskare ger uppslukande upplevelser med AI-flickvänner som känns verkliga.",
    "features": [
      { "id": 1, "title": "Skapa bild", "url": "/generate" },
      { "id": 2, "title": "Chatta", "url": "/chat" },
      { "id": 3, "title": "Skapa flickvän", "url": "/create-character" },
      { "id": 4, "title": "Utforska", "url": "/characters" }
    ],
    "legal": [
      { "id": 1, "title": "Regler och villkor", "url": "/villkor" },
      { "id": 2, "title": "Integritetspolicy", "url": "/integritetspolicy" }
    ],
    "aboutUs": [
      { "id": 1, "title": "Om oss", "url": "/om-oss" },
      { "id": 2, "title": "Kontakta oss", "url": "/kontakta" }
    ]
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM footer_content WHERE id = 1);
