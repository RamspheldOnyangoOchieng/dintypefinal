/**
 * Novita AI Image Generation API Client
 * Generates tasteful, professional images for character attributes
 */

import { getUnifiedNovitaKey } from "./unified-api-keys"

const NOVITA_API_URL = `https://api.novita.ai/v3/async/txt2img`;

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  model?: string;
  style?: 'realistic' | 'anime';
}

export interface GeneratedImage {
  url: string;
  seed: number;
  width: number;
  height: number;
}

/**
 * Generate image using Novita AI API
 */
export async function generateImage(params: ImageGenerationParams): Promise<GeneratedImage> {
  // Get API key with fallback (DB → .env)
  const { key: NOVITA_API_KEY, error: keyError } = await getUnifiedNovitaKey()

  if (!NOVITA_API_KEY) {
    throw new Error(keyError || 'Novita API key is not configured');
  }

  const {
    prompt,
    negativePrompt = 'low quality, blurry, distorted, deformed, bad anatomy, ugly, disgusting, text, watermark',
    width = 512,
    height = 768,
    steps = 30,
    seed = -1,
    model = 'sd_xl_base_1.0.safetensors',
    style = 'realistic'
  } = params;

  // Enhance prompt with style-specific details
  let enhancedPrompt = style === 'realistic'
    ? `professional portrait photography, ${prompt}, elegant, sophisticated, high fashion, studio lighting, professional makeup, tasteful, classy, high quality, detailed`
    : `anime style, ${prompt}, beautiful anime art, detailed illustration, high quality, professional digital art, clean lines, vibrant colors`;

  // Truncate to 1000 characters to respect API limit of 1024
  if (enhancedPrompt.length > 1000) {
    enhancedPrompt = enhancedPrompt.substring(0, 1000);
  }

  const requestBody = {
    extra: {
      response_image_type: "jpeg",
      enable_nsfw_detection: false,
      nsfw_detection_level: 0
    },
    request: {
      model_name: model,
      prompt: enhancedPrompt,
      negative_prompt: negativePrompt,
      width,
      height,
      sampler_name: 'DPM++ 2M Karras',
      steps,
      guidance_scale: 7,
      seed,
      batch_size: 1,
      image_num: 1,
    }
  };

  try {
    // Submit generation request
    const response = await fetch(NOVITA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOVITA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Novita API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const taskId = data.task_id;

    // Poll for completion
    const result = await pollForCompletion(taskId, NOVITA_API_KEY);

    console.log('Novita polling result:', JSON.stringify(result, null, 2));

    let imageUrl = '';
    let seed = -1;
    let width = params.width || 512;
    let height = params.height || 768;

    if (result.images && result.images.length > 0) {
      imageUrl = result.images[0].image_url;
      // Some responses have different structure for seed/dims in images array or at root
      // Prioritize root if available, else assume requested dims or fallback
      seed = result.seed || -1;
      width = result.width || width;
      height = result.height || height;
    } else if (result.task && result.task.images && result.task.images.length > 0) {
      // Handle task/images structure if nested
      imageUrl = result.task.images[0].image_url;
      seed = result.task.seed || seed;
    } else {
      throw new Error(`No images found in Novita response: ${JSON.stringify(result)}`);
    }

    return {
      url: imageUrl,
      seed: seed,
      width: width,
      height: height,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Poll Novita API for task completion
 */
async function pollForCompletion(taskId: string, apiKey: string, maxAttempts = 60): Promise<any> {
  const pollUrl = `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const response = await fetch(pollUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.statusText}`);
    }

    const data = await response.json();

    // Check various status fields depending on exact API version response
    const status = data.task ? data.task.status : data.status;

    if (status === 'TASK_STATUS_SUCCEED' || status === 'SUCCEEDED') {
      // Return the whole data object so caller can find images wherever they are
      return data;
    } else if (status === 'TASK_STATUS_FAILED' || status === 'FAILED') {
      const reason = data.task ? data.task.reason : (data.reason || 'Unknown error');
      throw new Error(`Image generation failed: ${reason}`);
    }

    // Continue polling if still processing
  }

  throw new Error('Image generation timed out');
}

/**
 * Build prompt for specific attributes based on detailed specifications
 */
export function buildAttributePrompt(attributes: {
  age?: string;
  ethnicity?: string;
  bodyType?: string;
  style?: 'realistic' | 'anime';
}): string {
  const { age, ethnicity, bodyType, style = 'realistic' } = attributes;

  const parts: string[] = [];

  // Base style description
  if (style === 'realistic') {
    parts.push('attractive female avatar with life-like, ultra-realistic features, skin texture, and proportions');
    parts.push('idealized, polished, and highly desirable');
    parts.push('resembles a real person');
  } else {
    parts.push('attractive female avatar with anime-style features');
    parts.push('larger expressive eyes, stylized proportions, and vibrant color tones');
    parts.push('bold, artistic, and idealized for fantasy appeal');
  }

  // Age description with detailed specifications
  if (age) {
    const ageMap: Record<string, string> = {
      '18-19': 'very youthful, fresh-faced, with smooth skin and a playful, energetic presence typical of late teens',
      '20s': 'woman in her twenties: vibrant, fit, adventurous, with a sense of youthful maturity starting to emerge',
      '30s': 'confident woman in her thirties: balanced, attractive, slightly more defined features, showing maturity and self-assurance',
      '40s': 'woman in her forties: sophisticated, experienced, with a confident and attractive adult presence',
      '50s': 'woman in her fifties: mature, refined, with signs of life experience and charisma, possibly with subtle aging features',
      '60s': 'woman in her sixties: distinguished, wise, still attractive, possibly silver-haired or showing graceful aging',
      '70+': 'older woman, 70 years or more: deeply mature, unique charm, with strong character lines that show wisdom and life lived',
    };
    parts.push(ageMap[age] || 'beautiful woman');
  }

  // Ethnicity description with detailed specifications
  if (ethnicity) {
    const ethnicityMap: Record<string, string> = {
      'Caucasian': 'attractive woman with lighter skin tones and a sharper or angular facial structure, idealized and desirable',
      'Asian': 'attractive woman with fair to golden skin tones and a softer or oval facial structure, idealized and desirable',
      'Arab': 'attractive woman with olive to light brown skin tones and strong, defined facial features, idealized and desirable',
      'Indian': 'attractive woman with medium brown to deep brown skin tones and rounded or symmetrical facial features, idealized and desirable',
      'Latina': 'attractive woman with warm tan to light brown skin tones and expressive, vibrant facial features, idealized and desirable',
      'African': 'attractive woman with deep brown to dark skin tones and bold, well-defined facial features, idealized and desirable',
      'Mixed': 'attractive woman with blended skin tones and unique facial harmony that combines traits from multiple backgrounds, idealized and desirable',
      // Legacy mappings (will map to new ones)
      'European': 'attractive woman with lighter skin tones and a sharper or angular facial structure, idealized and desirable',
      'East Asian': 'attractive woman with fair to golden skin tones and a softer or oval facial structure, idealized and desirable',
      'South Asian': 'attractive woman with medium brown to deep brown skin tones and rounded or symmetrical facial features, idealized and desirable',
      'Middle Eastern': 'attractive woman with olive to light brown skin tones and strong, defined facial features, idealized and desirable',
      'Caribbean': 'attractive woman with warm tan to light brown skin tones and expressive, vibrant facial features, idealized and desirable',
    };
    parts.push(ethnicityMap[ethnicity] || '');
  }

  // Body type description with detailed specifications
  if (bodyType) {
    const bodyMap: Record<string, string> = {
      'Muscular': 'defined and strong physique, emphasizing power and intensity',
      'Athletic': 'lean and toned body, reflecting agility and balanced strength',
      'Slim': 'slender and light figure, projecting elegance and subtle charm',
      'Chubby': 'soft and full body, radiating warmth, comfort, and approachability',
      'Cub': 'youthful yet stocky build, blending a playful vibe with strength',
      'Average': 'natural and relatable physique, offering versatility and everyday realism',
      'Curvy': 'curvy hourglass figure, full and feminine proportions',
      'Plus-size': 'full-figured, plus size beauty with soft curves',
    };
    parts.push(bodyMap[bodyType] || '');
  }

  // Professional photography details for realistic style
  if (style === 'realistic') {
    parts.push('professional portrait photography');
    parts.push('studio lighting, perfect skin texture');
    parts.push('wearing elegant fashionable outfit');
    parts.push('upper body shot, three-quarter view');
    parts.push('professional makeup, tasteful styling');
    parts.push('high quality, 8k resolution, sharp focus');
  } else {
    parts.push('professional anime illustration');
    parts.push('detailed face and eyes, clean lines');
    parts.push('stylish anime outfit, vibrant colors');
    parts.push('upper body portrait, dynamic pose');
    parts.push('studio quality anime art, cel shading');
    parts.push('high detail, professional digital art');
  }

  return parts.filter(Boolean).join(', ');
}

/**
 * Generate images for all attribute combinations
 */
export async function generateAttributeImages(
  style: 'realistic' | 'anime',
  category: 'age' | 'body' | 'ethnicity',
  values: string[]
): Promise<Map<string, GeneratedImage>> {
  const results = new Map<string, GeneratedImage>();

  for (const value of values) {
    try {
      const attributes: any = { style };
      attributes[category] = value;

      const prompt = buildAttributePrompt(attributes);
      const image = await generateImage({ prompt, style });

      results.set(value, image);

      console.log(`Generated image for ${category}: ${value}`);
    } catch (error) {
      console.error(`Failed to generate image for ${category}: ${value}`, error);
    }
  }

  return results;
}
