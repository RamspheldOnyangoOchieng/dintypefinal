-- =============================================
-- CMS TABLES - SEO, Content, Blog, Media
-- =============================================

-- =============================================
-- 1. SEO META TAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS page_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(255) UNIQUE NOT NULL, -- e.g., '/', '/premium', '/blogg'
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  og_title VARCHAR(255),
  og_description TEXT,
  og_image VARCHAR(500),
  og_type VARCHAR(50) DEFAULT 'website',
  twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
  canonical_url VARCHAR(500),
  robots VARCHAR(100) DEFAULT 'index,follow',
  language VARCHAR(10) DEFAULT 'sv',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_page_meta_path ON page_meta(page_path);

COMMENT ON TABLE page_meta IS 'SEO meta tags for each page';
COMMENT ON COLUMN page_meta.page_path IS 'URL path like /, /premium, /blogg';
COMMENT ON COLUMN page_meta.robots IS 'index,follow or noindex,nofollow';

-- Insert default SEO for main pages
INSERT INTO page_meta (page_path, meta_title, meta_description, meta_keywords) VALUES
  ('/', 'AI Character Explorer - Chatta med AI Flickvänner', 'Skapa och chatta med personliga AI-flickvänner. Realistiska konversationer, anpassningsbara personligheter.', 'ai flickvän, ai chat, virtuell flickvän, ai karaktär'),
  ('/premium', 'Premium Plan - Obegränsade AI Chattningar', 'Uppgradera till Premium för obegränsade meddelanden, fler AI-flickvänner och exklusiva funktioner.', 'premium ai, obegränsad chat, ai prenumeration'),
  ('/blogg', 'AI Dating Blog - Tips & Guider', 'Läs om AI-dating, virtuella relationer och hur du får ut det mesta av din AI-flickvän.', 'ai dating blog, ai relationer, virtuell dating'),
  ('/faq', 'Vanliga Frågor - AI Character Explorer', 'Svar på vanliga frågor om AI-flickvänner, tokens, prenumerationer och funktioner.', 'faq, hjälp, ai frågor'),
  ('/create-character', 'Skapa Din AI Flickvän - Anpassad Personlighet', 'Skapa din perfekta AI-flickvän med anpassad personlighet, utseende och intressen.', 'skapa ai flickvän, anpassad ai, ai karaktär design')
ON CONFLICT (page_path) DO NOTHING;

-- =============================================
-- 2. CONTENT BLOCKS TABLE (Editable Page Content)
-- =============================================
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'homepage_hero_title', 'faq_intro'
  block_type VARCHAR(50) NOT NULL, -- 'text', 'html', 'markdown', 'json'
  content TEXT NOT NULL,
  description TEXT, -- What this block is for
  page_path VARCHAR(255), -- Associated page
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_blocks_key ON content_blocks(block_key);
CREATE INDEX idx_content_blocks_page ON content_blocks(page_path);

COMMENT ON TABLE content_blocks IS 'Editable content blocks for pages (homepage text, FAQ, etc.)';
COMMENT ON COLUMN content_blocks.block_key IS 'Unique identifier like homepage_hero_title';
COMMENT ON COLUMN content_blocks.block_type IS 'text, html, markdown, or json';

-- Insert default content blocks
INSERT INTO content_blocks (block_key, block_type, content, description, page_path) VALUES
  ('homepage_hero_title', 'text', 'Skapa Din Perfekta AI Flickvän', 'Homepage hero section title', '/'),
  ('homepage_hero_subtitle', 'text', 'Chatta, flirta och bygg en djup relation med en AI som förstår dig', 'Homepage hero subtitle', '/'),
  ('homepage_features_title', 'text', 'Varför Välja Oss?', 'Features section title', '/'),
  ('pricing_title', 'text', 'Välj Din Plan', 'Pricing section title', '/premium'),
  ('pricing_subtitle', 'text', 'Börja gratis eller uppgradera för obegränsad tillgång', 'Pricing subtitle', '/premium'),
  ('faq_intro', 'html', '<p>Här hittar du svar på de vanligaste frågorna om AI Character Explorer.</p>', 'FAQ intro text', '/faq')
ON CONFLICT (block_key) DO NOTHING;

-- =============================================
-- 3. MEDIA LIBRARY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Supabase storage path
  file_url VARCHAR(500) NOT NULL, -- Public URL
  file_type VARCHAR(50), -- 'image/jpeg', 'image/png', 'video/mp4'
  file_size INTEGER, -- Size in bytes
  width INTEGER, -- Image/video width
  height INTEGER, -- Image/video height
  alt_text VARCHAR(255),
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  folder VARCHAR(100) DEFAULT 'general' -- For organization: 'banners', 'blog', 'characters'
);

CREATE INDEX idx_media_library_type ON media_library(file_type);
CREATE INDEX idx_media_library_folder ON media_library(folder);

COMMENT ON TABLE media_library IS 'Centralized media storage for images and videos';

-- =============================================
-- 4. BLOG CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES blog_categories(id), -- For subcategories
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_parent ON blog_categories(parent_id);

COMMENT ON TABLE blog_categories IS 'Blog post categories';

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('AI Dating', 'ai-dating', 'Tips och guider om AI-dating och virtuella relationer'),
  ('Funktioner', 'funktioner', 'Nya funktioner och uppdateringar'),
  ('Guider', 'guider', 'Steg-för-steg guider och tutorials'),
  ('Nyheter', 'nyheter', 'Senaste nyheterna om AI och teknologi')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 5. BLOG TAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

COMMENT ON TABLE blog_tags IS 'Blog post tags';

-- =============================================
-- 6. BLOG POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Rich text / Markdown
  featured_image VARCHAR(500),
  
  -- SEO fields
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- Author and category
  author_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES blog_categories(id),
  
  -- Status and visibility
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'scheduled', 'archived'
  is_featured BOOLEAN DEFAULT false,
  
  -- Scheduling
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at);

COMMENT ON TABLE blog_posts IS 'Blog posts with full CMS functionality';
COMMENT ON COLUMN blog_posts.status IS 'draft, published, scheduled, archived';

-- =============================================
-- 7. BLOG POST TAGS (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

COMMENT ON TABLE blog_post_tags IS 'Many-to-many relationship between posts and tags';

-- =============================================
-- 8. FAQ ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100), -- e.g., 'Tokens', 'Premium', 'Technical'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_faq_items_category ON faq_items(category);
CREATE INDEX idx_faq_items_sort ON faq_items(sort_order);

COMMENT ON TABLE faq_items IS 'Frequently Asked Questions - editable from admin';

-- Insert sample FAQ items
INSERT INTO faq_items (question, answer, category, sort_order) VALUES
  ('Vad kostar det att använda tjänsten?', 'Vi erbjuder både gratis och premium planer. Gratisversionen inkluderar 50 tokens och begränsade funktioner. Premium kostar 119 kr/månad och inkluderar obegränsade meddelanden och 100 bonus tokens.', 'Priser', 1),
  ('Hur fungerar tokens?', 'Tokens används för att generera meddelanden (5 tokens), bilder (5-10 tokens) och skapa AI-karaktärer (2 tokens). Du kan köpa fler tokens i olika paket från 99 kr.', 'Tokens', 2),
  ('Kan jag skapa flera AI-flickvänner?', 'Gratis användare kan ha 1 aktiv karaktär. Premium-användare kan ha upp till 3 aktiva karaktärer samtidigt.', 'Funktioner', 3)
ON CONFLICT DO NOTHING;

-- =============================================
-- PERMISSIONS
-- =============================================

-- Admin full access
GRANT ALL ON page_meta TO service_role;
GRANT ALL ON content_blocks TO service_role;
GRANT ALL ON media_library TO service_role;
GRANT ALL ON blog_categories TO service_role;
GRANT ALL ON blog_tags TO service_role;
GRANT ALL ON blog_posts TO service_role;
GRANT ALL ON blog_post_tags TO service_role;
GRANT ALL ON faq_items TO service_role;

-- Authenticated users can read published content
GRANT SELECT ON page_meta TO authenticated;
GRANT SELECT ON content_blocks TO authenticated WHERE is_active = true;
GRANT SELECT ON media_library TO authenticated;
GRANT SELECT ON blog_categories TO authenticated WHERE is_active = true;
GRANT SELECT ON blog_tags TO authenticated;
GRANT SELECT ON blog_posts TO authenticated WHERE status = 'published';
GRANT SELECT ON blog_post_tags TO authenticated;
GRANT SELECT ON faq_items TO authenticated WHERE is_active = true;

-- Anonymous users can read public content
GRANT SELECT ON page_meta TO anon;
GRANT SELECT ON content_blocks TO anon;
GRANT SELECT ON blog_categories TO anon;
GRANT SELECT ON blog_tags TO anon;
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON blog_post_tags TO anon;
GRANT SELECT ON faq_items TO anon;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_page_meta_updated_at BEFORE UPDATE ON page_meta
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON faq_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-publish scheduled posts
CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS void AS $$
BEGIN
  UPDATE blog_posts
  SET status = 'published',
      published_at = NOW()
  WHERE status = 'scheduled'
    AND scheduled_for <= NOW()
    AND scheduled_for IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION publish_scheduled_posts IS 'Run this via cron to auto-publish scheduled blog posts';
