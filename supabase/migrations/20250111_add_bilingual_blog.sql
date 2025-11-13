-- Add bilingual columns to existing blog tables

-- Update blog_categories table
ALTER TABLE blog_categories 
ADD COLUMN IF NOT EXISTS name_sv TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_sv TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Migrate existing data to Swedish columns
UPDATE blog_categories 
SET name_sv = COALESCE(name_sv, name),
    name_en = COALESCE(name_en, name),
    description_sv = COALESCE(description_sv, description),
    description_en = COALESCE(description_en, description)
WHERE name_sv IS NULL OR name_en IS NULL;

-- Update blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS title_sv TEXT,
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS content_sv TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT,
ADD COLUMN IF NOT EXISTS excerpt_sv TEXT,
ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Migrate existing data to Swedish columns
UPDATE blog_posts
SET title_sv = COALESCE(title_sv, title),
    title_en = COALESCE(title_en, title),
    content_sv = COALESCE(content_sv, content),
    content_en = COALESCE(content_en, content),
    excerpt_sv = COALESCE(excerpt_sv, excerpt),
    excerpt_en = COALESCE(excerpt_en, excerpt),
    meta_title = COALESCE(meta_title, title),
    meta_description = COALESCE(meta_description, excerpt)
WHERE title_sv IS NULL OR title_en IS NULL;

-- Add comments
COMMENT ON COLUMN blog_categories.name_sv IS 'Category name in Swedish';
COMMENT ON COLUMN blog_categories.name_en IS 'Category name in English';
COMMENT ON COLUMN blog_posts.title_sv IS 'Post title in Swedish';
COMMENT ON COLUMN blog_posts.title_en IS 'Post title in English';
COMMENT ON COLUMN blog_posts.content_sv IS 'Post content in Swedish';
COMMENT ON COLUMN blog_posts.content_en IS 'Post content in English';

-- Create blog_post_tags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- Update blog_tags table
ALTER TABLE blog_tags
ADD COLUMN IF NOT EXISTS name_sv TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT;

UPDATE blog_tags
SET name_sv = COALESCE(name_sv, name),
    name_en = COALESCE(name_en, name)
WHERE name_sv IS NULL OR name_en IS NULL;

-- Add scheduled post publishing function
CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS void AS $$
BEGIN
  UPDATE blog_posts
  SET status = 'published',
      published_at = NOW()
  WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
    AND published_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION publish_scheduled_posts() IS 'Automatically publish scheduled blog posts when their scheduled time arrives';
