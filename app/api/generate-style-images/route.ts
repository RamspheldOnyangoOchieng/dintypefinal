import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNovitaApiKey } from '@/lib/api-keys';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface GenerateImageRequest {
  style: 'realistic' | 'anime';
}

async function generateImageWithNovita(prompt: string, negativePrompt: string): Promise<string> {
  const NOVITA_API = await getNovitaApiKey();
  
  if (!NOVITA_API) {
    throw new Error('No Novita API key configured. Please add it in Admin Dashboard or .env file');
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

    attempts++;
  }

  throw new Error('Image generation timeout');
}

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download image');
  }
  return response.arrayBuffer();
}

async function uploadToSupabase(imageBuffer: ArrayBuffer, fileName: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('assets')
    .upload(fileName, imageBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('assets')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const { style } = body;

    if (!style || !['realistic', 'anime'].includes(style)) {
      return NextResponse.json(
        { error: 'Invalid style. Must be "realistic" or "anime"' },
        { status: 400 }
      );
    }

    // Define prompts for each style
    const prompts = {
      realistic: {
        prompt: 'professional portrait photography, beautiful elegant woman, sophisticated fashion, studio lighting, photorealistic, high detail, sharp focus, professional makeup, elegant pose, fashionable outfit, confident expression, upper body shot, 8k uhd, natural skin texture',
        negative: 'nude, naked, nsfw, explicit, sexual, vulgar, inappropriate, low quality, blurry, distorted, deformed, ugly, cartoon, anime, illustration'
      },
      anime: {
        prompt: 'anime style, beautiful anime girl, manga aesthetic, vibrant colors, detailed anime art, elegant pose, fashionable anime outfit, expressive anime eyes, professional anime illustration, upper body portrait, high quality anime art, cel shaded',
        negative: 'nude, naked, nsfw, explicit, sexual, vulgar, inappropriate, low quality, blurry, distorted, deformed, 3d, realistic, photograph, western cartoon'
      }
    };

    const { prompt, negative } = prompts[style];

    console.log(`Generating ${style} style image...`);
    
    // Generate image with NOVITA
    const imageUrl = await generateImageWithNovita(prompt, negative);
    console.log('Image generated:', imageUrl);

    // Download the image
    console.log('Downloading image...');
    const imageBuffer = await downloadImage(imageUrl);

    // Upload to Supabase storage
    const fileName = `style-images/${style}-style-${Date.now()}.jpg`;
    console.log('Uploading to Supabase...');
    const publicUrl = await uploadToSupabase(imageBuffer, fileName);

    console.log('Upload complete:', publicUrl);

    return NextResponse.json({
      success: true,
      style,
      imageUrl: publicUrl,
      originalUrl: imageUrl,
    });

  } catch (error) {
    console.error('Error generating style image:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to generate both style images at once
export async function GET() {
  try {
    const results = {
      realistic: null as string | null,
      anime: null as string | null,
      errors: [] as string[],
    };

    // Generate realistic style
    try {
      const realisticPrompt = {
        prompt: 'professional portrait photography, beautiful elegant woman, sophisticated fashion, studio lighting, photorealistic, high detail, sharp focus, professional makeup, elegant pose, fashionable outfit, confident expression, upper body shot, 8k uhd, natural skin texture',
        negative: 'nude, naked, nsfw, explicit, sexual, vulgar, inappropriate, low quality, blurry, distorted, deformed, ugly, cartoon, anime, illustration'
      };

      const realisticUrl = await generateImageWithNovita(realisticPrompt.prompt, realisticPrompt.negative);
      const realisticBuffer = await downloadImage(realisticUrl);
      results.realistic = await uploadToSupabase(realisticBuffer, `style-images/realistic-style-${Date.now()}.jpg`);
    } catch (error) {
      results.errors.push(`Realistic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Wait a bit before generating anime style to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate anime style
    try {
      const animePrompt = {
        prompt: 'anime style, beautiful anime girl, manga aesthetic, vibrant colors, detailed anime art, elegant pose, fashionable anime outfit, expressive anime eyes, professional anime illustration, upper body portrait, high quality anime art, cel shaded',
        negative: 'nude, naked, nsfw, explicit, sexual, vulgar, inappropriate, low quality, blurry, distorted, deformed, 3d, realistic, photograph, western cartoon'
      };

      const animeUrl = await generateImageWithNovita(animePrompt.prompt, animePrompt.negative);
      const animeBuffer = await downloadImage(animeUrl);
      results.anime = await uploadToSupabase(animeBuffer, `style-images/anime-style-${Date.now()}.jpg`);
    } catch (error) {
      results.errors.push(`Anime: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: results.realistic !== null || results.anime !== null,
      results,
    });

  } catch (error) {
    console.error('Error in batch generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
