-- ========================================
-- SIMPLE FIX: Grant Permissions on All Tables
-- No complex PL/pgSQL - just straightforward SQL
-- ========================================

-- ========================================
-- STEP 1: GRANT SELECT PERMISSIONS
-- ========================================

-- Public tables (anon + authenticated can read)
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT SELECT ON public.image_suggestions TO anon, authenticated;
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT SELECT ON public.token_packages TO anon, authenticated;
GRANT SELECT ON public.premium_page_content TO anon, authenticated;
GRANT SELECT ON public.plan_features TO anon, authenticated;
GRANT SELECT ON public.characters TO anon, authenticated;
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;

-- Authenticated-only tables
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.user_tokens TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.generated_images TO authenticated;
GRANT SELECT, INSERT ON public.token_transactions TO authenticated;
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_profiles TO authenticated;

-- ========================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ========================================

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE RLS POLICIES
-- ========================================

-- BANNERS
DROP POLICY IF EXISTS "Public can read active banners" ON public.banners;
CREATE POLICY "Public can read active banners"
ON public.banners FOR SELECT
TO anon, authenticated
USING (is_active = true OR is_active IS NULL);

-- IMAGE SUGGESTIONS
DROP POLICY IF EXISTS "Public can read active suggestions" ON public.image_suggestions;
CREATE POLICY "Public can read active suggestions"
ON public.image_suggestions FOR SELECT
TO anon, authenticated
USING (is_active = true OR is_active IS NULL);

-- FAQS
DROP POLICY IF EXISTS "Public can read FAQs" ON public.faqs;
CREATE POLICY "Public can read FAQs"
ON public.faqs FOR SELECT
TO anon, authenticated
USING (true);

-- TOKEN PACKAGES
DROP POLICY IF EXISTS "Public can read token packages" ON public.token_packages;
CREATE POLICY "Public can read token packages"
ON public.token_packages FOR SELECT
TO anon, authenticated
USING (true);

-- PREMIUM PAGE CONTENT
DROP POLICY IF EXISTS "Public can read premium content" ON public.premium_page_content;
CREATE POLICY "Public can read premium content"
ON public.premium_page_content FOR SELECT
TO anon, authenticated
USING (true);

-- PLAN FEATURES
DROP POLICY IF EXISTS "Public can read plan features" ON public.plan_features;
CREATE POLICY "Public can read plan features"
ON public.plan_features FOR SELECT
TO anon, authenticated
USING (true);

-- CHARACTERS
DROP POLICY IF EXISTS "Public can read characters" ON public.characters;
CREATE POLICY "Public can read characters"
ON public.characters FOR SELECT
TO anon, authenticated
USING (true);

-- SUBSCRIPTION PLANS
DROP POLICY IF EXISTS "Public can read subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can read subscription plans"
ON public.subscription_plans FOR SELECT
TO anon, authenticated
USING (true);

-- USER PROFILES (users can only see/update their own)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- USER TOKENS (users can only see/update their own)
DROP POLICY IF EXISTS "Users can read own tokens" ON public.user_tokens;
CREATE POLICY "Users can read own tokens"
ON public.user_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_tokens;
CREATE POLICY "Users can update own tokens"
ON public.user_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- GENERATED IMAGES (users can only see/modify their own)
DROP POLICY IF EXISTS "Users can read own images" ON public.generated_images;
CREATE POLICY "Users can read own images"
ON public.generated_images FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own images" ON public.generated_images;
CREATE POLICY "Users can insert own images"
ON public.generated_images FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own images" ON public.generated_images;
CREATE POLICY "Users can delete own images"
ON public.generated_images FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- TOKEN TRANSACTIONS (users can only see their own)
DROP POLICY IF EXISTS "Users can read own transactions" ON public.token_transactions;
CREATE POLICY "Users can read own transactions"
ON public.token_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- PAYMENT TRANSACTIONS (users can only see their own)
DROP POLICY IF EXISTS "Users can read own payments" ON public.payment_transactions;
CREATE POLICY "Users can read own payments"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
  grantee,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND table_schema = 'public'
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- ========================================
-- SUCCESS!
-- ========================================
-- You should see a list of permissions above.
-- If a table doesn't exist, you'll get an error for that specific table
-- (which you can ignore - just means that table isn't in your database yet).
-- ========================================
