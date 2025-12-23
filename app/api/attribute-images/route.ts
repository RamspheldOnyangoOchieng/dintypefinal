/**
 * API Route for generating and retrieving attribute images
 * POST /api/attribute-images - Generate/retrieve image
 * GET /api/attribute-images?category=age&value=18-22&style=realistic - Get specific image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAttributeImage, regenerateImage, getCategoryImages, batchGenerateImages } from '@/lib/attribute-images-service';

// Cache this route for 24 hours - images don't change often
export const revalidate = 86400; // 24 hours

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const value = searchParams.get('value');
  const style = searchParams.get('style') as 'realistic' | 'anime' || 'realistic';

  try {
    // If no specific value, return all images for the category
    if (category && !value) {
      const images = await getCategoryImages(category, style);
      
      const response = NextResponse.json({
        success: true,
        images: Array.from(images.values())
      });
      
      // Add aggressive caching headers
      response.headers.set('Cache-Control', 'public, max-age=86400, immutable');
      return response;
    }

    // Get specific image
    if (category && value) {
      const image = await getAttributeImage(category, value, style);
      
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
      
      // Add aggressive caching headers for 24 hours
      response.headers.set('Cache-Control', 'public, max-age=86400, immutable');
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
    const { action, category, value, values, style = 'realistic' } = body;

    // Regenerate a single image
    if (action === 'regenerate' && category && value) {
      const image = await regenerateImage(category, value, style);
      
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
      const images = await batchGenerateImages(category, values, style);
      
      return NextResponse.json({
        success: true,
        images,
        generated: images.length,
        total: values.length
      });
    }

    // Generate/get single image
    if (category && value) {
      const image = await getAttributeImage(category, value, style);
      
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
