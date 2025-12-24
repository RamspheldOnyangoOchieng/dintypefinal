# HIGH-QUALITY IMAGE GENERATION SCRIPTS

This directory contains scripts to regenerate personality and relationship selection images with optimized quality settings.

## 🎯 Problem
The current personality and relationship selection images in the character creation flow are low quality. These scripts regenerate them using:
- **epicrealism** model for realistic style (photorealistic, studio quality)
- **dreamshaper_8** model for anime style
- Enhanced negative prompts to eliminate artifacts
- 512x768 resolution (optimal portrait aspect ratio)
- 50 steps for maximum quality

## 📁 Scripts

### 1. `generate-personality-relationship-images.js` (NEW - RECOMMENDED)
**Optimized high-quality generation script**

Generates personality and relationship images with the best settings:
- ✅ Uses `epicrealism_naturalSinRC1VAE_106430.safetensors` for realistic
- ✅ Uses `dreamshaper_8_93211.safetensors` for anime
- ✅ Enhanced negative prompts (removes artifacts, plastic look, deformities)
- ✅ 50 generation steps (vs 30 in old script)
- ✅ Proper prompt engineering for each personality/relationship type

**Usage:**
```bash
# Install dependencies if needed
npm install node-fetch

# Run the script
node scripts/generate-personality-relationship-images.js
```

**Configuration:**
Edit the script to set:
- `GENERATE_CATEGORIES`: `['personality', 'relationship']` or just one
- `GENERATE_STYLES`: `['realistic', 'anime']` or just one
- Storage destination (Supabase or Cloudinary)

**Time Estimate:**
- Personality only (12 types × 2 styles = 24 images): ~72 minutes
- Relationship only (12 types × 2 styles = 24 images): ~72 minutes
- Both categories: ~144 minutes (2.4 hours)

### 2. `generate-selection-images.js` (OLD)
Original script that generates ALL attribute images (age, body, ethnicity, etc.)
- Uses older model (`dreamshaper_8`)
- 30 steps
- Basic negative prompts

### 3. `pregenerate-attribute-images.js` (OLD)
Calls the `/api/attribute-images` endpoint to pre-cache images.

## 🖼️ Copying Images from Reference Directory

If you have existing good images in `/home/ramspheld/Projects/Ramspheld/DINTYP.SE-2025-master(1)/DINTYP.SE-2025-master`, you can copy them:

### Step 1: Find the images
```bash
# List personality images in reference directory
find /home/ramspheld/Projects/Ramspheld/DINTYP.SE-2025-master\(1\)/DINTYP.SE-2025-master -type f -name "*personality*" -o -name "*relationship*"
```

### Step 2: Copy to current project
```bash
# Example: Copy all character creation images
cp -r "/home/ramspheld/Projects/Ramspheld/DINTYP.SE-2025-master(1)/DINTYP.SE-2025-master/public/character creation" \
   "/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup/public/"
```

### Step 3: Update database
After copying, you may need to update the database `attribute_images` table with the new URLs.

## 🗄️ Database Structure

The `attribute_images` table stores:
```sql
CREATE TABLE attribute_images (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,     -- 'personality' or 'relationship'
  value TEXT NOT NULL,         -- 'Caregiver', 'Stranger', etc.
  style TEXT NOT NULL,         -- 'realistic' or 'anime'
  image_url TEXT NOT NULL,     -- Public URL
  prompt TEXT,                 -- Generation prompt used
  width INTEGER,               -- 512
  height INTEGER,              -- 768
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎨 Personality Types to Generate
1. **Caregiver** - Nurturing, protective
2. **Sage** - Wise, reflective
3. **Innocent** - Optimistic, pure-hearted
4. **Jester** - Playful, humorous
5. **Temptress** - Flirtatious, playful
6. **Dominant** - Assertive, controlling
7. **Submissive** - Obedient, eager to please
8. **Lover** - Romantic, passionate
9. **Nympho** - Insatiable, intense
10. **Mean** - Cold, dismissive
11. **Confidant** - Trustworthy, good listener
12. **Experimenter** - Curious, willing

## 💑 Relationship Types to Generate
1. **Stranger** - Unknown woman
2. **School-Mate** - Fellow student
3. **Colleague** - Work associate
4. **Mentor** - Guide and advisor
5. **Girlfriend** - Romantic partner
6. **Sex-Friend** - Intimate physical relationship
7. **Wife** - Married spouse
8. **Mistress** - Secret affair
9. **Friend** - Close companion
10. **Best-Friend** - Closest confidant
11. **Step-Sister** - Family through marriage
12. **Step-Mom** - Parental figure

## 📊 Quality Comparison

| Aspect | Old Script | New Script (Optimized) |
|--------|-----------|----------------------|
| Model (Realistic) | dreamshaper_8 | **epicrealism** |
| Model (Anime) | sd_xl_base | **dreamshaper_8** |
| Steps | 30 | **50** |
| Negative Prompt | Basic (10 words) | **Enhanced (100+ words)** |
| Resolution | 512x768 | 512x768 |
| Prompt Engineering | Generic | **Specific per type** |
| Quality | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔧 Environment Variables

Create a `.env` file in the project root:
```bash
# Novita AI
NOVITA_API_KEY=sk_YOUR_KEY

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🚀 Quick Start

1. **Set up environment variables** (or edit script directly)
2. **Run the optimized script:**
   ```bash
   node scripts/generate-personality-relationship-images.js
   ```
3. **Monitor progress** - The script shows detailed progress for each image
4. **Check results** - Images will be uploaded to Supabase Storage and database

## 🐛 Troubleshooting

**Error: Novita API key not configured**
- Set `NOVITA_API_KEY` in `.env` or edit the script directly

**Error: Upload failed**
- Check S upabase service role key
- Verify storage bucket exists and is public

**Error: Image generation timeout**
- Novita may be slow during peak times
- The script times out after 3 minutes per image

**Error: Rate limit exceeded**
- Add longer delays between requests (increase `setTimeout` value)

## 📝 Notes

- The script saves progress, so you can stop and restart if needed
- Failed images are logged at the end—you can retry those manually
- Each image takes ~3 minutes to generate (including upload time)
- Total estimated time for all images: **~2.5 hours**

## 🔗 Related Files

- `/app/api/generate-character-image/route.ts` - Character generation endpoint
- `/lib/novita-api.ts` - Novita API client
- `/app/create-character/page.tsx` - Character creation UI
