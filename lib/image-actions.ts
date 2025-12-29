"use server"

import { createAdminClient } from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase-server"
import { getAnonymousUserId } from "@/lib/anonymous-user"

// Export the functions that are being imported elsewhere
export async function getAllImages(options?: {
  limit?: number
  offset?: number
  tags?: string[]
  collection_id?: string
  favorite?: boolean
  search?: string
  userId?: string // New: allow passing userId from client
}) {
  try {
    // Get user ID (authenticated or anonymous)
    const userId = await getUserId(options?.userId)
    console.log(`[getAllImages] Fetching images for user: ${userId}`);

    // Use admin client to bypass RLS
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Failed to create admin client",
        images: [],
      }
    }

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

    if (error) {
      console.error("[Server Action] Error fetching images:", error)
      return {
        success: false,
        error: error.message,
        images: [],
      }
    }

    // Enhance images with is_locked status based on current plan
    const { getUserPlanInfo } = await import("@/lib/subscription-limits")
    const { isUserAdmin: checkIsAdmin } = await import("@/lib/admin-privileges")
    const planInfo = await getUserPlanInfo(userId)
    const isAdmin = await checkIsAdmin(userId)
    const isCurrentlyPremium = planInfo.planType === 'premium'

    const enhancedImages = (data || []).map(img => {
      const wasPremiumWhenCreated = (img.metadata as any)?.plan_type === 'premium'
      // Lock if it was premium content but user is no longer premium (and not admin)
      const isLocked = wasPremiumWhenCreated && !isCurrentlyPremium && !isAdmin
      return {
        ...img,
        is_locked: isLocked
      }
    })

    return {
      success: true,
      images: enhancedImages,
    }
  } catch (error) {
    console.error("[Server Action] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      images: [],
    }
  }
}

export async function getImage(id: string) {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching image:", error)
      return { success: false, error: error.message }
    }

    // Calculate is_locked for single image
    const { getUserPlanInfo } = await import("@/lib/subscription-limits")
    const { isUserAdmin: checkIsAdmin } = await import("@/lib/admin-privileges")
    const planInfo = await getUserPlanInfo(userId)
    const isAdmin = await checkIsAdmin(userId)
    const isCurrentlyPremium = planInfo.planType === 'premium'

    const wasPremiumWhenCreated = (data.metadata as any)?.plan_type === 'premium'
    const isLocked = wasPremiumWhenCreated && !isCurrentlyPremium && !isAdmin

    return {
      success: true,
      image: {
        ...data,
        is_locked: isLocked
      }
    }
  } catch (error) {
    console.error("Error fetching image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch image",
    }
  }
}

export async function updateImageDetails(id: string, formData: FormData) {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    const prompt = formData.get("prompt") as string
    const tagsString = formData.get("tags") as string
    const tags = tagsString ? tagsString.split(",").map((tag) => tag.trim()) : undefined

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .update({
        prompt,
        tags,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating image:", error)
      return { success: false, error: error.message }
    }

    return { success: true, image: data }
  } catch (error) {
    console.error("Error updating image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update image",
    }
  }
}

export async function deleteExistingImage(id: string, userId?: string) {
  try {
    const verifiedUserId = await getUserId(userId)
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    const { error } = await supabaseAdmin.from("generated_images").delete().eq("id", id).eq("user_id", verifiedUserId)

    if (error) {
      console.error("Error deleting image:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete image",
    }
  }
}

export async function toggleImageFavorite(id: string, isFavorite: boolean, userId?: string) {
  try {
    const verifiedUserId = await getUserId(userId)
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .update({ favorite: isFavorite })
      .eq("id", id)
      .eq("user_id", verifiedUserId)
      .select()
      .single()

    if (error) {
      console.error("Error toggling favorite status:", error)
      return { success: false, error: error.message }
    }

    return { success: true, image: data }
  } catch (error) {
    console.error("Error toggling favorite status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update favorite status",
    }
  }
}

export async function addTagsToExistingImage(id: string, tags: string[]) {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    // Get current image
    const { data: image, error: getError } = await supabaseAdmin
      .from("generated_images")
      .select("tags")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (getError) {
      console.error("Error getting image:", getError)
      return { success: false, error: getError.message }
    }

    const existingTags = image.tags || []
    const uniqueTags = [...new Set([...existingTags, ...tags])]

    // Update with new tags
    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .update({ tags: uniqueTags })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error adding tags:", error)
      return { success: false, error: error.message }
    }

    return { success: true, image: data }
  } catch (error) {
    console.error("Error adding tags:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add tags",
    }
  }
}

export async function removeTagFromExistingImage(id: string, tag: string) {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    // Get current image
    const { data: image, error: getError } = await supabaseAdmin
      .from("generated_images")
      .select("tags")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (getError) {
      console.error("Error getting image:", getError)
      return { success: false, error: getError.message }
    }

    const existingTags = image.tags || []
    const updatedTags = existingTags.filter((t) => t !== tag)

    // Update with new tags
    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .update({ tags: updatedTags })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error removing tag:", error)
      return { success: false, error: error.message }
    }

    return { success: true, image: data }
  } catch (error) {
    console.error("Error removing tag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove tag",
    }
  }
}

export async function addImageToExistingCollection(imageId: string, collectionId: string) {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .update({ collection_id: collectionId })
      .eq("id", imageId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error adding image to collection:", error)
      return { success: false, error: error.message }
    }

    return { success: true, image: data }
  } catch (error) {
    console.error("Error adding image to collection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add image to collection",
    }
  }
}

export async function removeImageFromExistingCollection(imageId: string) {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return { success: false, error: "Failed to create admin client" }
    }

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .update({ collection_id: null })
      .eq("id", imageId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error removing image from collection:", error)
      return { success: false, error: error.message }
    }

    return { success: true, image: data }
  } catch (error) {
    console.error("Error removing image from collection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove image from collection",
    }
  }
}

// Helper function to get user ID
async function getUserId(passedUserId?: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.id) {
      return user.id
    }

    // If a userId was passed from the client, use it (especially important for anonymous localStorage IDs)
    if (passedUserId) {
      return passedUserId
    }

    // Fallback to absolute anonymous ID
    return getAnonymousUserId()
  } catch (error) {
    console.error("Error getting user ID:", error)
    return passedUserId || getAnonymousUserId()
  }
}
