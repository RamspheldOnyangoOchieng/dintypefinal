import { NextRequest, NextResponse } from 'next/server';

const NOVITA_API_KEY = process.env.NOVITA_API_KEY;

interface CharacterDetails {
    style: 'realistic' | 'anime';
    ethnicity?: string;
    age?: string;
    eyeColor?: string;
    hairStyle?: string;
    hairLength?: string;
    hairColor?: string;
    bodyType?: string;
    eyeShape?: string;
    lipShape?: string;
    personality?: string;
    relationship?: string;
}

async function generateImageWithNovita(prompt: string, negativePrompt: string): Promise<string> {
    if (!NOVITA_API_KEY) {
        throw new Error('NOVITA_API_KEY is not configured');
    }

    console.log('🚀 Starting image generation with Novita AI...');
    console.log('📝 Prompt length:', prompt.length, 'characters');

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
            },
            request: {
                model_name: 'sd_xl_base_1.0.safetensors',
                prompt: prompt,
                negative_prompt: negativePrompt,
                width: 512,
                height: 768,
                // CRITICAL: Generate ONLY ONE image
                image_num: 1,
                batch_size: 1,
                sampler_name: 'DPM++ 2M Karras',
                guidance_scale: 7.5,
                steps: 30,
                seed: -1,
                clip_skip: 2,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Novita API error:', error);
        throw new Error(`Novita API error: ${error}`);
    }

    const data = await response.json();
    const taskId = data.task_id;

    console.log('🎨 Image generation task started. Task ID:', taskId);
    console.log('⏳ Waiting for image generation to complete...');

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;

        const progressResponse = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
            headers: {
                'Authorization': `Bearer ${NOVITA_API_KEY}`,
            },
        });

        if (!progressResponse.ok) {
            console.warn(`⚠️ Failed to check generation progress, attempt ${attempts}/${maxAttempts}`);
            continue;
        }

        const progressData = await progressResponse.json();

        if (progressData.task.status === 'TASK_STATUS_SUCCEED') {
            // CRITICAL: Only take the FIRST image (should be the only one)
            const imageUrl = progressData.images[0]?.image_url;
            if (!imageUrl) {
                throw new Error('No image URL in response');
            }
            console.log('✅ Single character image generated successfully!');
            console.log('🖼️ Image URL:', imageUrl);
            console.log('📊 Total images in response:', progressData.images?.length || 0);
            
            // Verify we only got ONE image
            if (progressData.images?.length > 1) {
                console.warn(`⚠️ WARNING: Received ${progressData.images.length} images but expected 1. Using first image only.`);
            }
            
            return imageUrl;
        } else if (progressData.task.status === 'TASK_STATUS_FAILED') {
            throw new Error('Image generation failed: ' + (progressData.task.reason || 'Unknown error'));
        }

        // Still processing
        if (attempts % 5 === 0) { // Log every 10 seconds
            console.log(`⏳ Generation in progress... (${attempts * 2}s elapsed)`);
        }
    }

    throw new Error('Image generation timed out after 2 minutes');
}

function buildEnhancedPrompt(details: CharacterDetails): { prompt: string; negativePrompt: string } {
    // CRITICAL: This function combines ALL selected characteristics into ONE unified prompt
    // to generate a SINGLE character image with ALL features combined
    
    const styleDescriptor = details.style === 'anime' 
        ? 'anime character, illustrated, cel-shaded, vibrant colors, anime art style' 
        : 'photorealistic portrait, professional photography, studio lighting, high detail, realistic';

    // Build a comprehensive prompt that combines ALL characteristics
    const components = [
        // Base: Single female character
        'ONE beautiful young woman',
        'single female character',
        'solo portrait',
        'feminine face and body',
        
        // Style
        styleDescriptor,
        
        // Physical Attributes - All combined in ONE character
        details.ethnicity ? `${details.ethnicity} ethnicity` : '',
        details.age ? `${details.age} years old` : '',
        
        // Eyes - Combined features
        details.eyeColor && details.eyeShape 
            ? `${details.eyeShape} shaped ${details.eyeColor} eyes`
            : details.eyeColor 
            ? `${details.eyeColor} eyes` 
            : details.eyeShape 
            ? `${details.eyeShape} eyes` 
            : '',
        
        // Lips
        details.lipShape ? `${details.lipShape} lips` : '',
        
        // Hair - All hair attributes combined
        details.hairStyle && details.hairLength && details.hairColor
            ? `${details.hairColor} ${details.hairLength} ${details.hairStyle} hairstyle`
            : details.hairStyle && details.hairColor
            ? `${details.hairColor} ${details.hairStyle} hair`
            : details.hairLength && details.hairColor
            ? `${details.hairColor} ${details.hairLength} hair`
            : details.hairColor
            ? `${details.hairColor} hair`
            : details.hairStyle
            ? `${details.hairStyle} hairstyle`
            : details.hairLength
            ? `${details.hairLength} hair`
            : '',
        
        // Body type
        details.bodyType ? `${details.bodyType} body type` : '',
        
        // Expression/Personality
        details.personality ? `${details.personality} expression and demeanor` : '',
        details.relationship ? `${details.relationship} vibe` : '',
        
        // Quality and framing
        'centered portrait',
        'frontal view',
        'upper body shot',
        'high quality',
        'detailed features',
        'beautiful lighting',
        'sharp focus',
        'professional composition',
    ].filter(Boolean); // Remove empty strings

    // Join all components with commas to create ONE comprehensive prompt
    const prompt = components.join(', ');

    // Negative prompt to ensure we get ONE clean female character
    const negativePrompt = [
        // NO males
        'man', 'male', 'boy', 'masculine', 'beard', 'mustache', 'male face', 'masculine features',
        // NO multiple people
        'multiple people', 'two people', 'group', 'crowd', 'many people', 'several people',
        // NO inappropriate content
        'nude', 'naked', 'nsfw', 'explicit', 'sexual content',
        // NO quality issues
        'blurry', 'low quality', 'distorted', 'ugly', 'bad anatomy', 'missing features',
        'extra fingers', 'mutation', 'deformed', 'duplicate', 'watermark', 'signature',
        'text', 'cropped', 'disfigured', 'bad proportions', 'extra limbs', 'extra heads',
        'multiple faces', 'split image', 'collage'
    ].join(', ');

    console.log('🎯 COMBINED PROMPT FOR SINGLE CHARACTER:', prompt);
    console.log('🚫 NEGATIVE PROMPT:', negativePrompt);

    return { prompt, negativePrompt };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const characterDetails: CharacterDetails = body.characterDetails;

        if (!characterDetails) {
            return NextResponse.json(
                { success: false, error: 'Missing characterDetails' },
                { status: 400 }
            );
        }

        console.log('🎨 Generating character image with details:', characterDetails);

        // Build enhanced prompt
        const { prompt, negativePrompt } = buildEnhancedPrompt(characterDetails);
        console.log('📝 Prompt:', prompt);

        // Generate image
        const imageUrl = await generateImageWithNovita(prompt, negativePrompt);

        return NextResponse.json({
            success: true,
            imageUrl: imageUrl,
            enhancedPrompt: prompt,
        });

    } catch (error) {
        console.error('❌ Error generating character image:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate character image',
            },
            { status: 500 }
        );
    }
}
