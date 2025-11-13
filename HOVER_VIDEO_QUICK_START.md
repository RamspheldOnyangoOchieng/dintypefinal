# 🎬 Hover Video Feature - Quick Reference

## ⚡ Quick Start (3 Steps)

### 1. Add Environment Variables
```env
RUNPOD_API_KEY=your_key_here
NOVITA_API_KEY=your_key_here
BUNNY_STORAGE_API_KEY=your_key_here
BUNNY_STORAGE_ZONE=your-zone
BUNNY_CDN_URL=https://your-cdn.b-cdn.net
```

### 2. Get API Keys
- **RunPod**: https://www.runpod.io/console/user/settings
- **Novita AI**: https://novita.ai (optional)
- **Bunny.net**: https://dash.bunny.net

### 3. Generate Videos
1. Go to `/admin/dashboard/characters`
2. Click 🎥 icon on any character
3. Choose a prompt
4. Wait 1-3 minutes
5. Done!

---

## 📁 Files Created

1. `components/character-hover-video-modal.tsx` - Main modal UI
2. `app/api/generate-character-hover-video/route.ts` - Generation API
3. `app/api/save-character-hover-video/route.ts` - Save API
4. `.env.hover-video-example` - Environment template
5. `HOVER_VIDEO_FEATURE_COMPLETE.md` - Full documentation

## 📝 Files Modified

1. `app/admin/dashboard/characters/page.tsx` - Added video column and button
2. (No other files needed modification - character-context already has refresh!)

---

## 🎯 Key Features

✅ **Category-Specific Prompts** - Different suggestions for anime vs realistic
✅ **Custom Prompts** - Write your own animation descriptions  
✅ **Real-Time Progress** - See generation status updates
✅ **Video Preview** - Watch before saving
✅ **Auto Refresh** - Table updates automatically
✅ **No Token Cost** - Free for admins
✅ **Color-Coded Status** - Purple = has video, Gray = no video

---

## 💡 Example Prompts

### Anime
- "anime character doing a kawaii pose with sparkles"
- "anime character dancing with energetic movements"

### Realistic
- "smiling warmly and winking at the camera"
- "dancing gracefully with natural movements"

### Custom
- "twirling in a beautiful dress with flowing hair"
- "giving a playful wink and blowing a kiss"

---

## 🔍 Troubleshooting

**Video not generating?**
- Check RunPod API key and credits
- Verify character has valid image URL
- Check browser console for errors

**Video not appearing?**
- Refresh the page
- Check Bunny.net CDN URL is correct
- Verify video_url in database

**Generation timeout?**
- RunPod might be busy, try again
- Check RunPod endpoint is deployed
- Increase polling timeout if needed

---

## 💰 Costs

- **RunPod**: ~$0.30 per video
- **Bunny.net**: ~$0.01 per video (storage + bandwidth)
- **Total**: ~$0.31 per video
- **Admin**: FREE (no token deduction)

---

## 📊 Video Specs

- **Size**: 480x832px (9:16 portrait)
- **Length**: ~3 seconds (81 frames)
- **Format**: MP4
- **FPS**: 25
- **File Size**: ~5-10MB

---

## 🚀 Next Steps

1. **Add environment variables** from `.env.hover-video-example`
2. **Get API keys** from RunPod, Novita, and Bunny.net
3. **Test with one character** first
4. **Generate videos for all characters** (or batch if you build it!)
5. **Monitor hover engagement** on your analytics

---

**Need help?** Check `HOVER_VIDEO_FEATURE_COMPLETE.md` for full details!
