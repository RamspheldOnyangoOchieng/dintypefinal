"use server"

import { updateCollection, deleteCollection } from "@/lib/storage-utils"
import { createAdminClient } from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase-server"
import { getAnonymousUserId } from "@/lib/anonymous-user"
import { revalidatePath } from "next/cache"

/**
 * Helper to get the current user ID (auth or anonymous fallback)
 */
// Helper to get the current user ID (auth or anonymous fallback)
async function getUserId(passedUserId?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.id) {
      return user.id
    }

    // Use passed ID if available
    if (passedUserId) return passedUserId

    // Fallback to anonymous ID for server-side
    return getAnonymousUserId()
  } catch (error) {
    console.error("Error getting user ID in server action:", error)
    return passedUserId || getAnonymousUserId()
  }
}

export async function createCollection(name: string, description = "") {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) throw new Error("Could not initialize admin client")

    const { data, error } = await supabaseAdmin
      .from("collections")
      .insert({
        name,
        description,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating collection:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/collections")
    return { success: true, data }
  } catch (error) {
    console.error("Error in createCollection:", error)
    return { success: false, error: "Failed to create collection" }
  }
}

export async function createNewCollection(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name) return { success: false, error: "Collection name is required" }

  return createCollection(name, description)
}

export async function getAllCollections(userId?: string) {
  try {
    const verifiedUserId = await getUserId(userId)
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) throw new Error("Could not initialize admin client")

    // Get collections with image count
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select(`
        *,
        image_count:generated_images(count)
      `)
      .eq("user_id", verifiedUserId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Server Action] Error fetching collections:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Format the response
    const collections = (data || []).map((collection) => ({
      ...collection,
      image_count: collection.image_count?.[0]?.count || 0,
    }))

    return {
      success: true,
      collections,
    }
  } catch (error) {
    console.error("[Server Action] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getCollection(id: string) {
  try {
    const userId = await getUserId()
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) throw new Error("Could not initialize admin client")

    // Get the collection
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (collectionError) {
      console.error("[Server Action] Error fetching collection:", collectionError)
      return {
        success: false,
        error: collectionError.message,
      }
    }

    // Get images in this collection
    const { data: images, error: imagesError } = await supabaseAdmin
      .from("generated_images")
      .select("*")
      .eq("collection_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (imagesError) {
      console.error("[Server Action] Error fetching collection images:", imagesError)
      return {
        success: false,
        error: imagesError.message,
      }
    }

    return {
      success: true,
      collection,
      images: images || [],
    }
  } catch (error) {
    console.error("[Server Action] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function updateExistingCollection(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!name) {
      throw new Error("Collection name is required")
    }

    const collection = await updateCollection(id, {
      name,
      description,
    })

    revalidatePath("/collections")
    return { success: true, collection }
  } catch (error) {
    console.error("Error updating collection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update collection",
    }
  }
}

export async function deleteExistingCollection(id: string) {
  try {
    await deleteCollection(id)
    revalidatePath("/collections")
    return { success: true }
  } catch (error) {
    console.error("Error deleting collection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete collection",
    }
  }
}
