import { createClient } from "@/lib/supabase/client"
import { getAdminClient } from "@/lib/supabase-admin"
import { v4 as uuidv4 } from "uuid"
import { getAnonymousUserId } from "@/lib/anonymous-user"

/**
 * Downloads an image from an external URL and uploads it to Supabase Storage
 * @param imageUrl - The external URL of the image to download
 * @param fileName - Optional custom filename (will generate UUID if not provided)
 * @param bucketName - The Supabase storage bucket name (default: 'images')
 * @returns The public URL of the uploaded image in Supabase Storage
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  fileName?: string,
  bucketName: string = 'images'
): Promise<string> {
  try {
    console.log('📥 Downloading image from:', imageUrl);
    
    // Download the image from the external URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Generate a unique filename if not provided
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const uniqueFileName = fileName || `${uuidv4()}.${fileExtension}`;
    const filePath = `characters/${uniqueFileName}`;

    console.log('📤 Uploading to Supabase Storage:', filePath);

    // Get Supabase admin client
    const supabase = await getAdminClient();
    if (!supabase) {
      throw new Error('Failed to create admin client');
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ Image uploaded successfully:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image to Supabase:', error);
    throw error;
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param imageUrl - The public URL or path of the image to delete
 * @param bucketName - The Supabase storage bucket name (default: 'images')
 */
export async function deleteImageFromSupabase(
  imageUrl: string,
  bucketName: string = 'images'
): Promise<void> {
  try {
    // Extract the file path from the public URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(bucketName);
    
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL: bucket not found');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    console.log('🗑️ Deleting image from Supabase:', filePath);

    const supabase = await getAdminClient();
    if (!supabase) {
      throw new Error('Failed to create admin client');
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }

    console.log('✅ Image deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting image from Supabase:', error);
    throw error;
  }
}

// Types for our storage items
export interface StoredImage {
  id: string
  user_id: string
  prompt: string
  image_url: string
  model_used: string
  created_at: string
  tags?: string[]
  favorite?: boolean
  collection_id?: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  image_count?: number
}

// Get user ID (authenticated or anonymous)
export const getUserId = async () => {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user?.id) {
      console.log("User is authenticated with ID:", session.user.id)
      return session.user.id
    }

    // Use the anonymous ID from localStorage
    const anonymousId = getAnonymousUserId()
    console.log("Using anonymous ID from localStorage:", anonymousId)
    return anonymousId
  } catch (error) {
    console.error("Error getting user ID:", error)
    // Fallback to localStorage anonymous ID
    return getAnonymousUserId()
  }
}

// Image CRUD operations
export const createImage = async (imageData: {
  prompt: string
  image_url: string
  model_used?: string
  tags?: string[]
  collection_id?: string
}) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .insert({
        user_id: userId,
        prompt: imageData.prompt,
        image_url: imageData.image_url,
        model_used: imageData.model_used || "novita",
        tags: imageData.tags,
        collection_id: imageData.collection_id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating image:", error)
    throw error
  }
}

export const getImages = async (options?: {
  limit?: number
  offset?: number
  tags?: string[]
  collection_id?: string
  favorite?: boolean
  search?: string
}) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    let query = supabaseAdmin.from("generated_images").select("*").eq("user_id", userId)

    // Apply filters
    if (options?.collection_id) {
      query = query.eq("collection_id", options.collection_id)
    }

    if (options?.favorite) {
      query = query.eq("favorite", true)
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains("tags", options.tags)
    }

    if (options?.search) {
      query = query.ilike("prompt", `%${options.search}%`)
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    // Order by creation date
    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching images:", error)
    throw error
  }
}

export const getImageById = async (id: string) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching image:", error)
    throw error
  }
}

export const updateImage = async (
  id: string,
  updates: {
    prompt?: string
    tags?: string[]
    favorite?: boolean
    collection_id?: string | null
  },
) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating image:", error)
    throw error
  }
}

export const deleteImage = async (id: string) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    const { error } = await supabaseAdmin.from("generated_images").delete().eq("id", id).eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}

// Collection CRUD operations
export const createCollection = async (collectionData: {
  name: string
  description?: string
}) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    const { data, error } = await supabaseAdmin
      .from("collections")
      .insert({
        id: uuidv4(),
        user_id: userId,
        name: collectionData.name,
        description: collectionData.description,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating collection:", error)
    throw error
  }
}

export const getCollections = async () => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    // Get collections with image count
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select(`
        *,
        image_count:generated_images(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the response
    return (data || []).map((collection) => ({
      ...collection,
      image_count: collection.image_count?.[0]?.count || 0,
    }))
  } catch (error) {
    console.error("Error fetching collections:", error)
    throw error
  }
}

export const getCollectionById = async (id: string) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching collection:", error)
    throw error
  }
}

export const updateCollection = async (
  id: string,
  updates: {
    name?: string
    description?: string
  },
) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    const { data, error } = await supabaseAdmin
      .from("collections")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating collection:", error)
    throw error
  }
}

export const deleteCollection = async (id: string) => {
  try {
    const supabaseAdmin = await getAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to create admin client")
    }

    const userId = await getUserId()

    // First, remove collection_id from all images in this collection
    await supabaseAdmin
      .from("generated_images")
      .update({ collection_id: null })
      .eq("collection_id", id)
      .eq("user_id", userId)

    // Then delete the collection
    const { error } = await supabaseAdmin.from("collections").delete().eq("id", id).eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting collection:", error)
    throw error
  }
}

// Add image to collection
export const addImageToCollection = async (imageId: string, collectionId: string) => {
  return updateImage(imageId, { collection_id: collectionId })
}

// Remove image from collection
export const removeImageFromCollection = async (imageId: string) => {
  return updateImage(imageId, { collection_id: null })
}

// Toggle favorite status
export const toggleFavorite = async (imageId: string, isFavorite: boolean) => {
  return updateImage(imageId, { favorite: isFavorite })
}

// Add tags to image
export const addTagsToImage = async (imageId: string, tags: string[]) => {
  try {
    const image = await getImageById(imageId)
    const existingTags = image.tags || []
    const uniqueTags = [...new Set([...existingTags, ...tags])]
    return updateImage(imageId, { tags: uniqueTags })
  } catch (error) {
    console.error("Error adding tags to image:", error)
    throw error
  }
}

// Remove tag from image
export const removeTagFromImage = async (imageId: string, tag: string) => {
  try {
    const image = await getImageById(imageId)
    const existingTags = image.tags || []
    const updatedTags = existingTags.filter((t) => t !== tag)
    return updateImage(imageId, { tags: updatedTags })
  } catch (error) {
    console.error("Error removing tag from image:", error)
    throw error
  }
}
