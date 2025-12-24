#!/usr/bin/env node

/**
 * OPTIMIZED script to generate HIGH-QUALITY personality and relationship images
 * Uses epicrealism model + enhanced prompts for photorealistic results
 * 
 * Usage: node scripts/generate-personality-relationship-images.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURATION =====
// Get from .env or use these defaults
const NOVITA_API_KEY = process.env.NOVITA_API_KEY || 'sk_SaCwNYi5f8Q-zqa7YqSttPVMos2xxkDTcJ3rK0jiQfk';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET';

// Which to generate? personality, relationship, or both
const GENERATE_CATEGORIES = ['personality', 'relationship']; // Change to ['personality'] or ['relationship'] if needed
const GENERATE_STYLES = ['realistic', 'anime']; // realistic, anime, or both

// ===== MODELS =====
const REALISTIC_MODEL = "epicrealism_naturalSinRC1VAE_106430.safetensors"; // HIGH QUALITY
const ANIME_MODEL = "dreamshaper_8_93211.safetensors";

// ===== ENHANCED NEGATIVE PROMPTS =====
const REALISTIC_NEGATIVE_PROMPT = "ugly, deformed, bad anatomy, disfigured, mutated, extra limbs, missing limbs, fused fingers, extra fingers, bad hands, malformed hands, poorly drawn hands, poorly drawn face, blurry, jpeg artifacts, worst quality, low quality, lowres, pixelated, out of frame, tiling, watermarks, signature, censored, distortion, grain, long neck, unnatural pose, asymmetrical face, cross-eyed, lazy eye, bad feet, extra arms, extra legs, disjointed limbs, incorrect limb proportions, unrealistic body, unrealistic face, unnatural skin, disconnected limbs, lopsided, cloned face, glitch, double torso, bad posture, wrong perspective, overexposed, underexposed, low detail, unrealistic proportions, cartoon, anime style, 3d render, illustration, painting, sketch, drawing, digital art, compressed, noisy, artifacts, chromatic aberration, duplicate, morbid, mutilated, poorly drawn, cloned, gross proportions, malformed, missing, error, cropped, lowres quality, normal quality, username, text, logo";

const ANIME_NEGATIVE_PROMPT = "ugly, deformed, bad anatomy, disfigured, mutated, extra limbs, missing limbs, fused fingers, extra fingers, bad hands, malformed hands, poorly drawn hands, poorly drawn face, blurry, jpeg artifacts, worst quality, low quality, lowres, pixelated, out of frame, tiling, watermarks, signature, censored, distortion, grain, long neck, unnatural pose, asymmetrical face, cross-eyed, lazy eye, bad feet, extra arms, extra legs, disjointed limbs, incorrect limb proportions, unrealistic body, unrealistic face, unnatural skin, disconnected limbs, lopsided, cloned face, glitch, double torso, bad posture, wrong perspective, overexposed, underexposed, low detail, realistic, photorealistic, photograph, 3d, duplicate, morbid, mutilated, poorly drawn, cloned, gross proportions, malformed, missing, error, cropped, lowres quality, normal quality, username, text, logo";

// ===== ATTRIBUTES =====
const PERSONALITY_TYPES = [
    { value: 'Caregiver', description: 'Nurturing, protective, and always there to offer comfort' },
    { value: 'Sage', description: 'Wise, reflective, and a source of guidance' },
    { value: 'Innocent', description: 'Optimistic, pure-hearted, and exploring the world with wonder' },
    { value: 'Jester', description: 'Playful, humorous, and always there to make you laugh' },
    { value: 'Temptress', description: 'Flirtatious, playful, and always leaving you wanting more' },
    { value: 'Dominant', description: 'Assertive, controlling, and commanding' },
    { value: 'Submissive', description: 'Obedient, eager to please, and eager to follow' },
    { value: 'Lover', description: 'Romantic, passionate, and seeking a deep emotional connection' },
    { value: 'Nympho', description: 'Insatiable, intense sexuality, craving intimacy' },
    { value: 'Mean', description: 'Cold, dismissive, and often sarcastic' },
    { value: 'Confidant', description: 'Trustworthy, a good listener, and always can offer advice' },
    { value: 'Experimenter', description: 'Curious, willing, eager to try new things' }
];

const RELATIONSHIP_TYPES = [
    { value: 'Stranger', description: 'Unknown woman you just met' },
    { value: 'School-Mate', description: 'Fellow student' },
    { value: 'Colleague', description: 'Professional work associate' },
    { value: 'Mentor', description: 'Experienced guide and advisor' },
    { value: 'Girlfriend', description: 'Romantic partner' },
    { value: 'Sex-Friend', description: 'Intimate physical relationship' },
    { value: 'Wife', description: 'Married spouse' },
    { value: 'Mistress', description: 'Secret romantic affair' },
    { value: 'Friend', description: 'Close platonic companion' },
    { value: 'Best-Friend', description: 'Closest confidant' },
    { value: 'Step-Sister', description: 'Family through marriage' },
    { value: 'Step-Mom', description: 'Parental figure through marriage' }
];

// ===== PROMPT BUILDERS =====
function buildPersonalityPrompt(personality, style) {
    const isAnime = style === 'anime';

    // Map personalities to visual traits
    const visualTraits = {
        'Caregiver': 'soft expression, warm smile, gentle eyes, caring demeanor, nurturing pose, comforting presence',
        'Sage': 'wise expression, intelligent eyes, thoughtful gaze, serene composure, confident stance, glasses optional',
        'Innocent': 'bright smile, wide curious eyes, pure expression, youthful energy, playful pose, sweet demeanor',
        'Jester': 'playful smile, mischievous eyes, fun expression, energetic pose, cheerful vibe, bright personality',
        'Temptress': 'seductive gaze, confident smile, alluring expression, sensual pose, flirtatious vibe, enticing presence',
        'Dominant': 'strong gaze, commanding expression, powerful stance, assertive demeanor, confident presence, intense eyes',
        'Submissive': 'soft eyes, gentle expression, obedient demeanor, submissive pose, eager to please, sweet compliance',
        'Lover': 'romantic gaze, passionate expression, loving smile, intimate vibe, affectionate pose, emotional depth',
        'Nympho': 'intense gaze, passionate expression, sensual pose, seductive demeanor, craving intimacy, sultry vibe',
        'Mean': 'cold expression, dismissive look, sharp eyes, aloof demeanor, sarcastic smirk, harsh presence',
        'Confidant': 'trustworthy expression, listening pose, understanding eyes, supportive demeanor, friendly smile, approachable',
        'Experimenter': 'curious expression, adventurous eyes, open demeanor, willing pose, eager attitude, playful exploration'
    };

    const trait = visualTraits[personality] || 'beautiful woman';

    if (isAnime) {
        return `beautiful anime woman with ${trait}, anime style portrait, vibrant colors, expressive anime features, detailed anime art, upper body shot, professional anime illustration, high quality anime character, masterwork, best quality, highly detailed`;
    } else {
        return `beautiful realistic woman with ${trait}, professional portrait photography, natural lighting, high quality, photorealistic, 8k, highly detailed, dslr, soft lighting, upper body portrait, sharp focus, realistic skin texture, professional studio quality`;
    }
}

function buildRelationshipPrompt(relationship, style) {
    const isAnime = style === 'anime';

    // Map relationships to visual scenarios/settings
    const visualSettings = {
        'Stranger': 'mysterious woman, unfamiliar face, first encounter vibe, neutral background, professional distance',
        'School-Mate': 'student woman, youthful appearance, casual school setting, friendly demeanor, academic atmosphere',
        'Colleague': 'professional woman, business attire, office setting, confident pose, professional demeanor',
        'Mentor': 'experienced woman, mature appearance, wise expression, professional setting, guiding presence',
        'Girlfriend': 'romantic partner, loving expression, intimate atmosphere, affectionate pose, emotional connection',
        'Sex-Friend': 'intimate friend, sensual expression, private setting, physical chemistry, attractive pose',
        'Wife': 'married woman, mature beauty, home setting, loving partnership, committed relationship vibe',
        'Mistress': 'secret lover, alluring expression, private atmosphere, mysterious vibe, forbidden romance',
        'Friend': 'close friend, warm smile, casual setting, friendly demeanor, comfortable vibe',
        'Best-Friend': 'closest companion, genuine smile, intimate setting, deep connection, trusting expression',
        'Step-Sister': 'young woman, family setting, casual demeanor, sibling-like vibe, home atmosphere',
        'Step-Mom': 'mature woman, parental warmth, home setting, caring expression, maternal presence'
    };

    const setting = visualSettings[relationship] || 'beautiful woman';

    if (isAnime) {
        return `beautiful anime woman as ${setting}, anime style portrait, vibrant colors, expressive anime features, detailed anime character, upper body shot, professional anime illustration, high quality, masterwork, best quality, highly detailed`;
    } else {
        return `beautiful realistic woman as ${setting}, professional portrait photography, natural lighting, high quality, photorealistic, 8k, highly detailed, dslr, soft lighting, upper body portrait, sharp focus, realistic skin texture, professional studio quality`;
    }
}

// ===== NOVITA API =====
async function generateImageWithNovita(prompt, style) {
    console.log(`  🎨 Generating with prompt: "${prompt.substring(0, 100)}..."`);

    const selectedModel = style === 'anime' ? ANIME_MODEL : REALISTIC_MODEL;
    const selectedNegativePrompt = style === 'anime' ? ANIME_NEGATIVE_PROMPT : REALISTIC_NEGATIVE_PROMPT;

    const response = await fetch('https://api.novita.ai/v3/async/txt2img', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOVITA_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            extra: {
                response_image_type: 'jpeg',
                enable_nsfw_detection: false,
                nsfw_detection_level: 0,
            },
            request: {
                prompt: prompt,
                model_name: selectedModel,
                negative_prompt: selectedNegativePrompt,
                width: 512,
                height: 768,
                image_num: 1,
                steps: 50, // High quality
                seed: -1,
                sampler_name: 'DPM++ 2M Karras',
                guidance_scale: 7.5,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Novita API error: ${errorText}`);
    }

    const data = await response.json();
    const taskId = data.task_id;

    console.log(`  ⏳ Task ID: ${taskId}, waiting for completion...`);

    // Poll for completion
    let attempts = 0;
    while (attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second intervals

        const progressResponse = await fetch(
            `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
            {
                headers: {
                    'Authorization': `Bearer ${NOVITA_API_KEY}`,
                },
            }
        );

        if (!progressResponse.ok) {
            attempts++;
            continue;
        }

        const progressData = await progressResponse.json();
        const status = progressData.task?.status;

        if (status === 'TASK_STATUS_SUCCEED' || status === 'SUCCEEDED') {
            const imageUrl = progressData.images?.[0]?.image_url;
            if (!imageUrl) {
                throw new Error('No image URL in response');
            }
            console.log(`  ✅ Image generated successfully`);
            return imageUrl;
        }

        if (status === 'TASK_STATUS_FAILED' || status === 'FAILED') {
            const reason = progressData.task?.reason || 'Unknown error';
            throw new Error(`Image generation failed: ${reason}`);
        }

        attempts++;
    }

    throw new Error('Image generation timeout after 3 minutes');
}

// ===== CLOUDINARY UPLOAD =====
async function uploadToCloudinary(imageUrl, folder) {
    console.log(`  📤 Uploading to Cloudinary (folder: ${folder})...`);

    // Download image from Novita
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', imageBuffer);
    formData.append('upload_preset', 'ml_default'); // OR your preset
    formData.append('folder', folder);

    const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!uploadResponse.ok) {
        throw new Error(`Cloudinary upload failed: ${await uploadResponse.text()}`);
    }

    const uploadData = await uploadResponse.json();
    console.log(`  ✅ Uploaded to Cloudinary: ${uploadData.secure_url}`);
    return uploadData.secure_url;
}

// ===== SUPABASE STORAGE UPLOAD =====
async function uploadToSupabaseStorage(imageUrl, fileName) {
    console.log(`  📤 Uploading to Supabase Storage...`);

    // Download image from Novita
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    console.log(`  📦 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // Upload to Supabase storage
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/images/personality/${fileName}.jpg`;

    const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true',
        },
        body: imageBuffer,
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Supabase upload failed (${uploadResponse.status}): ${errorText}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/personality/${fileName}.jpg`;
    console.log(`  ✅ Uploaded to Supabase: ${publicUrl}`);
    return publicUrl;
}

// ===== DATABASE SAVE =====
async function saveToDatabase(category, value, style, imageUrl, prompt) {
    console.log(`  💾 Saving to database (${category}/${value}/${style})...`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/attribute_images`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
            category,
            value: value.toLowerCase(),
            style,
            image_url: imageUrl,
            prompt,
            width: 512,
            height: 768,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        // Ignore duplicate errors
        if (!error.includes('duplicate') && !error.includes('unique')) {
            throw new Error(`Database save failed: ${error}`);
        } else {
            console.log(`  ℹ️  Entry already exists in database (skipping)`);
        }
    } else {
        console.log(`  ✅ Saved to database`);
    }
}

// ===== MAIN GENERATION FUNCTION =====
async function generateCategoryImage(category, item, style) {
    const key = `${category}-${item.value}-${style}`;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📸 Generating: ${key}`);
    console.log('='.repeat(70));

    try {
        // Build prompt based on category
        let prompt;
        if (category === 'personality') {
            prompt = buildPersonalityPrompt(item.value, style);
        } else if (category === 'relationship') {
            prompt = buildRelationshipPrompt(item.value, style);
        } else {
            throw new Error(`Unknown category: ${category}`);
        }

        // Generate image with Novita
        const novitaImageUrl = await generateImageWithNovita(prompt, style);

        // Upload to Supabase Storage (you can switch to Cloudinary if preferred)
        const fileName = `${item.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        const publicUrl = await uploadToSupabaseStorage(novitaImageUrl, fileName);

        // Save metadata to database
        await saveToDatabase(category, item.value, style, publicUrl, prompt);

        console.log(`✅ COMPLETED: ${key}`);
        console.log(`🖼️  URL: ${publicUrl}\n`);

        return { success: true, url: publicUrl, category, value: item.value, style };
    } catch (error) {
        console.error(`❌ FAILED: ${key}`);
        console.error(`   Error: ${error.message}\n`);
        return { success: false, error: error.message, category, value: item.value, style };
    }
}

// ===== MAIN =====
async function main() {
    console.log('');
    console.log('='.repeat(70));
    console.log('🚀 HIGH-QUALITY PERSONALITY & RELATIONSHIP IMAGE GENERATOR');
    console.log('='.repeat(70));
    console.log('');
    console.log(`📁 Categories: ${GENERATE_CATEGORIES.join(', ')}`);
    console.log(`🎨 Styles: ${GENERATE_STYLES.join(', ')}`);
    console.log(`🤖 Realistic Model: ${REALISTIC_MODEL}`);
    console.log(`🎭 Anime Model: ${ANIME_MODEL}`);
    console.log('');

    const results = {
        success: [],
        failed: [],
        total: 0,
    };

    // Calculate total
    for (const category of GENERATE_CATEGORIES) {
        const items = category === 'personality' ? PERSONALITY_TYPES : RELATIONSHIP_TYPES;
        results.total += items.length * GENERATE_STYLES.length;
    }

    console.log(`📊 Total images to generate: ${results.total}`);
    console.log(`⏱️  Estimated time: ${Math.ceil(results.total * 3)} minutes (3min per image)`);
    console.log('');
    console.log('='.repeat(70));
    console.log('');

    const startTime = Date.now();

    // Generate images
    for (const category of GENERATE_CATEGORIES) {
        const items = category === 'personality' ? PERSONALITY_TYPES : RELATIONSHIP_TYPES;

        console.log(`\n📂 CATEGORY: ${category.toUpperCase()}`);
        console.log('─'.repeat(70));

        for (const style of GENERATE_STYLES) {
            console.log(`\n🎨 STYLE: ${style.toUpperCase()}\n`);

            for (const item of items) {
                const result = await generateCategoryImage(category, item, style);

                if (result.success) {
                    results.success.push(result);
                } else {
                    results.failed.push(result);
                }

                console.log(`📊 Progress: ${results.success.length + results.failed.length}/${results.total}`);
                console.log(`   ✅ Success: ${results.success.length} | ❌ Failed: ${results.failed.length}`);

                // Rate limiting delay (1 second between requests)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

    console.log('');
    console.log('='.repeat(70));
    console.log('🎉 GENERATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`✅ Successful: ${results.success.length}/${results.total}`);
    console.log(`❌ Failed: ${results.failed.length}/${results.total}`);
    console.log(`⏱️  Duration: ${durationMinutes} minutes`);
    console.log(`✨ Success Rate: ${Math.round((results.success.length / results.total) * 100)}%`);

    if (results.failed.length > 0) {
        console.log('');
        console.log('⚠️  FAILED IMAGES:');
        results.failed.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.category}/${item.value} (${item.style}): ${item.error}`);
        });
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('');
}

// Run
main().catch(error => {
    console.error('FATAL ERROR:', error);
    process.exit(1);
});
