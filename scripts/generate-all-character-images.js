require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const FormData = require('form-data');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const novitaApiKey = process.env.NOVITA_API_KEY;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('🔧 Cloudinary configured:', {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    has_api_key: !!process.env.CLOUDINARY_API_KEY,
    has_api_secret: !!process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(supabaseUrl, supabaseKey);

// ===== MODELS =====
const REALISTIC_MODEL = "epicrealism_naturalSinRC1VAE_106430.safetensors"; // HIGH QUALITY
const ANIME_MODEL = "dreamshaper_8_93211.safetensors";

// ===== ENHANCED NEGATIVE PROMPTS =====
const REALISTIC_NEGATIVE = "ugly, deformed, bad anatomy, disfigured, mutated, extra limbs, missing limbs, fused fingers, extra fingers, bad hands, malformed hands, poorly drawn hands, poorly drawn face, blurry, jpeg artifacts, worst quality, low quality, lowres, pixelated, out of frame, tiling, watermarks, signature, censored, distortion, grain, long neck, unnatural pose, asymmetrical face, cross-eyed, lazy eye, bad feet, extra arms, extra legs, disjointed limbs, incorrect limb proportions, unrealistic body, unrealistic face, unnatural skin, disconnected limbs, lopsided, cloned face, glitch, double torso, bad posture, wrong perspective, overexposed, underexposed, low detail, unrealistic proportions, cartoon, anime style, 3d render, illustration, painting, sketch, drawing, digital art, compressed, noisy, artifacts, chromatic aberration, duplicate, morbid, mutilated, poorly drawn, cloned, gross proportions, malformed, missing, error, cropped, lowres quality, normal quality, username, text, logo";

const ANIME_NEGATIVE = "ugly, deformed, bad anatomy, disfigured, mutated, extra limbs, missing limbs, fused fingers, extra fingers, bad hands, malformed hands, poorly drawn hands, poorly drawn face, blurry, jpeg artifacts, worst quality, low quality, lowres, pixelated, out of frame, tiling, watermarks, signature, censored, distortion, grain, long neck, unnatural pose, asymmetrical face, cross-eyed, lazy eye, bad feet, extra arms, extra legs, disjointed limbs, incorrect limb proportions, unrealistic body, unrealistic face, unnatural skin, disconnected limbs, lopsided, cloned face, glitch, double torso, bad posture, wrong perspective, overexposed, underexposed, low detail, realistic, photorealistic, photograph, 3d, duplicate, morbid, mutilated, poorly drawn, cloned, gross proportions, malformed, missing, error, cropped, lowres quality, normal quality, username, text, logo";

// ===== PERSONALITIES =====
const personalities = [
    {
        key: 'caregiver',
        name: 'Caregiver',
        description: 'Nurturing, protective, and always there to offer comfort',
        realisticPrompt: 'beautiful woman with soft expression, warm smile, gentle caring eyes, nurturing demeanor, comforting presence, wearing elegant comfortable attire, soft lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr, natural skin texture',
        animePrompt: 'beautiful anime woman with warm caring smile, gentle eyes, nurturing expression, soft colors, professional anime illustration, vibrant, highly detailed, masterwork quality'
    },
    {
        key: 'sage',
        name: 'Sage',
        description: 'Wise, reflective, and a source of guidance',
        realisticPrompt: 'beautiful woman with wise expression, intelligent thoughtful eyes, serene composure, confident stance, elegant professional attire, glasses optional, soft lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with wise intelligent eyes, thoughtful expression, serene demeanor, elegant attire, professional anime illustration, detailed, masterwork quality'
    },
    {
        key: 'innocent',
        name: 'Innocent',
        description: 'Optimistic, pure-hearted and exploring the world with wonder',
        realisticPrompt: 'beautiful woman with bright smile, wide curious innocent eyes, pure expression, youthful energy, playful pose, sweet demeanor, light clothing, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with bright innocent eyes, sweet smile, pure expression, youthful vibe, playful pose, vibrant colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'jester',
        name: 'Jester',
        description: 'Playful, humorous, and always there to make you laugh',
        realisticPrompt: 'beautiful woman with playful smile, mischievous bright eyes, fun expression, energetic pose, cheerful vibe, colorful casual outfit, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with playful mischievous smile, sparkling eyes, fun energetic expression, cheerful vibe, colorful outfit, vibrant, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'temptress',
        name: 'Temptress',
        description: 'Flirtatious, playful, and always leaving you wanting more',
        realisticPrompt: 'beautiful woman with seductive gaze, confident alluring smile, flirtatious expression, sensual pose, enticing presence, elegant dress, dramatic lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with seductive eyes, flirtatious smile, alluring expression, elegant pose, stylish outfit, dramatic colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'dominant',
        name: 'Dominant',
        description: 'Assertive, controlling, and commanding',
        realisticPrompt: 'beautiful woman with strong commanding gaze, assertive expression, powerful confident stance, intense eyes, professional business attire, dramatic lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with intense commanding gaze, assertive expression, powerful stance, strong presence, elegant outfit, dramatic lighting, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'submissive',
        name: 'Submissive',
        description: 'Obedient, eager to please, and eager to follow',
        realisticPrompt: 'beautiful woman with soft gentle eyes, sweet compliance expression, obedient demeanor, submissive pose, eager to please, elegant feminine outfit, soft lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with soft eyes, gentle submissive expression, sweet demeanor, obedient pose, elegant feminine outfit, soft colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'lover',
        name: 'Lover',
        description: 'Romantic, passionate, and seeking a deep emotional connection',
        realisticPrompt: 'beautiful woman with romantic loving gaze, passionate expression, affectionate pose, emotional depth, intimate vibe, elegant romantic outfit, soft lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with romantic eyes, passionate loving expression, affectionate pose, emotional depth, romantic outfit, soft colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'nympho',
        name: 'Nympho',
        description: 'Insatiable, intense sexuality, craving intimacy',
        realisticPrompt: 'beautiful woman with intense passionate gaze, sensual expression, seductive pose, craving intimacy, sultry vibe, elegant attire, intimate lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with intense eyes, passionate sensual expression, seductive pose, intimate vibe, elegant outfit, dramatic colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'mean',
        name: 'Mean',
        description: 'Cold, dismissive, and often sarcastic',
        realisticPrompt: 'beautiful woman with cold dismissive expression, sharp eyes, aloof demeanor, sarcastic smirk, harsh presence, elegant dark outfit, dramatic lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with cold eyes, dismissive expression, aloof demeanor, sharp features, dark elegant outfit, dramatic lighting, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'confidant',
        name: 'Confidant',
        description: 'Trustworthy, a good listener, and always can offer advice',
        realisticPrompt: 'beautiful woman with trustworthy expression, understanding eyes, listening pose, supportive demeanor, friendly approachable smile, casual comfortable outfit, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with trustworthy eyes, understanding expression, friendly smile, supportive demeanor, casual outfit, warm colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'experimenter',
        name: 'Experimenter',
        description: 'Curious, willing, eager to try new things',
        realisticPrompt: 'beautiful woman with curious adventurous expression, eager eyes, open demeanor, willing pose, playful exploration, trendy modern outfit, dynamic lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with curious bright eyes, adventurous expression, eager pose, open demeanor, trendy outfit, vibrant dynamic colors, professional anime illustration, highly detailed, masterwork quality'
    }
];

// ===== RELATIONSHIPS =====
const relationships = [
    {
        key: 'stranger',
        name: 'Stranger',
        description: 'Unknown woman you just met',
        realisticPrompt: 'beautiful mysterious woman, unfamiliar face, first encounter vibe, neutral professional background, professional distance, elegant outfit, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with mysterious aura, unfamiliar presence, neutral background, professional appearance, elegant outfit, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'school-mate',
        name: 'School-Mate',
        description: 'Fellow student',
        realisticPrompt: 'beautiful student woman, youthful appearance, casual academic setting, friendly demeanor, school atmosphere, casual outfit, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman in student attire, youthful appearance, school setting, friendly smile, casual outfit, vibrant colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'colleague',
        name: 'Colleague',
        description: 'Professional work associate',
        realisticPrompt: 'beautiful professional woman, business attire, office setting background, confident demeanor, professional appearance, suit or business casual, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman in business attire, professional setting, confident expression, office outfit, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'mentor',
        name: 'Mentor',
        description: 'Experienced guide and advisor',
        realisticPrompt: 'beautiful experienced woman, mature appearance, wise guiding expression, professional setting, mentoring presence, elegant professional attire, soft lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with wise mature appearance, guiding expression, professional setting, elegant attire, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'girlfriend',
        name: 'Girlfriend',
        description: 'Romantic partner',
        realisticPrompt: 'beautiful romantic woman, loving affectionate expression, intimate warm atmosphere, emotional connection vibe, casual romantic outfit, soft lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with loving expression, romantic atmosphere, affectionate pose, casual romantic outfit, warm soft colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'sex-friend',
        name: 'Sex-Friend',
        description: 'Intimate physical relationship',
        realisticPrompt: 'beautiful attractive woman, sensual intimate expression, private setting vibe, physical chemistry, elegant casual attire, intimate lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with sensual expression, intimate atmosphere, attractive pose, elegant casual outfit, intimate colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'wife',
        name: 'Wife',
        description: 'Married spouse',
        realisticPrompt: 'beautiful married woman, mature loving beauty, home setting vibe, partnership presence, committed relationship, elegant comfortable outfit, warm lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with mature beauty, loving wife expression, home setting, elegant comfortable outfit, warm colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'mistress',
        name: 'Mistress',
        description: 'Secret romantic affair',
        realisticPrompt: 'beautiful alluring woman, mysterious seductive expression, private atmosphere, secret lover vibe, elegant sensual outfit, dramatic lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with alluring mysterious expression, secret affair vibe, elegant outfit, dramatic lighting, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'friend',
        name: 'Friend',
        description: 'Close platonic companion',
        realisticPrompt: 'beautiful warm woman, genuine friendly smile, casual comfortable setting, friendly demeanor, approachable vibe, casual relaxed outfit, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with warm friendly smile, casual setting, approachable demeanor, comfortable outfit, friendly colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'best-friend',
        name: 'Best-Friend',
        description: 'Closest confidant',
        realisticPrompt: 'beautiful close companion woman, genuine deep smile, intimate friendly setting, trusting expression, strong connection vibe, casual comfortable outfit, warm lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with genuine smile, close friendship vibe, intimate setting, trusting expression, comfortable outfit, warm colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'step-sister',
        name: 'Step-Sister',
        description: 'Family through marriage',
        realisticPrompt: 'beautiful young woman, family setting atmosphere, sibling-like casual vibe, home background, friendly demeanor, casual comfortable outfit, natural lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman in family setting, sibling vibe, casual home atmosphere, friendly expression, comfortable outfit, warm colors, professional anime illustration, highly detailed, masterwork quality'
    },
    {
        key: 'step-mom',
        name: 'Step-Mom',
        description: 'Parental figure through marriage',
        realisticPrompt: 'beautiful mature woman, parental warmth expression, home setting, caring maternal presence, elegant comfortable outfit, warm lighting, professional portrait photography, photorealistic, 8k, highly detailed, dslr',
        animePrompt: 'beautiful anime woman with mature appearance, maternal caring expression, home setting, elegant comfortable outfit, warm colors, professional anime illustration, highly detailed, masterwork quality'
    }
];

// ===== NOVITA IMAGE GENERATION =====
async function generateImage(prompt, style) {
    console.log(`  🎨 Generating ${style} image...`);

    const selectedModel = style === 'anime' ? ANIME_MODEL : REALISTIC_MODEL;
    const selectedNegative = style === 'anime' ? ANIME_NEGATIVE : REALISTIC_NEGATIVE;

    const requestBody = {
        extra: {
            response_image_type: "jpeg",
            enable_nsfw_detection: false,
            nsfw_detection_level: 0
        },
        request: {
            model_name: selectedModel,
            prompt: prompt,
            negative_prompt: selectedNegative,
            width: 512,
            height: 768,
            image_num: 1,
            steps: 50, // High quality
            seed: -1,
            sampler_name: "DPM++ 2M Karras",
            guidance_scale: 7.5
        }
    };

    try {
        // Submit task
        const response = await axios.post(
            'https://api.novita.ai/v3/async/txt2img',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${novitaApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const taskId = response.data.task_id;
        console.log(`  ⏳ Task ID: ${taskId}`);

        // Poll for result
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const progressResponse = await axios.get(
                `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${novitaApiKey}`
                    }
                }
            );

            const status = progressResponse.data.task?.status;

            if (status === 'TASK_STATUS_SUCCEED' || status === 'SUCCEEDED') {
                const imageUrl = progressResponse.data.images?.[0]?.image_url;
                if (!imageUrl) {
                    throw new Error('No image URL in response');
                }
                console.log(`  ✅ Image generated`);
                return imageUrl;
            } else if (status === 'TASK_STATUS_FAILED' || status === 'FAILED') {
                throw new Error('Image generation failed');
            }

            attempts++;
            if (attempts % 10 === 0) {
                console.log(`  ⏳ Still waiting... (${attempts}/${maxAttempts})`);
            }
        }

        throw new Error('Image generation timeout');
    } catch (error) {
        console.error('  ❌ Generation error:', error.response?.data || error.message);
        throw error;
    }
}

async function downloadImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
}

async function uploadToCloudinary(buffer, fileName, category) {
    console.log(`  📤 Uploading to Cloudinary...`);

    return new Promise((resolve, reject) => {
        const folder = `character-images/${category}`;

        // Upload using stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: fileName.replace('.jpg', ''),
                resource_type: 'image',
                format: 'jpg',
                overwrite: true,
                invalidate: true
            },
            (error, result) => {
                if (error) {
                    console.error(`  ❌ Cloudinary upload error:`, error);
                    reject(error);
                } else {
                    console.log(`  ✅ Uploaded to Cloudinary`);
                    resolve(result.secure_url);
                }
            }
        );

        // Write buffer to stream
        uploadStream.end(buffer);
    });
}

async function saveToDatabase(category, key, name, style, imageUrl, prompt) {
    console.log(`  💾 Saving to database...`);

    const { error } = await supabase
        .from('attribute_images')
        .upsert({
            category,
            value: key,
            style,
            image_url: imageUrl,
            prompt,
            width: 512,
            height: 768,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'category,value,style'
        });

    if (error) {
        // Ignore duplicate errors
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
            throw error;
        }
        console.log(`  ℹ️  Already exists in database`);
    } else {
        console.log(`  ✅ Saved to database`);
    }
}

async function processItem(category, item, style) {
    const prompt = style === 'realistic' ? item.realisticPrompt : item.animePrompt;
    const key = `${category}-${item.key}-${style}`;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📸 ${category.toUpperCase()}: ${item.name} (${style})`);
    console.log('='.repeat(70));

    try {
        // Generate
        const imageUrl = await generateImage(prompt, style);

        // Download
        console.log(`  ⬇️  Downloading...`);
        const imageBuffer = await downloadImage(imageUrl);
        console.log(`  ✅ Downloaded (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

        // Upload
        const fileName = `${item.key}-${Date.now()}.jpg`;
        const publicUrl = await uploadToCloudinary(imageBuffer, fileName, category);

        // Save to DB
        await saveToDatabase(category, item.key, item.name, style, publicUrl, prompt);

        console.log(`✅ COMPLETE: ${item.name} (${style})`);
        console.log(`🖼️  URL: ${publicUrl}`);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error(`❌ FAILED: ${item.name} (${style})`);
        console.error(`   Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('');
    console.log('='.repeat(70));
    console.log('🚀 HIGH-QUALITY IMAGE GENERATOR');
    console.log('='.repeat(70));
    console.log('');
    console.log(`📁 Categories: personality, relationship`);
    console.log(`🎨 Styles: realistic, anime`);
    console.log(`🤖 Realistic Model: ${REALISTIC_MODEL}`);
    console.log(`🎭 Anime Model: ${ANIME_MODEL}`);
    console.log('');

    const styles = ['realistic', 'anime'];
    const results = { success: [], failed: [] };

    const totalImages = (personalities.length + relationships.length) * styles.length;
    console.log(`📊 Total images to generate: ${totalImages}`);
    console.log(`⏱️  Estimated time: ${Math.ceil(totalImages * 3)} minutes`);
    console.log('');
    console.log('='.repeat(70));

    // Generate personalities
    for (const style of styles) {
        console.log(`\n\n📂 PERSONALITY - ${style.toUpperCase()}`);
        console.log('─'.repeat(70));

        for (const personality of personalities) {
            const result = await processItem('personality', personality, style);
            if (result.success) {
                results.success.push(result);
            } else {
                results.failed.push(result);
            }

            console.log(`\n📊 Progress: ${results.success.length + results.failed.length}/${totalImages}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        }
    }

    // Generate relationships
    for (const style of styles) {
        console.log(`\n\n📂 RELATIONSHIP - ${style.toUpperCase()}`);
        console.log('─'.repeat(70));

        for (const relationship of relationships) {
            const result = await processItem('relationship', relationship, style);
            if (result.success) {
                results.success.push(result);
            } else {
                results.failed.push(result);
            }

            console.log(`\n📊 Progress: ${results.success.length + results.failed.length}/${totalImages}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        }
    }

    // Summary
    console.log('');
    console.log('='.repeat(70));
    console.log('🎉 GENERATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`✅ Successful: ${results.success.length}/${totalImages}`);
    console.log(`❌ Failed: ${results.failed.length}/${totalImages}`);
    console.log(`✨ Success Rate: ${Math.round((results.success.length / totalImages) * 100)}%`);

    if (results.failed.length > 0) {
        console.log('');
        console.log('⚠️  FAILED IMAGES:');
        results.failed.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.error}`);
        });
    }

    console.log('');
    console.log('='.repeat(70));
}

main().catch(console.error);
