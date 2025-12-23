-- ========================================
-- SAFE FIX: Grant Schema & Table Permissions
-- Avoids RLS policies that cause type mismatches
-- ========================================

-- ========================================
-- STEP 1: GRANT SCHEMA ACCESS (CRITICAL!)
-- ========================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- ========================================
-- STEP 2: SET DEFAULT PRIVILEGES
-- ========================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- ========================================
-- STEP 3: GRANT ACCESS TO ALL TABLES
-- ========================================

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- STEP 4: ENABLE RLS ON ALL TABLES
-- ========================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Enabled RLS on %', tbl.tablename;
    END LOOP;
END $$;

-- ========================================
-- STEP 5: RLS POLICIES (PUBLIC READ - SAFE)
-- These don't use auth.uid(), so no type issues
-- ========================================

-- BANNERS
DROP POLICY IF EXISTS "anon_read_banners" ON public.banners;
CREATE POLICY "anon_read_banners" ON public.banners FOR SELECT TO anon, authenticated USING (true);

-- IMAGE SUGGESTIONS
DROP POLICY IF EXISTS "anon_read_image_suggestions" ON public.image_suggestions;
CREATE POLICY "anon_read_image_suggestions" ON public.image_suggestions FOR SELECT TO anon, authenticated USING (true);

-- FAQS
DROP POLICY IF EXISTS "anon_read_faqs" ON public.faqs;
CREATE POLICY "anon_read_faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (true);

-- FAQ ITEMS
DROP POLICY IF EXISTS "anon_read_faq_items" ON public.faq_items;
CREATE POLICY "anon_read_faq_items" ON public.faq_items FOR SELECT TO anon, authenticated USING (true);

-- TOKEN PACKAGES
DROP POLICY IF EXISTS "anon_read_token_packages" ON public.token_packages;
CREATE POLICY "anon_read_token_packages" ON public.token_packages FOR SELECT TO anon, authenticated USING (true);

-- PREMIUM PAGE CONTENT
DROP POLICY IF EXISTS "anon_read_premium_page_content" ON public.premium_page_content;
CREATE POLICY "anon_read_premium_page_content" ON public.premium_page_content FOR SELECT TO anon, authenticated USING (true);

-- PLAN FEATURES
DROP POLICY IF EXISTS "anon_read_plan_features" ON public.plan_features;
CREATE POLICY "anon_read_plan_features" ON public.plan_features FOR SELECT TO anon, authenticated USING (true);

-- CHARACTERS
DROP POLICY IF EXISTS "anon_read_characters" ON public.characters;
CREATE POLICY "anon_read_characters" ON public.characters FOR SELECT TO anon, authenticated USING (true);

-- CHARACTER PROFILES
DROP POLICY IF EXISTS "anon_read_character_profiles" ON public.character_profiles;
CREATE POLICY "anon_read_character_profiles" ON public.character_profiles FOR SELECT TO anon, authenticated USING (true);

-- CHARACTER GALLERY
DROP POLICY IF EXISTS "anon_read_character_gallery" ON public.character_gallery;
CREATE POLICY "anon_read_character_gallery" ON public.character_gallery FOR SELECT TO anon, authenticated USING (true);

-- CHARACTER TAGS
DROP POLICY IF EXISTS "anon_read_character_tags" ON public.character_tags;
CREATE POLICY "anon_read_character_tags" ON public.character_tags FOR SELECT TO anon, authenticated USING (true);

-- SUBSCRIPTION PLANS
DROP POLICY IF EXISTS "anon_read_subscription_plans" ON public.subscription_plans;
CREATE POLICY "anon_read_subscription_plans" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (true);

-- BLOG POSTS
DROP POLICY IF EXISTS "anon_read_blog_posts" ON public.blog_posts;
CREATE POLICY "anon_read_blog_posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (true);

-- BLOG CATEGORIES
DROP POLICY IF EXISTS "anon_read_blog_categories" ON public.blog_categories;
CREATE POLICY "anon_read_blog_categories" ON public.blog_categories FOR SELECT TO anon, authenticated USING (true);

-- BLOG TAGS
DROP POLICY IF EXISTS "anon_read_blog_tags" ON public.blog_tags;
CREATE POLICY "anon_read_blog_tags" ON public.blog_tags FOR SELECT TO anon, authenticated USING (true);

-- MODELS
DROP POLICY IF EXISTS "anon_read_models" ON public.models;
CREATE POLICY "anon_read_models" ON public.models FOR SELECT TO anon, authenticated USING (true);

-- SLIDES
DROP POLICY IF EXISTS "anon_read_slides" ON public.slides;
CREATE POLICY "anon_read_slides" ON public.slides FOR SELECT TO anon, authenticated USING (true);

-- SUGGESTIONS
DROP POLICY IF EXISTS "anon_read_suggestions" ON public.suggestions;
CREATE POLICY "anon_read_suggestions" ON public.suggestions FOR SELECT TO anon, authenticated USING (true);

-- TAGS
DROP POLICY IF EXISTS "anon_read_tags" ON public.tags;
CREATE POLICY "anon_read_tags" ON public.tags FOR SELECT TO anon, authenticated USING (true);

-- TERMS
DROP POLICY IF EXISTS "anon_read_terms" ON public.terms;
CREATE POLICY "anon_read_terms" ON public.terms FOR SELECT TO anon, authenticated USING (true);

-- PAGE META
DROP POLICY IF EXISTS "anon_read_page_meta" ON public.page_meta;
CREATE POLICY "anon_read_page_meta" ON public.page_meta FOR SELECT TO anon, authenticated USING (true);

-- PAGE SEO
DROP POLICY IF EXISTS "anon_read_page_seo" ON public.page_seo;
CREATE POLICY "anon_read_page_seo" ON public.page_seo FOR SELECT TO anon, authenticated USING (true);

-- SEO SETTINGS
DROP POLICY IF EXISTS "anon_read_seo_settings" ON public.seo_settings;
CREATE POLICY "anon_read_seo_settings" ON public.seo_settings FOR SELECT TO anon, authenticated USING (true);

-- SITE SETTINGS
DROP POLICY IF EXISTS "anon_read_site_settings" ON public.site_settings;
CREATE POLICY "anon_read_site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- PRICING
DROP POLICY IF EXISTS "anon_read_pricing" ON public.pricing;
CREATE POLICY "anon_read_pricing" ON public.pricing FOR SELECT TO anon, authenticated USING (true);

-- PRICING SETTINGS
DROP POLICY IF EXISTS "anon_read_pricing_settings" ON public.pricing_settings;
CREATE POLICY "anon_read_pricing_settings" ON public.pricing_settings FOR SELECT TO anon, authenticated USING (true);

-- CONTENT BLOCKS
DROP POLICY IF EXISTS "anon_read_content_blocks" ON public.content_blocks;
CREATE POLICY "anon_read_content_blocks" ON public.content_blocks FOR SELECT TO anon, authenticated USING (true);

-- ========================================
-- STEP 6: USER-SPECIFIC TABLES (auth.uid() policies)
-- Only for tables with UUID user_id columns
-- ========================================

-- First, let's check which tables have UUID user_id columns and create policies dynamically
DO $$
DECLARE
    tbl RECORD;
    col_type TEXT;
BEGIN
    -- Tables that typically have user_id as UUID
    FOR tbl IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_name IN (
            'profiles', 'user_tokens', 'generated_images', 
            'token_transactions', 'payment_transactions',
            'premium_users', 'subscriptions', 'chat_messages',
            'saved_prompts', 'user_characters', 'user_images',
            'user_profiles', 'user_referrals'
        )
    LOOP
        -- Check if user_id or id column exists and is UUID
        SELECT data_type INTO col_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = tbl.table_name
        AND column_name IN ('user_id', 'id')
        AND data_type = 'uuid'
        LIMIT 1;
        
        IF col_type = 'uuid' THEN
            -- Check if it's user_id or id
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = tbl.table_name
                AND column_name = 'user_id' AND data_type = 'uuid'
            ) THEN
                -- Use user_id
                EXECUTE format('DROP POLICY IF EXISTS "auth_read_%s" ON public.%I', tbl.table_name, tbl.table_name);
                EXECUTE format('CREATE POLICY "auth_read_%s" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', tbl.table_name, tbl.table_name);
                RAISE NOTICE 'Created UUID policy for % using user_id', tbl.table_name;
            ELSIF tbl.table_name = 'profiles' THEN
                -- profiles uses id
                EXECUTE 'DROP POLICY IF EXISTS "auth_read_profiles" ON public.profiles';
                EXECUTE 'CREATE POLICY "auth_read_profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id)';
                RAISE NOTICE 'Created UUID policy for profiles using id';
            END IF;
        ELSE
            -- For tables without UUID user_id, allow all authenticated users to read
            EXECUTE format('DROP POLICY IF EXISTS "auth_all_read_%s" ON public.%I', tbl.table_name, tbl.table_name);
            EXECUTE format('CREATE POLICY "auth_all_read_%s" ON public.%I FOR SELECT TO authenticated USING (true)', tbl.table_name, tbl.table_name);
            RAISE NOTICE 'Created open policy for % (no UUID user_id)', tbl.table_name;
        END IF;
    END LOOP;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
  grantee,
  COUNT(*) as table_count
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee
ORDER BY grantee;

-- Show a sample of permissions
SELECT 
  grantee,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee, table_name
ORDER BY table_name, grantee
LIMIT 20;

-- ========================================
-- SUCCESS!
-- ========================================
