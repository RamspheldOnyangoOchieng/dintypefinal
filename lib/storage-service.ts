import { getAdminClient } from "./supabase-admin"
import { createClient as createBrowserClient } from "@/lib/supabase-browser"
import { createClient as createServerClient } from "@/lib/supabase-server"
import { getAnonymousId } from "./anonymous-id"

export type CharacterProfile = {
  id?: string
  name: string
  description: string
  image?: string
  image_url?: string
  images?: string[]
  video_url?: string
  prompt_template?: string
  created_at?: string
  user_id: string
  is_public?: boolean
  tags?: string[]
}

export type SavedPrompt = {
  id?: string
  prompt: string
  character_id?: string
  user_id: string
  created_at?: string
  is_favorite?: boolean
}

export type Tag = {
  id?: string
  name: string
  user_id: string
}

export class StorageService {
  // Get user ID (either authenticated or anonymous)
  static async getUserId() {
    const isServer = typeof window === 'undefined'
    const supabase = isServer ? await createServerClient() : createBrowserClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.user?.id || (isServer ? '' : getAnonymousId())
  }

  static async getCharacters() {
    try {
      const supabaseAdmin = await getAdminClient()
      if (!supabaseAdmin) {
        console.error("Failed to create admin client")
        return []
      }

      const { data, error } = await supabaseAdmin
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching characters:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getCharacters:", error)
      return []
    }
  }

  static async getCharacterById(id: string) {
    try {
      const supabaseAdmin = await getAdminClient()
      if (!supabaseAdmin) {
        console.error("Failed to create admin client")
        return null
      }

      const { data, error } = await supabaseAdmin.from("characters").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching character:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getCharacterById:", error)
      return null
    }
  }

  // Character Profiles CRUD
  static async createCharacter(character: CharacterProfile) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { data, error } = await supabaseAdmin
      .from("character_profiles")
      .insert({
        ...character,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create character: ${error.message}`)
    return data
  }

  static async getCharactersOld(includePublic = true) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    let query = supabaseAdmin.from("character_profiles").select("*")

    if (includePublic) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    } else {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to get characters: ${error.message}`)
    return data || []
  }

  static async getCharacter(id: string) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    // Try to get from characters table first (new system)
    const { data: character, error: charError } = await supabaseAdmin
      .from("characters")
      .select("*")
      .eq("id", id)
      .single()

    if (!charError && character) {
      return {
        ...character,
        prompt_template: character.prompt_template || character.system_prompt || '',
        image_url: character.image_url || character.image || '',
        images: character.images || [],
        video_url: character.video_url || '',
        user_id: character.user_id || character.userId || ''
      }
    }

    // Fallback to character_profiles table (old system)
    const { data, error } = await supabaseAdmin
      .from("character_profiles")
      .select("*")
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .eq("id", id)
      .single()

    if (error) throw new Error(`Failed to get character: ${error.message}`)
    return {
      ...data,
      prompt_template: data.prompt_template || data.system_prompt || '',
      image_url: data.image_url || data.image || '',
      images: data.images || [],
      video_url: data.video_url || '',
      user_id: data.user_id || data.userId || ''
    }
  }

  static async updateCharacter(id: string, updates: Partial<CharacterProfile>) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    // First check if user owns this character
    const { data: character } = await supabaseAdmin.from("character_profiles").select("user_id").eq("id", id).single()

    if (character?.user_id !== userId) {
      throw new Error("You do not have permission to update this character")
    }

    const { data, error } = await supabaseAdmin
      .from("character_profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update character: ${error.message}`)
    return data
  }

  static async deleteCharacter(id: string) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    // First check if user owns this character
    const { data: character } = await supabaseAdmin.from("character_profiles").select("user_id").eq("id", id).single()

    if (character?.user_id !== userId) {
      throw new Error("You do not have permission to delete this character")
    }

    const { error } = await supabaseAdmin.from("character_profiles").delete().eq("id", id)

    if (error) throw new Error(`Failed to delete character: ${error.message}`)
    return true
  }

  // Saved Prompts CRUD
  static async savePrompt(prompt: SavedPrompt) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { data, error } = await supabaseAdmin
      .from("saved_prompts")
      .insert({
        ...prompt,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save prompt: ${error.message}`)
    return data
  }

  static async getPrompts(characterId?: string) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    let query = supabaseAdmin.from("saved_prompts").select("*").eq("user_id", userId)

    if (characterId) {
      query = query.eq("character_id", characterId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to get prompts: ${error.message}`)
    return data || []
  }

  static async updatePrompt(id: string, updates: Partial<SavedPrompt>) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { data, error } = await supabaseAdmin
      .from("saved_prompts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update prompt: ${error.message}`)
    return data
  }

  static async deletePrompt(id: string) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { error } = await supabaseAdmin.from("saved_prompts").delete().eq("id", id).eq("user_id", userId)

    if (error) throw new Error(`Failed to delete prompt: ${error.message}`)
    return true
  }

  // Tags CRUD
  static async createTag(name: string) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { data, error } = await supabaseAdmin
      .from("tags")
      .insert({
        name,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create tag: ${error.message}`)
    return data
  }

  static async getTags() {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { data, error } = await supabaseAdmin.from("tags").select("*").eq("user_id", userId)

    if (error) throw new Error(`Failed to get tags: ${error.message}`)
    return data || []
  }

  static async deleteTag(id: string) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { error } = await supabaseAdmin.from("tags").delete().eq("id", id).eq("user_id", userId)

    if (error) throw new Error(`Failed to delete tag: ${error.message}`)
    return true
  }

  // Character-Tag Relationships
  static async addTagToCharacter(characterId: string, tagId: string) {
    const supabaseAdmin = await getAdminClient()

    const { error } = await supabaseAdmin.from("character_tags").insert({
      character_id: characterId,
      tag_id: tagId,
    })

    if (error) throw new Error(`Failed to add tag to character: ${error.message}`)
    return true
  }

  static async removeTagFromCharacter(characterId: string, tagId: string) {
    const supabaseAdmin = await getAdminClient()

    const { error } = await supabaseAdmin
      .from("character_tags")
      .delete()
      .eq("character_id", characterId)
      .eq("tag_id", tagId)

    if (error) throw new Error(`Failed to remove tag from character: ${error.message}`)
    return true
  }

  // Favorites
  static async toggleFavorite(promptId: string) {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    // Get current favorite status
    const { data: prompt } = await supabaseAdmin
      .from("saved_prompts")
      .select("is_favorite")
      .eq("id", promptId)
      .eq("user_id", userId)
      .single()

    if (!prompt) throw new Error("Prompt not found")

    const { data, error } = await supabaseAdmin
      .from("saved_prompts")
      .update({ is_favorite: !prompt.is_favorite })
      .eq("id", promptId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw new Error(`Failed to toggle favorite: ${error.message}`)
    return data
  }

  static async getFavorites() {
    const supabaseAdmin = await getAdminClient()
    const userId = await this.getUserId()

    const { data, error } = await supabaseAdmin
      .from("saved_prompts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to get favorites: ${error.message}`)
    return data || []
  }
}
