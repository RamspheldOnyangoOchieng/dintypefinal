# 📦 Installation Instructions for Image Generation Script

## Required Dependencies

Run this command to install all required packages:

```bash
npm install dotenv @supabase/supabase-js axios cloudinary form-data
```

### Packages Breakdown:
- **dotenv**: Load environment variables from `.env` file
- **@supabase/supabase-js**: Save metadata to Supabase database
- **axios**: HTTP client for Novita API and image downloads
- **cloudinary**: Upload images to Cloudinary CDN
- **form-data**: Required by some HTTP upload operations

## Environment Variables Required

Make sure your `.env` file contains:

```bash
# Novita AI
NOVITA_API_KEY=sk_your_novita_key_here

# Supabase (for database only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary (for image storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Run

```bash
# Navigate to project
cd /home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup

# Install dependencies (if not already done)
npm install dotenv @supabase/supabase-js axios cloudinary form-data

# Run the script
node scripts/generate-all-character-images.js
```

## What Happens

1. ✅ Generates 48 high-quality images (personality + relationship × realistic + anime)
2. ✅ Uploads each image to **Cloudinary CDN** in organized folders:
   - `character-images/personality/`
   - `character-images/relationship/`
3. ✅ Saves metadata to Supabase `attribute_images` table with Cloudinary URLs
4. ✅ Shows detailed progress with emojis and status updates

## Expected Output Structure in Cloudinary

```
character-images/
├── personality/
│   ├── caregiver-1234567890
│   ├── sage-1234567891
│   ├── innocent-1234567892
│   └── ... (24 files total)
└── relationship/
    ├── stranger-1234567893
    ├── girlfriend-1234567894
    ├── wife-1234567895
    └── ... (24 files total)
```

## Cloudinary URLs

All images will get URLs like:
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/character-images/personality/caregiver-1234567890.jpg
```

These URLs are:
- ✅ **Permanent** - Won't expire
- ✅ **Fast** - Served via global CDN
- ✅ **Optimized** - Automatic format conversion
- ✅ **Transformable** - Can resize/crop on-the-fly

## Time Estimate

- 48 images × ~3 minutes = **~2.4 hours total**
- Script shows progress after each image
- Safe to stop/restart if needed (won't duplicate existing images)

## Success Criteria

After completion, you should see:
```
=======================================================================
🎉 GENERATION COMPLETE!
=======================================================================
✅ Successful: 48/48
❌ Failed: 0/48
✨ Success Rate: 100%
=======================================================================
```

## Troubleshooting

**Error: "cloudinary is not defined"**
- Solution: Run `npm install cloudinary`

**Error: "Invalid cloud_name"**
- Solution: Check your `CLOUDINARY_CLOUD_NAME` in `.env`

**Error: "Upload failed"**
- Solution: Verify all Cloudinary credentials are correct

**Error: "Novita API timeout"**
- Solution: Normal during peak hours, script will retry

## Next Steps After Running

1. Check Cloudinary dashboard to see uploaded images
2. Verify database has correct URLs in `attribute_images` table
3. Test character creation flow to see new high-quality images
4. Celebrate! 🎉
