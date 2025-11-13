import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/client';
import { getAnonymousUserId } from '@/lib/anonymous-user';

const NOVITA_API_KEY = process.env.NOVITA_API_KEY;

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
    if (!NOVITA_API_KEY) {
        throw new Error('NOVITA_API_KEY is not configured');
    }

    // ABSOLUTE FEMALE ONLY - NO MALES ALLOWED
    const absoluteNegative = [
        'man', 'male', 'boy', 'men', 'masculine', 'beard', 'facial hair', 'mustache',
        'guy', 'dude', 'gentleman', 'masc', 'male face', 'male body',
        'multiple people', 'group', 'crowd', 'two people',
        'animal', 'creature', 'monster',
        'blurry', 'low quality', 'distorted', 'ugly', 'deformed',
        'watermark', 'text', 'signature'
    ].join(', ');

    const response = await fetch('https://api.novita.ai/v3/async/txt2img', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOVITA_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            extra: {
                response_image_type: 'jpeg',
                enable_nsfw_detection: false
            },
            request: {
                model_name: 'dreamshaper_8_93211.safetensors', // BEST MODEL FOR WOMEN
                prompt: prompt,
                negative_prompt: absoluteNegative,
                width: 512,
                height: 768,
                image_num: 1,
                sampler_name: 'DPM++ 2M Karras',
                guidance_scale: 7.5,
                steps: 30,
                seed: -1
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Novita API error: ${error}`);
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
                'Authorization': `Bearer ${NOVITA_API_KEY}`,
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
    // FORCE FEMALE ONLY - NO EXCEPTIONS
    const femaleOnly = 'woman, female, lady, girl, beautiful woman, solo woman, single woman only';
    
    const styleDescriptor = customization.style === 'anime' 
        ? 'anime girl, anime woman, female anime character' 
        : 'beautiful woman, photorealistic woman, female model';

    const ageDescriptor = customization.age ? `${customization.age} year old woman` : 'young woman';
    const bodyDescriptor = customization.body ? `${customization.body} woman` : '';
    const ethnicityDescriptor = customization.ethnicity ? `${customization.ethnicity} woman` : '';
    
    const hairDescriptor = [
        customization.hair_style && `${customization.hair_style.toLowerCase()} hair`,
        customization.hair_length && `${customization.hair_length.toLowerCase()} hair`,
        customization.hair_color && `${customization.hair_color.toLowerCase()} hair`,
    ].filter(Boolean).join(', ');

    const faceDescriptor = [
        customization.eye_color && `${customization.eye_color.toLowerCase()} eyes`,
        customization.eye_shape && `${customization.eye_shape.toLowerCase()} eyes`,
        customization.lip_shape && `${customization.lip_shape.toLowerCase()} lips`,
        customization.face_shape && `${customization.face_shape.toLowerCase()} face`,
    ].filter(Boolean).join(', ');

    const bodyDetailsDescriptor = [
        customization.bust && `${customization.bust.toLowerCase()} bust`,
        customization.hips && `${customization.hips.toLowerCase()} hips`,
    ].filter(Boolean).join(', ');

    const allDescriptors = [
        femaleOnly,
        styleDescriptor,
        ageDescriptor,
        bodyDescriptor,
        ethnicityDescriptor,
        hairDescriptor,
        faceDescriptor,
        bodyDetailsDescriptor,
    ].filter(Boolean);

    const prompt = allDescriptors.join(', ') + ', high quality, detailed, beautiful, portrait';

    const negativePrompt = ''; // Will be filled by generateImageWithNovita

    return { prompt, negativePrompt };
}

// Helper function to get or create default "My Collection"
async function getOrCreateDefaultCollection(userId: string) {
    try {
        const supabaseAdmin = await createAdminClient();
        if (!supabaseAdmin) {
            return null;
        }

        // Look for an existing "My Collection" (or "Mina Samlingar" in Swedish)
        const { data: existing } = await supabaseAdmin
            .from('collections')
            .select('id')
            .eq('user_id', userId)
            .eq('name', 'My Collection')
            .limit(1);

        if (existing && existing.length > 0) {
            return existing[0].id;
        }

        // If not found, create it
        const { data: created, error } = await supabaseAdmin
            .from('collections')
            .insert({
                user_id: userId,
                name: 'My Collection',
                description: 'My generated characters and images'
            })
            .select('id')
            .single();

        if (error) {
            console.warn('Failed to create default collection:', error);
            return null;
        }

        return created?.id || null;
    } catch (error) {
        console.warn('Error in getOrCreateDefaultCollection:', error);
        return null;
    }
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

        // Get user ID (authenticated or anonymous)
        const supabase = createClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        let userId: string;

        if (session?.user?.id) {
            console.log('[API] User is authenticated:', session.user.id);
            userId = session.user.id;
        } else {
            userId = getAnonymousUserId();
            console.log('[API] Using anonymous ID:', userId);
        }

        // Build prompt from customization
        const { prompt, negativePrompt } = buildPromptFromCustomization(customization);
        console.log('📝 Generated prompt:', prompt);

        // Generate image
        const imageUrl = await generateImageWithNovita(prompt, negativePrompt);
        console.log('✅ Character image generated:', imageUrl);

        // Try to save the generated image to the user's collection via our save API
        try {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || `http://localhost:3000`
            const saveResp = await fetch(`${siteUrl.replace(/\/$/,'')}/api/save-generated-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, imageUrl, modelUsed: 'novita' }),
            });

            let collectionId: string | null = null;
            let addedToCollection = false;

            if (saveResp.ok) {
                const saveData = await saveResp.json();
                const imageId = saveData.image?.id;

                // Try to get or create default collection and add image to it
                if (imageId) {
                    collectionId = await getOrCreateDefaultCollection(userId);
                    
                    if (collectionId) {
                        const supabaseAdmin = await createAdminClient();
                        if (supabaseAdmin) {
                            const { error: updateError } = await supabaseAdmin
                                .from('generated_images')
                                .update({ collection_id: collectionId })
                                .eq('id', imageId)
                                .eq('user_id', userId);

                            if (updateError) {
                                console.warn('Warning: failed to add image to collection:', updateError);
                            } else {
                                console.log('✅ Image added to collection:', collectionId);
                                addedToCollection = true;
                            }
                        }
                    }
                }

                return NextResponse.json({
                    success: true,
                    image_url: imageUrl,
                    customization: customization,
                    saved: saveData,
                    collection_id: collectionId,
                    added_to_collection: addedToCollection,
                });
            } else {
                const errText = await saveResp.text();
                console.warn('Warning: failed to save generated image:', errText);
                return NextResponse.json({
                    success: true,
                    image_url: imageUrl,
                    customization: customization,
                    saved: null,
                    save_error: errText,
                });
            }
        } catch (saveError) {
            console.warn('Warning: error saving generated image:', saveError);
            return NextResponse.json({
                success: true,
                image_url: imageUrl,
                customization: customization,
                saved: null,
                save_error: saveError instanceof Error ? saveError.message : String(saveError),
            });
        }
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
