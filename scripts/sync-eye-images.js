require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const projectRoot = '/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup';

const eyesToUpload = [
    {
        value: 'brown',
        localPath: 'public/character creation/eye  color/realistic/brown-9dbba1bb37191cf2fc0d0fd3f2c118277e3f1c257a66a870484739fa1bd33c42.webp',
        prompt: 'Close-up macro photography of a beautiful human eye with brown iris, detailed texture, realistic eyelashes, professional lighting.'
    },
    {
        value: 'blue',
        localPath: 'public/character creation/eye  color/realistic/blue-f7e75e814204c4d8464d36f525b0f6e9191557a585cb4be01e91ca8eb45416d0.webp',
        prompt: 'Close-up macro photography of a beautiful human eye with blue iris, detailed texture, realistic eyelashes, professional lighting.'
    },
    {
        value: 'green',
        localPath: 'public/character creation/eye  color/realistic/green-8a705cc5c2c435ac0f7addd110f4dd2b883a2e35b6403659c3e30cc7a741359c.webp',
        prompt: 'Close-up macro photography of a beautiful human eye with green iris, detailed texture, realistic eyelashes, professional lighting.'
    }
];

async function run() {
    for (const eye of eyesToUpload) {
        const fullLocalPath = path.join(projectRoot, eye.localPath);
        if (!fs.existsSync(fullLocalPath)) {
            console.error(`Missing local file: ${fullLocalPath}`);
            continue;
        }

        console.log(`Uploading ${eye.value} eye...`);
        try {
            const uploadRes = await cloudinary.uploader.upload(fullLocalPath, {
                folder: 'attribute-images/eyeColor',
                public_id: `eyeColor_${eye.value}_realistic_${Date.now()}`
            });

            console.log(`Saved to Cloudinary: ${uploadRes.secure_url}`);

            const { data, error } = await supabase
                .from('attribute_images')
                .upsert({
                    category: 'eyeColor',
                    value: eye.value,
                    style: 'realistic',
                    image_url: uploadRes.secure_url,
                    prompt: eye.prompt,
                    width: 1024,
                    height: 1024
                }, { onConflict: 'category,value,style' });

            if (error) console.error(`DB error for ${eye.value}:`, error);
            else console.log(`Successfully saved ${eye.value} to DB.`);
        } catch (err) {
            console.error(`Upload error for ${eye.value}:`, err);
        }
    }
}

run();
