-- ========================================
-- COMPREHENSIVE FIX: Grant Permissions to All Public Tables
-- This script grants SELECT permissions to anon and authenticated roles
-- for all tables that need frontend access
-- ========================================

-- ========================================
-- PUBLIC READ ACCESS (anon + authenticated)
-- These tables should be readable by everyone
-- ========================================

-- Banners (homepage carousels)
GRANT SELECT ON public.banners TO anon, authenticated;

-- Image Suggestions (generate page)
GRANT SELECT ON public.image_suggestions TO anon, authenticated;

-- FAQs (help/support pages)
GRANT SELECT ON public.faqs TO anon, authenticated;

-- Token Packages (pricing page)
GRANT SELECT ON public.token_packages TO anon, authenticated;

-- Premium Page Content (premium page)
GRANT SELECT ON public.premium_page_content TO anon, authenticated;

-- Plan Features (pricing/features page)
GRANT SELECT ON public.plan_features TO anon, authenticated;

-- Characters (chat page - public galleries)
GRANT SELECT ON public.characters TO anon, authenticated;

-- Subscription Plans (pricing page)
GRANT SELECT ON public.subscription_plans TO anon, authenticated;

-- Blog Posts (if you have a blog)
GRANT SELECT ON public.blog_posts TO anon, authenticated;

-- ========================================
-- AUTHENTICATED USER ACCESS
-- These tables require authentication
-- ========================================

-- User Profiles
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- User Tokens
GRANT SELECT, UPDATE ON public.user_tokens TO authenticated;

-- Generated Images (user's own images)
GRANT SELECT, INSERT, DELETE ON public.generated_images TO authenticated;

-- Token Transactions (user's transaction history)
GRANT SELECT, INSERT ON public.token_transactions TO authenticated;

-- Payment Transactions
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;

-- Premium Profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_profiles TO authenticated;

-- User Premium Status
GRANT SELECT, INSERT, UPDATE ON public.user_premium_status TO authenticated;

-- Premium Users
GRANT SELECT, INSERT, DELETE ON public.premium_users TO authenticated;

-- ========================================
-- ENABLE RLS ON ALL TABLES
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
ALTER TABLE public.user_premium_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE RLS POLICIES
-- ========================================

-- BANNERS
DROP POLICY IF EXISTS "Public can read active banners" ON public.banners;
CREATE POLICY "Public can read active banners"
ON public.banners FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- IMAGE SUGGESTIONS
DROP POLICY IF EXISTS "Public can read active suggestions" ON public.image_suggestions;
CREATE POLICY "Public can read active suggestions"
ON public.image_suggestions FOR SELECT
TO anon, authenticated
USING (is_active = true);

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

-- USER PROFILES (users can only access their own)
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

-- USER TOKENS (users can only access their own)
DROP POLICY IF EXISTS "Users can read own tokens" ON public.user_tokens;
CREATE POLICY "Users can read own tokens"
ON public.user_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- GENERATED IMAGES (users can only access their own)
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

-- TOKEN TRANSACTIONS (users can only access their own)
DROP POLICY IF EXISTS "Users can read own transactions" ON public.token_transactions;
CREATE POLICY "Users can read own transactions"
ON public.token_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- PAYMENT TRANSACTIONS (users can only access their own)
DROP POLICY IF EXISTS "Users can read own payments" ON public.payment_transactions;
CREATE POLICY "Users can read own payments"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ========================================
-- VERIFICATION
-- ========================================

-- List all granted permissions
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- ========================================
-- SUCCESS!
-- ========================================
-- If you see the permissions listed above,
-- the fix is complete!
-- Refresh your frontend to test.
-- ========================================
