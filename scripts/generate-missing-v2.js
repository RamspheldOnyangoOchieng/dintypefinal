const fetch = require('node-fetch');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration from .env
const NOVITA_API_KEY = process.env.NOVITA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ATTRIBUTES = {
    eyeColor: ['hazel', 'grey'],
    hairColor: ['silver', 'blue'],
    hairStyle: ['bangs', 'short', 'long', 'bun', 'ponytail'],
    bodyType: ['petite', 'slim', 'athletic', 'voluptuous', 'curvy'],
    breastSize: ['small', 'medium', 'large', 'huge', 'flat'],
    buttSize: ['small', 'medium', 'large', 'athletic', 'skinny'],
    outfit: ['bikini', 'dress', 'lingerie', 'casual', 'sporty', 'office', 'uniform', 'traditional']
};

const STYLES = ['realistic', 'anime'];

function buildPrompt(category, value, style) {
    const base = 'single beautiful woman, solo female, one person only, beautiful young lady';
    let specificPrompt = '';

    if (category === 'eyeColor') specificPrompt = `${value} eyes, beautiful ${value} eye color, face close-up, expressive eyes`;
    else if (category === 'hairColor') specificPrompt = `${value} hair color, vibrant ${value} hair, clear hair color`;
    else if (category === 'hairStyle') specificPrompt = `${value} hairstyle, beautiful hair, focus on hair`;
    else if (category === 'bodyType') specificPrompt = `${value} body type, ${value} physique, full body shot, standing pose`;
    else if (category === 'breastSize') specificPrompt = `${value} breasts, ${value} chest size, upper body portrait`;
    else if (category === 'buttSize') specificPrompt = `${value} butt, ${value} hips, back view or side view showing curves`;
    else if (category === 'outfit') specificPrompt = `wearing ${value}, ${value} fashion, full body portrait`;

    if (style === 'anime') {
        return `${base}, ${specificPrompt}, anime style, anime girl, beautiful anime character, high quality anime art, detailed`;
    } else {
        return `${base}, ${specificPrompt}, photorealistic, professional photography, high quality, detailed, beautiful lighting`;
    }
}

async function generateWithNovita(prompt, category, value, style) {
    console.log(`  🎨 Generating ${style} ${category} ${value}...`);

    const modelName = style === 'anime' ? 'sd_xl_base_1.0.safetensors' : 'dreamshaper_8_93211.safetensors';

    const res = await fetch('https://api.novita.ai/v3/async/txt2img', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOVITA_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            extra: { response_image_type: 'jpeg', enable_nsfw_detection: false },
            request: {
                model_name: modelName,
                prompt: prompt,
                negative_prompt: 'man, male, boy, multiple people, low quality, distorted, bad anatomy',
                width: 512,
                height: 768,
                image_num: 1,
                batch_size: 1,
                sampler_name: 'DPM++ 2M Karras',
                guidance_scale: 7.5,
                steps: 30,
                seed: -1
            }
        })
    });

    if (!res.ok) throw new Error(`Novita error: ${await res.text()}`);
    const data = await res.json();
    const taskId = data.task_id;

    let attempts = 0;
    while (attempts < 60) {
        await new Promise(r => setTimeout(r, 2000));
        const progress = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
            headers: { 'Authorization': `Bearer ${NOVITA_API_KEY}` }
        });
        if (!progress.ok) { attempts++; continue; }
        const pd = await progress.json();
        if (pd.task?.status === 'TASK_STATUS_SUCCEED') return pd.images[0].image_url;
        if (pd.task?.status === 'TASK_STATUS_FAILED') throw new Error('Generation failed');
        attempts++;
    }
    throw new Error('Timeout');
}

async function uploadToCloudinary(url, category, value, style) {
    console.log(`  📤 Uploading to Cloudinary...`);
    const publicId = `${category}_${value}_${style}_${Date.now()}`;
    const result = await cloudinary.uploader.upload(url, {
        folder: `attribute-images/${category}`,
        public_id: publicId,
    });
    return result.secure_url;
}

async function saveToDatabase(category, value, style, imageUrl, prompt) {
    console.log(`  💾 Saving to DB...`);
    const { error } = await supabase
        .from('attribute_images')
        .upsert({
            category,
            value: value.toLowerCase(),
            style,
            image_url: imageUrl,
            prompt,
            width: 512,
            height: 768,
            updated_at: new Date().toISOString()
        }, { onConflict: 'category,value,style' });

    if (error) throw error;
}

async function main() {
    for (const style of STYLES) {
        for (const [category, values] of Object.entries(ATTRIBUTES)) {
            for (const value of values) {
                try {
                    const prompt = buildPrompt(category, value, style);
                    const novitaUrl = await generateWithNovita(prompt, category, value, style);
                    const cloudinaryUrl = await uploadToCloudinary(novitaUrl, category, value, style);
                    await saveToDatabase(category, value, style, cloudinaryUrl, prompt);
                    console.log(`  ✅ Success: ${category}-${value}-${style}`);
                } catch (err) {
                    console.error(`  ❌ Failed: ${category}-${value}-${style}: ${err.message}`);
                }
            }
        }
    }
}

main();
