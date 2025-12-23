-- ========================================
-- SAFE FIX: Grant Permissions (Skip Missing Tables)
-- FIXED: Resolved variable naming conflict
-- ========================================

DO $$ 
DECLARE
    table_record RECORD;
    tables_to_fix TEXT[] := ARRAY[
        'banners',
        'image_suggestions',
        'faqs',
        'token_packages',
        'premium_page_content',
        'plan_features',
        'characters',
        'subscription_plans',
        'profiles',
        'user_tokens',
        'generated_images',
        'token_transactions',
        'payment_transactions',
        'premium_profiles',
        'user_premium_status',
        'premium_users',
        'blog_posts'
    ];
    tbl_name TEXT;  -- FIXED: Renamed from table_name to avoid conflict
    sql_stmt TEXT;
BEGIN
    -- Grant SELECT to anon and authenticated for each table that exists
    FOREACH tbl_name IN ARRAY tables_to_fix
    LOOP
        -- Check if table exists
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tbl_name  -- Now unambiguous!
        ) THEN
            -- Grant SELECT permission
            sql_stmt := format('GRANT SELECT ON public.%I TO anon, authenticated', tbl_name);
            EXECUTE sql_stmt;
            RAISE NOTICE 'Granted SELECT on % to anon, authenticated', tbl_name;
            
            -- Enable RLS
            sql_stmt := format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
            EXECUTE sql_stmt;
            RAISE NOTICE 'Enabled RLS on %', tbl_name;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', tbl_name;
        END IF;
    END LOOP;
    
    -- Grant additional permissions for authenticated-only tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        GRANT UPDATE ON public.profiles TO authenticated;
        RAISE NOTICE 'Granted UPDATE on profiles to authenticated';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_tokens') THEN
        GRANT UPDATE ON public.user_tokens TO authenticated;
        RAISE NOTICE 'Granted UPDATE on user_tokens to authenticated';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'generated_images') THEN
        GRANT INSERT, DELETE ON public.generated_images TO authenticated;
        RAISE NOTICE 'Granted INSERT, DELETE on generated_images to authenticated';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'token_transactions') THEN
        GRANT INSERT ON public.token_transactions TO authenticated;
        RAISE NOTICE 'Granted INSERT on token_transactions to authenticated';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_transactions') THEN
        GRANT INSERT ON public.payment_transactions TO authenticated;
        RAISE NOTICE 'Granted INSERT on payment_transactions to authenticated';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'premium_profiles') THEN
        GRANT INSERT, UPDATE, DELETE ON public.premium_profiles TO authenticated;
        RAISE NOTICE 'Granted INSERT, UPDATE, DELETE on premium_profiles to authenticated';
    END IF;
END $$;

-- ========================================
-- CREATE RLS POLICIES (with error handling)
-- ========================================

-- BANNERS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'banners') THEN
        DROP POLICY IF EXISTS "Public can read active banners" ON public.banners;
        CREATE POLICY "Public can read active banners"
        ON public.banners FOR SELECT
        TO anon, authenticated
        USING (is_active = true OR is_active IS NULL);
        RAISE NOTICE 'Created RLS policy for banners';
    END IF;
END $$;

-- IMAGE SUGGESTIONS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'image_suggestions') THEN
        DROP POLICY IF EXISTS "Public can read active suggestions" ON public.image_suggestions;
        CREATE POLICY "Public can read active suggestions"
        ON public.image_suggestions FOR SELECT
        TO anon, authenticated
        USING (is_active = true OR is_active IS NULL);
        RAISE NOTICE 'Created RLS policy for image_suggestions';
    END IF;
END $$;

-- FAQS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
        DROP POLICY IF EXISTS "Public can read FAQs" ON public.faqs;
        CREATE POLICY "Public can read FAQs"
        ON public.faqs FOR SELECT
        TO anon, authenticated
        USING (true);
        RAISE NOTICE 'Created RLS policy for faqs';
    END IF;
END $$;

-- TOKEN PACKAGES
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'token_packages') THEN
        DROP POLICY IF EXISTS "Public can read token packages" ON public.token_packages;
        CREATE POLICY "Public can read token packages"
        ON public.token_packages FOR SELECT
        TO anon, authenticated
        USING (true);
        RAISE NOTICE 'Created RLS policy for token_packages';
    END IF;
END $$;

-- PREMIUM PAGE CONTENT
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'premium_page_content') THEN
        DROP POLICY IF EXISTS "Public can read premium content" ON public.premium_page_content;
        CREATE POLICY "Public can read premium content"
        ON public.premium_page_content FOR SELECT
        TO anon, authenticated
        USING (true);
        RAISE NOTICE 'Created RLS policy for premium_page_content';
    END IF;
END $$;

-- PLAN FEATURES
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plan_features') THEN
        DROP POLICY IF EXISTS "Public can read plan features" ON public.plan_features;
        CREATE POLICY "Public can read plan features"
        ON public.plan_features FOR SELECT
        TO anon, authenticated
        USING (true);
        RAISE NOTICE 'Created RLS policy for plan_features';
    END IF;
END $$;

-- CHARACTERS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'characters') THEN
        DROP POLICY IF EXISTS "Public can read characters" ON public.characters;
        CREATE POLICY "Public can read characters"
        ON public.characters FOR SELECT
        TO anon, authenticated
        USING (true);
        RAISE NOTICE 'Created RLS policy for characters';
    END IF;
END $$;

-- SUBSCRIPTION PLANS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') THEN
        DROP POLICY IF EXISTS "Public can read subscription plans" ON public.subscription_plans;
        CREATE POLICY "Public can read subscription plans"
        ON public.subscription_plans FOR SELECT
        TO anon, authenticated
        USING (true);
        RAISE NOTICE 'Created RLS policy for subscription_plans';
    END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
  'Granted Permissions' as info,
  grantee,
  table_name,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND table_schema = 'public'
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- ========================================
-- DONE!
-- ========================================
