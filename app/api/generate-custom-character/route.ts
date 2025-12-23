import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedNovitaKey } from "@/lib/unified-api-keys"

interface CustomizationData {
    style: 'realistic' | 'anime';
    age: string;
    body: string;
    ethnicity: string;
    hair_style: string;
    hair_length: string;
    hair_color: string;
    eye_color: string;
    eye_shape: string;
    lip_shape: string;
    face_shape: string;
    hips: string;
    bust: string;
}

async function generateImageWithNovita(prompt: string, negativePrompt: string): Promise<string> {
    const { key: NOVITA_API, error } = await getUnifiedNovitaKey();
    if (!NOVITA_API) {
        throw new Error(error || 'NOVITA_API is not configured');
    }

    const response = await fetch('https://api.novita.ai/v3/async/txt2img', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOVITA_API}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            extra: {
                response_image_type: 'jpeg',
            },
            request: {
                model_name: 'sd_xl_base_1.0.safetensors',
                prompt: prompt,
                negative_prompt: negativePrompt,
                width: 512,
                height: 768,
                image_num: 1,
                sampler_name: 'DPM++ 2M Karras',
                guidance_scale: 7,
                steps: 25,
                seed: -1,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`NOVITA API error: ${error}`);
    }

    const data = await response.json();
    const taskId = data.task_id;

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;

        const progressResponse = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
            headers: {
                'Authorization': `Bearer ${NOVITA_API}`,
            },
        });

        if (!progressResponse.ok) {
            throw new Error('Failed to check generation progress');
        }

        const progressData = await progressResponse.json();

        if (progressData.task.status === 'TASK_STATUS_SUCCEED') {
            const imageUrl = progressData.images[0]?.image_url;
            if (!imageUrl) {
                throw new Error('No image URL in response');
            }
            return imageUrl;
        } else if (progressData.task.status === 'TASK_STATUS_FAILED') {
            throw new Error('Image generation failed');
        }
    }

    throw new Error('Image generation timed out');
}

function buildPromptFromCustomization(customization: CustomizationData): { prompt: string; negativePrompt: string } {
    const styleDescriptor = customization.style === 'anime' 
        ? 'anime character, illustrated, cel-shaded' 
        : 'photorealistic, beautiful woman, professional portrait photography';

    const ageDescriptor = customization.age ? `${customization.age} years old` : '';
    const bodyDescriptor = customization.body || '';
    const ethnicityDescriptor = customization.ethnicity ? `${customization.ethnicity} ethnicity` : '';
    
    const hairDescriptor = [
        customization.hair_style && `${customization.hair_style.toLowerCase()} hair style`,
        customization.hair_length && `${customization.hair_length.toLowerCase()} hair`,
        customization.hair_color && `${customization.hair_color.toLowerCase()} hair color`,
    ].filter(Boolean).join(', ');

    const faceDescriptor = [
        customization.eye_color && `${customization.eye_color.toLowerCase()} eyes`,
        customization.eye_shape && `${customization.eye_shape.toLowerCase()} eye shape`,
        customization.lip_shape && `${customization.lip_shape.toLowerCase()} lips`,
        customization.face_shape && `${customization.face_shape.toLowerCase()} face`,
    ].filter(Boolean).join(', ');

    const bodyDetailsDescriptor = [
        customization.bust && `${customization.bust.toLowerCase()} bust`,
        customization.hips && `${customization.hips.toLowerCase()} hips`,
    ].filter(Boolean).join(', ');

    const allDescriptors = [
        styleDescriptor,
        ageDescriptor,
        bodyDescriptor,
        ethnicityDescriptor,
        hairDescriptor,
        faceDescriptor,
        bodyDetailsDescriptor,
    ].filter(Boolean);

    const prompt = allDescriptors.join(', ') + ', high quality, detailed, centered, frontal view, beautiful lighting';

    const negativePrompt = 'blurry, low quality, distorted, ugly, bad anatomy, missing features, extra fingers, mutation, deformed, duplicate, watermark, signature, text, cropped';

    return { prompt, negativePrompt };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const customization: CustomizationData = body;

        if (!customization || Object.keys(customization).length === 0) {
            return NextResponse.json(
                { error: 'Missing customization data' },
                { status: 400 }
            );
        }

        console.log('🎨 Generating custom character with:', customization);

        // Build prompt from customization
        const { prompt, negativePrompt } = buildPromptFromCustomization(customization);
        console.log('📝 Generated prompt:', prompt);

        // Generate image
        const imageUrl = await generateImageWithNovita(prompt, negativePrompt);
        console.log('✅ Character image generated:', imageUrl);

        return NextResponse.json({
            success: true,
            image_url: imageUrl,
            customization: customization,
        });
    } catch (error) {
        console.error('❌ Error generating custom character:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Failed to generate character image',
                success: false,
            },
            { status: 500 }
        );
    }
}
