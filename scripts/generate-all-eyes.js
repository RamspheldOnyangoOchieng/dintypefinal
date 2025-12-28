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

if (!NOVITA_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Missing environment variables.');
    process.exit(1);
}

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/txt2img';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

const eyeColors = [
    { key: 'brown', name: 'Brun', prompt: 'Extreme macro close-up of a beautiful human eye with a rich brown iris, ultra-detailed texture, long eyelashes, professional studio lighting, 8k, photorealistic' },
    { key: 'blue', name: 'Blå', prompt: 'Extreme macro close-up of a beautiful human eye with a vibrant blue iris, crystal clear details, ultra-detailed texture, long eyelashes, professional studio lighting, 8k, photorealistic' },
    { key: 'green', name: 'Grön', prompt: 'Extreme macro close-up of a beautiful human eye with a stunning green iris, detailed iris pattern, ultra-detailed texture, long eyelashes, professional studio lighting, 8k, photorealistic' },
    { key: 'hazel', name: 'Hazel', prompt: 'Extreme macro close-up of a beautiful human eye with a hazel iris featuring shifts of green, gold, and brown, ultra-detailed texture, long eyelashes, professional studio lighting, 8k, photorealistic' },
    { key: 'grey', name: 'Grå', prompt: 'Extreme macro close-up of a beautiful human eye with a striking grey iris, detailed texture, smoky tones, long eyelashes, professional studio lighting, 8k, photorealistic' }
];

async function generateImage(prompt, style = 'realistic') {
    let finalPrompt = prompt;
    let modelName = "sd_xl_base_1.0.safetensors";
    
    if (style === 'anime') {
        finalPrompt = 'anime style, close-up of a beautiful anime eye, ' + prompt.replace('photorealistic', '').replace('Extreme macro close-up', 'Detailed close-up');
        modelName = "dreamshaper_8_lcm.safetensors"; 
    }

    console.log(` Generating image... Style: ${style}`);
    
    const requestBody = {
        extra: { response_image_type: "jpeg", enable_nsfw_detection: false },
        request: {
            model_name: modelName,
            prompt: finalPrompt,
            negative_prompt: "nsfw, nude, low quality, blurry, watermark, text, signature, bad anatomy",
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
            const task = progressResponse.data.task;
            if (task.status === 'TASK_STATUS_SUCCEED') {
                return progressResponse.data.images[0].image_url;
            } else if (task.status === 'TASK_STATUS_FAILED') {
                throw new Error(`Generation failed: ${task.reason}`);
            }
        }
        throw new Error('Timeout waiting for image');
    } catch (error) {
        console.error(' Error calling Novita:', error.message);
        throw error;
    }
}

async function uploadToCloudinary(imageUrl, key, style) {
    const result = await cloudinary.uploader.upload(imageUrl, {
        folder: `attribute-images/eyeColor`,
        public_id: `eyeColor_${key}_${style}_${Date.now()}`
    });
    return result.secure_url;
}

async function saveToDatabase(key, style, imageUrl, prompt) {
    const { error } = await supabase
        .from('attribute_images')
        .upsert({
            category: 'eyeColor',
            value: key,
            style: style,
            image_url: imageUrl,
            prompt: prompt,
            width: 512,
            height: 512,
            updated_at: new Date().toISOString()
        }, { onConflict: 'category,value,style' });

    if (error) throw error;
    console.log(` ✅ Saved ${key} (${style}) to database.`);
}

async function main() {
    for (const style of ['realistic', 'anime']) {
        for (const item of eyeColors) {
            console.log(`\nProcessing: ${item.key} (${style})`);
            try {
                const novitaUrl = await generateImage(item.prompt, style);
                const cloudinaryUrl = await uploadToCloudinary(novitaUrl, item.key, style);
                await saveToDatabase(item.key, style, cloudinaryUrl, item.prompt);
            } catch (error) {
                console.error(` Failed to process ${item.key}:`, error.message);
            }
        }
    }
}

main();
