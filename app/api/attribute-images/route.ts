/**
 * API Route for generating and retrieving attribute images
 * POST /api/attribute-images - Generate/retrieve image
 * GET /api/attribute-images?category=age&value=18-22&style=realistic - Get specific image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAttributeImage, regenerateImage, getCategoryImages, batchGenerateImages } from '@/lib/attribute-images-service';

// Disable cache during regeneration - images are being updated
export const revalidate = 0; // No cache during regeneration

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const value = searchParams.get('value');
  const style = (searchParams.get('style') as 'realistic' | 'anime') || 'realistic';
  const gender = searchParams.get('gender') || undefined;

  try {
    // If no specific value, return all images for the category
    if (category && !value) {
      const images = await getCategoryImages(category, style);
      
      const response = NextResponse.json({
        success: true,
        images: Array.from(images.values())
      });
      
      // No cache during regeneration
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    // Get specific image
    if (category && value) {
      const image = await getAttributeImage(category, value, style, gender);
      
      if (!image) {
        return NextResponse.json({
          success: false,
          error: 'Image not found or could not be generated'
        }, { status: 404 });
      }

      // Return the image data with image_url at top level for easier frontend access
      const response = NextResponse.json({
        success: true,
        image_url: image.image_url,
        category: image.category,
        value: image.value,
        style: image.style,
        seed: image.seed,
        prompt: image.prompt,
        width: image.width,
        height: image.height,
        created_at: image.created_at,
        updated_at: image.updated_at
      });
      
      // No cache during regeneration
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    return NextResponse.json({
      success: false,
      error: 'Missing required parameters'
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error in attribute-images API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  const { action, category, value, values, style = 'realistic', gender } = body;

    // Regenerate a single image
    if (action === 'regenerate' && category && value) {
      const image = await regenerateImage(category, value, style, gender);
      
      if (!image) {
        return NextResponse.json({
          success: false,
          error: 'Failed to regenerate image'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        image
      });
    }

    // Batch generate images
    if (action === 'batch' && category && values && Array.isArray(values)) {
      const images = await batchGenerateImages(category, values, style, gender);
      
      return NextResponse.json({
        success: true,
        images,
        generated: images.length,
        total: values.length
      });
    }

    // Generate/get single image
    if (category && value) {
      const image = await getAttributeImage(category, value, style, gender);
      
      if (!image) {
        return NextResponse.json({
          success: false,
          error: 'Failed to generate image'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        image
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request parameters'
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error in attribute-images API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
