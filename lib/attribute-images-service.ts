/**
 * Service for managing attribute images with caching
 */

import { createClient } from '@/lib/supabase/server';
import { generateImage, buildAttributePrompt, GeneratedImage } from '@/lib/novita-api';

export interface AttributeImage {
  id: string;
  category: string;
  value: string;
  style: 'realistic' | 'anime';
  image_url: string;
  seed?: number;
  width?: number;
  height?: number;
  prompt?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get cached image for an attribute - ONLY fetch from database, no generation
 * All attribute images should be pre-generated via scripts
 */
export async function getAttributeImage(
  category: string,
  value: string,
  style: 'realistic' | 'anime'
): Promise<AttributeImage | null> {
  const supabase = await createClient();

  try {
    // Fetch from database - ONLY, no generation fallback
    const { data: cached, error: fetchError } = await supabase
      .from('attribute_images')
      .select('*')
      .eq('category', category)
      .eq('value', value)
      .eq('style', style)
      .single();

    if (cached && !fetchError) {
      console.log(`✅ Image found for ${category}:${value}:${style}`);
      return cached;
    }

    if (fetchError?.code === 'PGRST116') {
      // Not found - don't try to generate, just return null quickly
      console.warn(`❌ Image not found in DB: ${category}:${value}:${style}`);
      return null;
    }

    // Other database errors
    console.error(`Database error fetching ${category}:${value}:${style}:`, fetchError);
    return null;
  } catch (error) {
    console.error('Error getting attribute image:', error);
    return null;
  }
}

/**
 * Generate image and save to cache
 */
export async function generateAndCacheImage(
  category: string,
  value: string,
  style: 'realistic' | 'anime'
): Promise<AttributeImage | null> {
  const supabase = await createClient();

  try {
    // Build prompt based on category and value
    const attributes: any = { style };
    attributes[category === 'body' ? 'bodyType' : category] = value;
    
    const prompt = buildAttributePrompt(attributes);

    // Generate image
    const generatedImage = await generateImage({ prompt, style });

    // Save to database
    const { data, error } = await supabase
      .from('attribute_images')
      .insert({
        category,
        value,
        style,
        image_url: generatedImage.url,
        seed: generatedImage.seed,
        width: generatedImage.width,
        height: generatedImage.height,
        prompt,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`Successfully generated and cached image for ${category}:${value}:${style}`);
    return data;
  } catch (error) {
    console.error('Error generating and caching image:', error);
    return null;
  }
}

/**
 * Get all images for a category and style
 */
export async function getCategoryImages(
  category: string,
  style: 'realistic' | 'anime'
): Promise<Map<string, AttributeImage>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attribute_images')
    .select('*')
    .eq('category', category)
    .eq('style', style);

  if (error) {
    console.error('Error fetching category images:', error);
    return new Map();
  }

  const imageMap = new Map<string, AttributeImage>();
  data?.forEach(img => {
    imageMap.set(img.value, img);
  });

  return imageMap;
}

/**
 * Batch generate images for multiple values
 */
export async function batchGenerateImages(
  category: string,
  values: string[],
  style: 'realistic' | 'anime',
  onProgress?: (current: number, total: number, value: string) => void
): Promise<AttributeImage[]> {
  const results: AttributeImage[] = [];

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    
    if (onProgress) {
      onProgress(i + 1, values.length, value);
    }

    try {
      const image = await getAttributeImage(category, value, style);
      if (image) {
        results.push(image);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to generate image for ${value}:`, error);
    }
  }

  return results;
}

/**
 * Regenerate an existing image
 */
export async function regenerateImage(
  category: string,
  value: string,
  style: 'realistic' | 'anime'
): Promise<AttributeImage | null> {
  const supabase = await createClient();

  try {
    // Delete existing cached image
    await supabase
      .from('attribute_images')
      .delete()
      .eq('category', category)
      .eq('value', value)
      .eq('style', style);

    // Generate new image
    return await generateAndCacheImage(category, value, style);
  } catch (error) {
    console.error('Error regenerating image:', error);
    return null;
  }
}

/**
 * Get style selection images (Realistic vs Anime header images)
 */
export async function getStyleImages(): Promise<{
  realistic?: string;
  anime?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('style_images')
    .select('style, image_url');

  if (error) {
    console.error('Error fetching style images:', error);
    return {};
  }

  const images: any = {};
  data?.forEach(img => {
    images[img.style] = img.image_url;
  });

  return images;
}

/**
 * Update style selection image
 */
export async function updateStyleImage(
  style: 'realistic' | 'anime',
  imageUrl: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('style_images')
    .update({ image_url: imageUrl })
    .eq('style', style);

  if (error) {
    console.error('Error updating style image:', error);
    return false;
  }

  return true;
}

/**
 * Pre-generate all images for the create character flow
 */
export async function preGenerateAllImages(
  style: 'realistic' | 'anime',
  onProgress?: (message: string) => void
): Promise<void> {
  const categories = [
    {
      name: 'age',
      values: ['18-22', '23-27', '28-32', '33-37', '38+']
    },
    {
      name: 'body',
      values: ['Slim', 'Athletic', 'Curvy', 'Average', 'Plus-size']
    },
    {
      name: 'ethnicity',
      values: ['European', 'East Asian', 'South Asian', 'Middle Eastern', 'African', 'Latina', 'Caribbean', 'Mixed']
    }
  ];

  for (const category of categories) {
    if (onProgress) {
      onProgress(`Generating ${category.name} images for ${style} style...`);
    }

    await batchGenerateImages(
      category.name,
      category.values,
      style,
      (current, total, value) => {
        if (onProgress) {
          onProgress(`${category.name}: ${value} (${current}/${total})`);
        }
      }
    );
  }

  if (onProgress) {
    onProgress('All images generated successfully!');
  }
}
