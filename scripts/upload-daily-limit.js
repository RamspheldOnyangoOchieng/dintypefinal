const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: 'ddg02aqiw',
    api_key: '614297593432527',
    api_secret: 'p2E_hT2tCkPNtBREKg5BMt-t4Os'
});

const imagePath = '/home/ramspheld/.gemini/antigravity/brain/e1c3f4b2-3323-4048-8af2-bd1304aae243/daily_limit_lady_1767042951824.png';
const publicId = 'daily_limit_reached';

async function uploadImage() {
    console.log('🚀 Uploading daily limit modal image...');
    try {
        if (!fs.existsSync(imagePath)) {
            console.error(`❌ File not found: ${imagePath}`);
            return;
        }

        const result = await cloudinary.uploader.upload(imagePath, {
            public_id: publicId,
            overwrite: true,
            invalidate: true // Important to clear cache for the existing URL
        });

        console.log(`✅ Success! Image uploaded to: ${result.secure_url}`);
    } catch (error) {
        console.error(`❌ Upload failed:`, error.message);
    }
}

uploadImage();
