const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const NOVITA_API_KEY = process.env.NOVITA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cloudinary Keys
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/txt2img';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

const eyeColors = [
    { key: 'brown', name: 'Brun', prompt: 'Detailed close-up of a beautiful female anime eye, rich brown glowing iris, expressive anime style, high quality digital art, clean lines, vibrant colors, 4k' },
    { key: 'blue', name: 'Blå', prompt: 'Detailed close-up of a beautiful female anime eye, vibrant blue glowing iris, expressive anime style, high quality digital art, clean lines, vibrant colors, 4k' },
    { key: 'green', name: 'Grön', prompt: 'Detailed close-up of a beautiful female anime eye, stunning green glowing iris, expressive anime style, high quality digital art, clean lines, vibrant colors, 4k' },
    { key: 'hazel', name: 'Hazel', prompt: 'Detailed close-up of a beautiful female anime eye, hazel glowing iris with gold and green highlights, expressive anime style, high quality digital art, clean lines, vibrant colors, 4k' },
    { key: 'grey', name: 'Grå', prompt: 'Detailed close-up of a beautiful female anime eye, mysterious grey glowing iris, expressive anime style, high quality digital art, clean lines, vibrant colors, 4k' }
];

async function generateImage(prompt) {
    const requestBody = {
        extra: { response_image_type: "jpeg", enable_nsfw_detection: false },
        request: {
            model_name: "sd_xl_base_1.0.safetensors",
            prompt: `anime style, ${prompt}, detailed illustration, high quality, professional digital art`,
            negative_prompt: "realistic, photography, 3d, nsfw, low quality, blurry, watermark, bad anatomy",
            width: 512,
            height: 512,
            image_num: 1,
            steps: 30,
            seed: -1,
            clip_skip: 1,
            guidance_scale: 7.5,
            sampler_name: "DPM++ 2M Karras"
        }
    };

    try {
        const response = await axios.post(NOVITA_API_URL, requestBody, {
            headers: { 'Authorization': `Bearer ${NOVITA_API_KEY}`, 'Content-Type': 'application/json' }
        });

        const taskId = response.data.task_id;
        let attempts = 0;
        while (attempts < 60) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            attempts++;
            const progressResponse = await axios.get(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
                headers: { 'Authorization': `Bearer ${NOVITA_API_KEY}` }
            });
            const task = progressResponse.data.task || progressResponse.data;
            if (task.status === 'TASK_STATUS_SUCCEED' || task.status === 'SUCCEEDED') {
                return (progressResponse.data.images || progressResponse.data.task.images)[0].image_url;
            } else if (task.status === 'TASK_STATUS_FAILED' || task.status === 'FAILED') {
                throw new Error(`Generation failed: ${task.reason || 'Unknown error'}`);
            }
        }
        throw new Error('Timeout');
    } catch (error) {
        console.error(' Error calling Novita:', error.response?.data || error.message);
        throw error;
    }
}

async function run() {
    console.log('🚀 Starting Anime (unrealistic) eye generation...');
    for (const item of eyeColors) {
        console.log(`\nProcessing: ${item.key} (anime)`);
        try {
            const novitaUrl = await generateImage(item.prompt);
            console.log(` ✅ Generated from Novita. Uploading to Cloudinary...`);
            const cloudinaryUrl = await cloudinary.uploader.upload(novitaUrl, {
                folder: `attribute-images/eyeColor`,
                public_id: `eyeColor_${item.key}_anime_${Date.now()}`
            });
            console.log(` ✅ Uploaded to Cloudinary: ${cloudinaryUrl.secure_url}`);
            
            const { error } = await supabase
                .from('attribute_images')
                .upsert({
                    category: 'eyeColor',
                    value: item.key,
                    style: 'anime',
                    image_url: cloudinaryUrl.secure_url,
                    prompt: item.prompt,
                    width: 512,
                    height: 512,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'category,value,style' });

            if (error) throw error;
            console.log(` ✅ Saved ${item.key} (anime) to Database.`);
        } catch (e) {
            console.error(` ❌ Failed ${item.key}: ${e.message}`);
        }
    }
    console.log('\n✨ Finished Anime eye generation!');
}

run();
