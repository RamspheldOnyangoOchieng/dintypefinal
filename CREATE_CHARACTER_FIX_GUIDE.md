# Create Character Fix Guide

## Issues Identified

### 1. **Missing Character Creation Selection Images**
   - **Issue**: The `/public/character creation/` folder with selection images is missing
   - **Impact**: Users see no preview images when selecting character attributes
   - **Location**: Should be in `/public/character creation/` directory

### 2. **Attribute Images API Not Fully Configured**
   - **Issue**: The `/api/attribute-images` route depends on:
     - `attribute_images` table in Supabase (may not exist)
     - `attributes` storage bucket in Supabase (may not exist)
     - Novita API for generating images on-the-fly
   - **Impact**: Selection images won't load dynamically

### 3. **Character Generation API**
   - **Issue**: `/api/generate-custom-character` is configured but needs testing
   - **Status**: API key is present, should work but needs verification

## Solutions

### Solution 1: Setup Database Tables and Storage

Run this SQL in your Supabase SQL Editor:

```sql
-- Create attribute_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS attribute_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  style TEXT NOT NULL CHECK (style IN ('realistic', 'anime')),
  image_url TEXT NOT NULL,
  prompt TEXT,
  seed INTEGER,
  width INTEGER DEFAULT 512,
  height INTEGER DEFAULT 768,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, value, style)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attribute_images_category ON attribute_images(category);
CREATE INDEX IF NOT EXISTS idx_attribute_images_style ON attribute_images(style);
CREATE INDEX IF NOT EXISTS idx_attribute_images_lookup ON attribute_images(category, value, style);

-- Enable Row Level Security
ALTER TABLE attribute_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read attribute images (they're public reference images)
CREATE POLICY "Anyone can view attribute images" ON attribute_images
  FOR SELECT USING (true);

-- Only authenticated users can insert/update (for admin/generation)
CREATE POLICY "Authenticated users can insert attribute images" ON attribute_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attribute images" ON attribute_images
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### Solution 2: Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create a new bucket named `attributes`
3. Make it **public** (so images can be accessed without authentication)
4. Set the following policies:
   - Allow public SELECT (read) access
   - Allow authenticated INSERT/UPDATE

Or use this SQL:

```sql
-- Insert storage bucket (if using SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attributes', 'attributes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'attributes');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attributes' AND auth.role() = 'authenticated');
```

### Solution 3: Add Fallback UI for Missing Images

The `create-character-flow.tsx` component already has good loading states and error handling. The images will be generated on-demand by the API when a user first selects an attribute.

**How it works:**
1. User selects an attribute (e.g., "Athletic" body type)
2. Component calls `/api/attribute-images?category=body&value=Athletic&style=realistic`
3. API checks database for existing image
4. If not found, generates new image using Novita AI
5. Uploads to Supabase storage
6. Returns URL to frontend
7. Frontend caches and displays image

### Solution 4: Alternative - Use Placeholder/Emoji Only

If you want a quick fix without waiting for AI generation, update the `SelectionCard` component to show only emoji and text:

```typescript
// In create-character-flow.tsx, update SelectionCard to disable images temporarily
<SelectionCard
  key={option.value}
  emoji={option.emoji}
  label={option.label}
  description={option.description}
  imageUrl={undefined} // Force no image, show emoji only
  loading={false}
  selected={customization.age === option.value}
  onClick={() => setSingleSelect('age', option.value)}
/>
```

## Testing Steps

1. **Test Environment Setup**
   ```bash
   # Ensure .env file exists and has all variables
   # Already done - .env exists with NOVITA_API_KEY configured
   ```

2. **Test Database Connection**
   - Run the SQL scripts above in Supabase
   - Verify `attribute_images` table exists
   - Verify `attributes` storage bucket exists

3. **Test Character Creation Flow**
   ```
   1. Navigate to /create-character
   2. Select style (Realistic/Anime)
   3. Go through each step
   4. Watch browser console for any API errors
   5. Check Network tab for API responses
   ```

4. **Test API Endpoints Directly**
   ```bash
   # Test attribute image API
   curl https://your-domain.com/api/attribute-images?category=age&value=18-19&style=realistic
   
   # Test character generation API
   curl -X POST https://your-domain.com/api/generate-custom-character \
     -H "Content-Type: application/json" \
     -d '{"style":"realistic","age":"18-19","body":"Athletic","ethnicity":"Caucasian","hair_style":"Straight","hair_length":"Long","hair_color":"Blonde","eye_color":"Blue","eye_shape":"Almond","lip_shape":"Full","face_shape":"Oval","hips":"Moderate","bust":"Medium"}'
   ```

## Current Status

✅ **Working:**
- Environment variables configured (NOVITA_API_KEY present)
- API routes exist and are properly structured
- Frontend component has loading/error states
- Image generation logic is implemented

⚠️ **Needs Setup:**
- Database table `attribute_images` (run SQL above)
- Storage bucket `attributes` (create in Supabase)
- First-time image generation will take ~10-30 seconds per image

❌ **Missing:**
- Pre-generated selection images in `/public` folder
- Initial database records for common attributes

## Quick Start

**Fastest way to get it working:**

1. Run the SQL scripts in Supabase (Solution 1)
2. Create the storage bucket (Solution 2)
3. Restart your Next.js dev server
4. Navigate to `/create-character`
5. Select an attribute - it will generate and cache the image automatically

**Expected behavior:**
- First user to select an attribute: 10-30 second wait while image generates
- Subsequent users: Instant load from cache
- Images are permanently stored in Supabase and reused

## API Cost Considerations

Each new attribute image costs ~1 Novita API call. With the current setup:
- ~100-150 total possible combinations
- Only generates on-demand (not all at once)
- Each image is cached forever once generated
- Approximately $0.01-0.02 per image generation

## Debugging

Check these if issues persist:

1. **Browser Console Errors**
   - Look for 404 errors on `/api/attribute-images`
   - Look for 500 errors indicating API failures

2. **Server Logs**
   - Check Vercel/deployment logs for Novita API errors
   - Check for Supabase connection errors

3. **Supabase Dashboard**
   - Verify `attribute_images` table has rows after generation
   - Check storage bucket `attributes` for uploaded images
   - Review storage policies for public access

4. **Environment Variables**
   - Verify `NOVITA_API_KEY` is set in deployment environment
   - Verify Supabase keys are correct

## Additional Notes

- The `/create-character` page uses a different approach with local images
- The `create-character-flow.tsx` component uses dynamic API-generated images
- Both should work, but the flow component is more flexible and modern
- Consider migrating `/create-character/page.tsx` to use the same API approach
