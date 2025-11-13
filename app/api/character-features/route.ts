import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API endpoints for character features management
 */

export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const category = url.searchParams.get('category');

  try {
    // Get all categories with image counts
    if (action === 'categories') {
      const { data, error } = await supabase
        .from('attribute_images')
        .select('category');

      if (error) throw error;

      // Group by category and count
      const categories: Record<string, any> = {};
      data?.forEach((row: any) => {
        if (!categories[row.category]) {
          categories[row.category] = { name: row.category, images: 0 };
        }
        categories[row.category].images++;
      });

      return NextResponse.json({
        success: true,
        categories: Object.values(categories).sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    // Get all values for a category with their images
    if (action === 'values' && category) {
      const { data, error } = await supabase
        .from('attribute_images')
        .select('value, style, image_url, id, created_at')
        .eq('category', category)
        .order('value');

      if (error) throw error;

      // Group by value and style
      const values: Record<string, any> = {};
      data?.forEach((row: any) => {
        if (!values[row.value]) {
          values[row.value] = {
            value: row.value,
            realistic: null,
            anime: null,
          };
        }
        values[row.value][row.style] = {
          id: row.id,
          image_url: row.image_url,
          created_at: row.created_at,
        };
      });

      return NextResponse.json({
        success: true,
        category,
        values: Object.values(values),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in character features API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  try {
    const { imageId, category, value, style } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Missing imageId' },
        { status: 400 }
      );
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('attribute_images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;

    // Try to delete from storage
    if (category && value && style) {
      const fileName = `${category}-${value.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${style}`;
      
      // List files to find the exact one to delete
      const { data: files } = await supabase
        .storage
        .from('attributes')
        .list('attribute-images', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      const fileToDelete = files?.find((f: any) =>
        f.name.startsWith(fileName)
      );

      if (fileToDelete) {
        await supabase
          .storage
          .from('attributes')
          .remove([`attribute-images/${fileToDelete.name}`]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { action, category, value, style, imageUrl, prompt } = await request.json();

    if (action === 'add' && category && value && style && imageUrl) {
      // Add new image to database
      const { data, error } = await supabase
        .from('attribute_images')
        .insert({
          category,
          value,
          style,
          image_url: imageUrl,
          prompt: prompt || `${category}: ${value} (${style})`,
          width: 512,
          height: 768,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, image: data });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in character features API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
