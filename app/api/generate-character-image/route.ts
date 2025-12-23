import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinary-upload';
import { getUnifiedNovitaKey } from '@/lib/unified-api-keys';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterDetails } = body;

    if (!characterDetails) {
      return NextResponse.json(
        { error: 'Character details are required' },
        { status: 400 }
      );
    }

    // Step 1: Build the character description from details
    const description = `A ${characterDetails.style || 'realistic'} style image of a ${characterDetails.age || 'young'} ${characterDetails.ethnicity || 'woman'} woman. She has ${characterDetails.eyeColor || 'brown'} eyes, ${characterDetails.hairColor || 'brown'} ${characterDetails.hairStyle || 'long'} hair. Her body type is ${characterDetails.bodyType || 'slim'} with ${characterDetails.breastSize || 'medium'} breasts and ${characterDetails.buttSize || 'medium'} butt. Her personality is ${characterDetails.personality || 'friendly'} and she's your ${characterDetails.relationship || 'friend'}.`;

    // Step 2: Enhance the description using Novità API
    const { key: novitaApiKey, error: keyError } = await getUnifiedNovitaKey();
    if (!novitaApiKey) {
      return NextResponse.json(
        { error: keyError || 'Novità API key not configured' },
        { status: 500 }
      );
    }

    const novitaResponse = await fetch('https://api.novita.ai/v3/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${novitaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.1',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating detailed, vivid image generation prompts for anime and realistic woman characters. Create a complete, descriptive prompt suitable for image generation that captures the character visually and creatively. Focus on visual details like appearance, pose, lighting, setting, and artistic style. Keep it under 200 words and make it very descriptive.'
          },
          {
            role: 'user',
            content: `Create a detailed image generation prompt for this character: ${description}. The style should be ${characterDetails.style === 'anime' ? 'anime/manga art style with vibrant colors and expressive features' : 'photorealistic with natural lighting and lifelike details'}. Make it vivid and suitable for an AI image generator.`
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
        response_format: { type: 'text' }
      }),
    });

    if (!novitaResponse.ok) {
      const errorText = await novitaResponse.text();
      console.error('Novità API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to enhance character description' },
        { status: 500 }
      );
    }

    const novitaData = await novitaResponse.json();
    const enhancedPrompt = novitaData.choices?.[0]?.message?.content || description;

    console.log('Enhanced prompt:', enhancedPrompt);

    // Step 3: Generate image using RunPod API
    const runpodApiKey = process.env.RUNPOD_API_KEY;
    if (!runpodApiKey) {
      return NextResponse.json(
        { error: 'RunPod API key not configured' },
        { status: 500 }
      );
    }

    const runpodResponse = await fetch('https://api.runpod.ai/v2/qwen-image-t2i/runsync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runpodApiKey}`,
      },
      body: JSON.stringify({
        input: {
          prompt: enhancedPrompt,
          negative_prompt: 'low quality, blurry, distorted, deformed, bad anatomy, ugly, disgusting, text, watermark',
          size: '1328*1328',
          seed: -1,
          enable_safety_checker: false,
        },
      }),
    });

    if (!runpodResponse.ok) {
      const errorText = await runpodResponse.text();
      console.error('RunPod API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate character image' },
        { status: 500 }
      );
    }

    const runpodData = await runpodResponse.json();
    
    // Extract image URL from response
    const runpodImageUrl = runpodData.output?.result || runpodData.output?.image_url || runpodData.output?.images?.[0] || null;
    
    if (!runpodImageUrl) {
      console.error('No image URL in response:', runpodData);
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    console.log('Image generated successfully from RunPod:', runpodImageUrl);

    // Step 4: Upload to Cloudinary CDN
    let cloudinaryImageUrl = runpodImageUrl;
    try {
      console.log('[Character Creation] Uploading image to Cloudinary CDN...');
      cloudinaryImageUrl = await uploadImageToCloudinary(runpodImageUrl, 'character-images');
      console.log('[Character Creation] Image uploaded to Cloudinary:', cloudinaryImageUrl);
    } catch (cloudinaryError) {
      console.error('[Character Creation] Failed to upload to Cloudinary:', cloudinaryError);
      // Fall back to RunPod URL if Cloudinary fails
      console.log('[Character Creation] Using RunPod URL as fallback');
    }

    return NextResponse.json({
      success: true,
      imageUrl: cloudinaryImageUrl,
      enhancedPrompt,
    });

  } catch (error) {
    console.error('Error generating character image:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
