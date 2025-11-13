import { createAdminClient } from './supabase-admin'

interface ContentBlock {
  block_key: string
  content_sv: string
  content_en: string
  content_type: string
}

/**
 * Get content block by key
 * @param blockKey - The unique identifier for the content block
 * @param language - 'sv' or 'en'
 * @returns The content string in the requested language
 */
export async function getContentBlock(blockKey: string, language: 'sv' | 'en' = 'sv'): Promise<string> {
  try {
    const supabase = await createAdminClient()

    const { data } = await supabase
      .from('content_blocks')
      .select('content_sv, content_en')
      .eq('block_key', blockKey)
      .eq('is_active', true)
      .single()

    if (!data) {
      console.warn(`Content block not found: ${blockKey}`)
      return blockKey // Return key as fallback
    }

    return language === 'sv' ? data.content_sv : data.content_en
  } catch (error) {
    console.error(`Error fetching content block ${blockKey}:`, error)
    return blockKey
  }
}

/**
 * Get multiple content blocks at once
 * @param blockKeys - Array of block keys to fetch
 * @param language - 'sv' or 'en'
 * @returns Object with block_key as keys and content as values
 */
export async function getContentBlocks(
  blockKeys: string[],
  language: 'sv' | 'en' = 'sv'
): Promise<Record<string, string>> {
  try {
    const supabase = await createAdminClient()

    const { data } = await supabase
      .from('content_blocks')
      .select('block_key, content_sv, content_en')
      .in('block_key', blockKeys)
      .eq('is_active', true)

    if (!data) return {}

    const result: Record<string, string> = {}
    data.forEach((block) => {
      result[block.block_key] = language === 'sv' ? block.content_sv : block.content_en
    })

    return result
  } catch (error) {
    console.error('Error fetching content blocks:', error)
    return {}
  }
}

/**
 * Get all content blocks for a specific page
 * @param page - The page identifier (e.g., 'homepage', 'premium')
 * @param language - 'sv' or 'en'
 * @returns Object with block_key as keys and content as values
 */
export async function getPageContent(page: string, language: 'sv' | 'en' = 'sv'): Promise<Record<string, string>> {
  try {
    const supabase = await createAdminClient()

    const { data } = await supabase
      .from('content_blocks')
      .select('block_key, content_sv, content_en')
      .eq('page', page)
      .eq('is_active', true)

    if (!data) return {}

    const result: Record<string, string> = {}
    data.forEach((block) => {
      result[block.block_key] = language === 'sv' ? block.content_sv : block.content_en
    })

    return result
  } catch (error) {
    console.error(`Error fetching page content for ${page}:`, error)
    return {}
  }
}
