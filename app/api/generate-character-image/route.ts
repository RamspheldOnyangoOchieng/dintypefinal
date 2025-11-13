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
        console.error('Novita API error:', error);
        throw new Error(`Novita API error: ${error}`);
    }

    const data = await response.json();
    const taskId = data.task_id;

    console.log('🎨 Image generation task started:', taskId);

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
            console.warn('Failed to check generation progress, attempt', attempts);
            continue;
        }

        const progressData = await progressResponse.json();

        if (progressData.task.status === 'TASK_STATUS_SUCCEED') {
            const imageUrl = progressData.images[0]?.image_url;
            if (!imageUrl) {
                throw new Error('No image URL in response');
            }
            console.log('✅ Image generated successfully:', imageUrl);
            return imageUrl;
        } else if (progressData.task.status === 'TASK_STATUS_FAILED') {
            throw new Error('Image generation failed: ' + (progressData.task.reason || 'Unknown error'));
        }

        // Still processing
        console.log(`⏳ Generation progress... attempt ${attempts}/${maxAttempts}`);
    }

    throw new Error('Image generation timed out after 2 minutes');
}

function buildEnhancedPrompt(details: CharacterDetails): { prompt: string; negativePrompt: string } {
    const styleDescriptor = details.style === 'anime' 
        ? 'anime character, illustrated, cel-shaded, vibrant colors' 
        : 'photorealistic portrait, professional photography, studio lighting, high detail';

    const components = [
        'beautiful young woman',
        'female model',
        'feminine face',
        'female features',
        'girl',
        'lady',
        styleDescriptor,
        details.ethnicity ? `${details.ethnicity} ethnicity` : '',
        details.age ? `age ${details.age}` : '',
        details.eyeColor ? `${details.eyeColor} eyes` : '',
        details.eyeShape ? `${details.eyeShape} eye shape` : '',
        details.lipShape ? `${details.lipShape} lips` : '',
        details.hairStyle ? `${details.hairStyle} hairstyle` : '',
        details.hairLength ? `${details.hairLength} hair` : '',
        details.hairColor ? `${details.hairColor} hair color` : '',
        details.bodyType ? `${details.bodyType} body type` : '',
        details.personality ? `${details.personality} expression` : '',
        'centered portrait',
        'frontal view',
        'high quality',
        'detailed features',
        'beautiful lighting',
    ].filter(Boolean);

    const prompt = components.join(', ');

    const negativePrompt = 'man, male, boy, masculine, beard, mustache, male face, masculine features, nude, naked, nsfw, explicit, sexual content, blurry, low quality, distorted, ugly, bad anatomy, missing features, extra fingers, mutation, deformed, duplicate, watermark, signature, text, cropped, disfigured';

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
