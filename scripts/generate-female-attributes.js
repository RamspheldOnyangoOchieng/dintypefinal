const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const NOVITA_API_KEY = process.env.NOVITA_API_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
// Cloudinary Keys
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!NOVITA_API_KEY || !POSTGRES_URL || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Missing environment variables.');
    console.error('Checking: NOVITA_API_KEY, POSTGRES_URL/DATABASE_URL, CLOUDINARY_*');
    process.exit(1);
}

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/txt2img';

// Initialize Postgres
const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
});

// Initialize Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Attributes Data - SAME AS BEFORE
const personalities = [
    {
        key: 'caregiver',
        name: 'Caregiver',
        description: 'Nurturing, protective, and always there to offer comfort',
        prompt: 'Professional portrait photo of a kind warm woman, gentle smile, nurturing expression, soft lighting, comfortable elegant clothing, cozy atmosphere, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'sage',
        name: 'Sage',
        description: 'Wise, reflective, and a source of guidance',
        prompt: 'Professional portrait photo of an intelligent woman with glasses, thoughtful expression, library background, sophisticated attire, wisdom, intellectual atmosphere, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'innocent',
        name: 'Innocent',
        description: 'Optimistic, pure-hearted and exploring the world with wonder',
        prompt: 'Professional portrait photo of a youthful woman with wide bright eyes, sweet innocent smile, wearing light pastel colors, sunlight, garden background, pure atmosphere, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'jester',
        name: 'Jester',
        description: 'Playful, humorous, and always there to make you laugh',
        prompt: 'Professional portrait photo of a fun energetic woman with big smile, colorful outfit, playful expression, dynamic lighting, vibrant background, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'temptress',
        name: 'Temptress',
        description: 'Flirtatious, playful, and always leaving you wanting more',
        prompt: 'Professional portrait photo of a stunning woman with alluring gaze, confident seductive smile, wearing elegant dress, glamorous makeup, dramatic lighting, professional photography, 8k, highly detailed',
        style: 'realistic'
    },
    {
        key: 'dominant',
        name: 'Dominant',
        description: 'Assertive, controlling, and commanding',
        prompt: 'Professional portrait photo of a powerful confident woman with intense gaze, strong facial features, wearing elegant business suit, authoritative expression, dramatic lighting, professional photography, 8k, highly detailed',
        style: 'realistic'
    },
    {
        key: 'submissive',
        name: 'Submissive',
        description: 'Obedient, eager to please, and eager to follow',
        prompt: 'Professional portrait photo of a beautiful gentle woman with soft submissive eyes, sweet shy smile, wearing elegant feminine outfit, delicate features, soft lighting, professional photography, 8k, highly detailed',
        style: 'realistic'
    },
    {
        key: 'lover',
        name: 'Lover',
        description: 'Romantic, passionate, and seeking a deep emotional connection',
        prompt: 'Professional portrait photo of a beautiful romantic woman with loving eyes, warm genuine smile, wearing elegant romantic dress, rose petals background, soft romantic lighting, professional photography, 8k, highly detailed',
        style: 'realistic'
    },
    {
        key: 'nympho',
        name: 'Nympho',
        description: 'Insatiable, intense sexuality, craving intimacy',
        prompt: 'Professional portrait photo of a stunning woman with intense passionate gaze, sensual expression, wearing elegant lingerie, bedroom setting, intimate lighting, professional photography, 8k, highly detailed',
        style: 'realistic'
    },
    {
        key: 'mean',
        name: 'Mean',
        description: 'Cold, dismissive, and often sarcastic',
        prompt: 'Professional portrait photo of a beautiful woman with cold calculating eyes, dismissive expression, wearing dark elegant outfit, sharp features, dramatic shadows, professional photography, 8k, highly detailed',
        style: 'realistic'
    },
    {
        key: 'confidant',
        name: 'Confidant',
        description: 'Trustworthy, a good listener, and always can offer advice',
        prompt: 'Professional portrait photo of a beautiful approachable woman with kind understanding eyes, warm friendly smile, wearing casual comfortable outfit, relaxed coffee shop setting, natural lighting, professional photography, 8k, highly detailed',
        style: 'realistic'
    },
    {
        key: 'experimenter',
        name: 'Experimenter',
        description: 'Curious, willing, eager to try new things',
        prompt: 'Professional portrait photo of a beautiful adventurous woman with curious bright eyes, excited expression, wearing trendy modern outfit, colorful creative background, dynamic lighting, professional photography, 8k, highly detailed',
        style: 'realistic'
    }
];

// Relationships Data - SAME AS BEFORE
const relationships = [
    {
        key: 'stranger',
        name: 'Stranger',
        prompt: 'Professional portrait photo of a beautiful mysterious woman in urban setting, passing by, street photography style, candid moment, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'school-mate',
        name: 'School Mate',
        prompt: 'Professional portrait photo of a cute young woman holding books, college campus background, friendly smile, casual student attire, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'colleague',
        name: 'Colleague',
        prompt: 'Professional portrait photo of a smart professional woman in office environment, business casual attire, confident friendly expression, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'mentor',
        name: 'Mentor',
        prompt: 'Professional portrait photo of a sophisticated mature woman, inspiring confident expression, elegant professional attire, executive office setting, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'girlfriend',
        name: 'Girlfriend',
        prompt: 'Professional portrait photo of a beautiful woman looking directly at camera with love, date night outfit, romantic restaurant lighting, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'sex-friend',
        name: 'Sex Friend',
        prompt: 'Professional portrait photo of an attractive woman, alluring confident expression, stylish modern casual wear, intimate atmosphere, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'wife',
        name: 'Wife',
        prompt: 'Professional portrait photo of an elegant married woman, loving devoted expression, sophisticated classic style, warm home atmosphere, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'mistress',
        name: 'Mistress',
        prompt: 'Professional portrait photo of a seductive elegant woman, mysterious alluring expression, luxurious sophisticated attire, dramatic lighting, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'friend',
        name: 'Friend',
        prompt: 'Professional portrait photo of a cheerful friendly woman, genuine smile, casual comfortable clothing, relaxed natural setting, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'best-friend',
        name: 'Best Friend',
        prompt: 'Professional portrait photo of an energetic fun-loving woman, bright joyful expression, trendy casual style, vibrant friendly atmosphere, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'step-sister',
        name: 'Step Sister',
        prompt: 'Professional portrait photo of a young beautiful woman, playful sisterly expression, casual home attire, cozy familiar setting, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    },
    {
        key: 'step-mom',
        name: 'Step Mom',
        prompt: 'Professional portrait photo of an attractive mature woman, caring motherly expression, elegant casual home wear, warm comfortable home setting, photorealistic, 8k quality, sharp details, perfect composition',
        style: 'realistic'
    }
];

// Helper Functions
async function generateImage(prompt, style = 'realistic') {
    let finalPrompt = prompt;
    let modelName = "sd_xl_base_1.0.safetensors";
    
    if (style === 'anime') {
        finalPrompt = 'anime style, ' + prompt.replace('photorealistic', '').replace('Professional portrait photo', 'Anime character portrait');
        modelName = "dreamshaper_8_lcm.safetensors"; 
    }

    console.log(` Generating image... Style: ${style}, Model: ${modelName}`);
    
    const requestBody = {
        extra: {
            response_image_type: "jpeg",
            enable_nsfw_detection: false
        },
        request: {
            model_name: modelName,
            prompt: finalPrompt,
            negative_prompt: "nsfw, nude, naked, explicit, sexual content, ugly, deformed, low quality, blurry, watermark, text, signature, bad anatomy, bad hands, missing fingers",
            width: 512,
            height: 768,
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
            headers: {
                'Authorization': `Bearer ${NOVITA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const taskId = response.data.task_id;
        console.log(` Task created: ${taskId}`);

        // Poll for result
        let result = null;
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            attempts++;

            const progressResponse = await axios.get(
                `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${NOVITA_API_KEY}`
                    }
                }
            );

            const task = progressResponse.data.task;
            
            if (task.status === 'TASK_STATUS_SUCCEED') {
                result = progressResponse.data.images[0].image_url;
                break;
            } else if (task.status === 'TASK_STATUS_FAILED') {
                console.error(`Generation failed reason:`, task.reason);
                throw new Error(`Generation failed: ${task.reason || 'Unknown error'}`);
            }
            
            if (attempts % 5 === 0) process.stdout.write('.');
        }

        if (!result) throw new Error('Timeout waiting for image');
        
        console.log('\n Image generated successfully');
        return result;

    } catch (error) {
        console.error(' Error calling Novita:', error.response?.data || error.message);
        throw error;
    }
}

async function uploadToCloudinary(imageUrl, category, key, style) {
    try {
        console.log(` Uploading to Cloudinary (folder: attribute-images/${category})...`);
        
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: `attribute-images/${category}`,
            public_id: `${key}-${style}-${Date.now()}`,
            resource_type: 'image',
            context: {
                category: category,
                key: key,
                style: style
            }
        });

        console.log(` Uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;

    } catch (error) {
        console.error(' Error uploading to Cloudinary:', error.message);
        throw error;
    }
}

async function saveToDatabase(category, key, style, imageUrl, prompt) {
    const query = `
        INSERT INTO attribute_images (category, value, style, image_url, prompt, width, height, updated_at)
        VALUES ($1, $2, $3, $4, $5, 512, 768, NOW())
        ON CONFLICT (category, value, style) 
        DO UPDATE SET 
            image_url = EXCLUDED.image_url,
            prompt = EXCLUDED.prompt,
            updated_at = NOW();
    `;

    try {
        await pool.query(query, [category, key, style, imageUrl, prompt]);
        console.log(' Saved to database (via Postgres)');
    } catch (error) {
        console.error(' Error saving to DB:', error.message);
        throw error;
    }
}

async function processBatch(items, category) {
    const styles = ['realistic', 'anime'];

    for (const style of styles) {
        console.log(`\n\n=== Processing ${category} - ${style} style ===`);
        
        for (const item of items) {
            console.log(`\n Processing: ${item.name} (${item.key})`);
            
            try {
                // 1. Generate
                const novitaUrl = await generateImage(item.prompt, style);
                
                // 2. Upload to Cloudinary
                const cloudinaryUrl = await uploadToCloudinary(novitaUrl, category, item.key, style);
                
                // 3. Save to DB
                await saveToDatabase(category, item.key, style, cloudinaryUrl, item.prompt);
                
            } catch (error) {
                console.error(` Failed to process ${item.name}:`, error.message);
            }
        }
    }
}

async function main() {
    console.log('Starting batch generation script (Cloudinary + Postgres)...');
    
    // Connect to DB
    try {
        const client = await pool.connect();
        client.release();
        console.log('Successfully connected to Postgres.');
    } catch (err) {
        console.error('Failed to connect to Postgres:', err.message);
        process.exit(1);
    }
    
    // Process Personalities
    await processBatch(personalities, 'personality');
    
    // Process Relationships
    await processBatch(relationships, 'relationship');
    
    console.log('\n\nAll operations completed!');
    await pool.end();
}

main().catch(console.error);
