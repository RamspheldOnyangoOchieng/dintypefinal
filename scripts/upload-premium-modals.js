const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configuration from seed-attributes-v3.js
cloudinary.config({
  cloud_name: 'ddg02aqiw',
  api_key: '614297593432527',
  api_secret: 'p2E_hT2tCkPNtBREKg5BMt-t4Os'
});

const imagesToUpload = [
  {
    name: 'premium_upgrade',
    path: '/home/ramspheld/.gemini/antigravity/brain/6ca235dc-16a4-4951-9054-6eb9fb09b7c5/premium_upgrade_1766962784905.png',
    folder: 'premium-modals'
  },
  {
    name: 'premium_expired',
    path: '/home/ramspheld/.gemini/antigravity/brain/6ca235dc-16a4-4951-9054-6eb9fb09b7c5/premium_expired_1766962879075.png',
    folder: 'premium-modals'
  },
  {
    name: 'tokens_depleted',
    path: '/home/ramspheld/.gemini/antigravity/brain/6ca235dc-16a4-4951-9054-6eb9fb09b7c5/tokens_depleted_1766962819348.png',
    folder: 'premium-modals'
  },
  {
    name: 'create_character_premium',
    path: '/home/ramspheld/.gemini/antigravity/brain/6ca235dc-16a4-4951-9054-6eb9fb09b7c5/create_character_premium_1766962843886.png',
    folder: 'premium-modals'
  },
  {
    name: 'daily_limit_reached',
    path: '/home/ramspheld/.gemini/antigravity/brain/e1c3f4b2-3323-4048-8af2-bd1304aae243/daily_limit_lady_1767042951824.png',
    folder: 'premium-modals'
  }
];

async function uploadImages() {
  console.log('🚀 Starting Cloudinary upload for premium modals...');
  
  for (const item of imagesToUpload) {
    try {
      if (!fs.existsSync(item.path)) {
        console.error(`❌ File not found: ${item.path}`);
        continue;
      }
      
      console.log(`⏳ Uploading ${item.name}...`);
      const result = await cloudinary.uploader.upload(item.path, {
        folder: item.folder,
        public_id: item.name,
        overwrite: true
      });
      
      console.log(`✅ Success! ${item.name} -> ${result.secure_url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${item.name}:`, error.message);
    }
  }
  
  console.log('✨ All uploads complete!');
}

uploadImages();
