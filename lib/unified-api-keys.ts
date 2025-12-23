/**
 * Unified API Key Retriever with Database + .env Fallback
 * 
 * This utility ensures API keys are always available by:
 * 1. Checking database (admin-configured keys)
 * 2. Falling back to .env variables
 * 3. Providing helpful error messages when keys are missing
 * 
 * Usage:
 * const apiKey = await getUnifiedNovitaKey()
 * if (!apiKey) {
 *   return error response
 * }
 */

import { getNovitaApiKey } from './api-keys'

/**
 * Get Novita API Key with comprehensive fallback
 * Priority: DB → NOVITA_API → NEXT_PUBLIC_NOVITA_API_KEY → Error
 */
export async function getUnifiedNovitaKey(): Promise<{
  key: string | null
  source: 'database' | 'env' | 'missing'
  error?: string
}> {
  try {
    // Try getNovitaApiKey which already has fallback logic
    const key = await getNovitaApiKey()
    
    if (key && key.trim() !== '') {
      // Determine source
      const { getApiKey } = await import('./db-init')
      const dbKey = await getApiKey('novita_api_key')
      const source = dbKey ? 'database' : 'env'
      
      console.log(`✅ Novita API Key loaded from ${source}`)
      return { key, source }
    }
    
    // No key found anywhere
    console.error('❌ No Novita API Key found in database or environment variables')
    return {
      key: null,
      source: 'missing',
      error: 'API key not configured. Please add NOVITA_API_KEY to .env or configure in Admin Dashboard → API Keys.'
    }
  } catch (error) {
    console.error('Error fetching Novita API key:', error)
    // Last resort: try env directly
    const envKey = process.env.NOVITA_API || process.env.NEXT_PUBLIC_NOVITA_API_KEY
    if (envKey) {
      return { key: envKey, source: 'env' }
    }
    return {
      key: null,
      source: 'missing',
      error: 'Failed to retrieve API key'
    }
  }
}

/**
 * Get OpenAI API Key with fallback
 */
export async function getUnifiedOpenAIKey(): Promise<{
  key: string | null
  source: 'database' | 'env' | 'missing'
  error?: string
}> {
  try {
    const { getApiKey } = await import('./db-init')
    const dbKey = await getApiKey('openai_api_key')
    
    if (dbKey && dbKey.trim() !== '') {
      console.log('✅ OpenAI API Key loaded from database')
      return { key: dbKey, source: 'database' }
    }
    
    const envKey = process.env.OPENAI_API_KEY
    if (envKey && envKey.trim() !== '') {
      console.log('✅ OpenAI API Key loaded from environment')
      return { key: envKey, source: 'env' }
    }
    
    console.warn('⚠️ No OpenAI API Key found')
    return {
      key: null,
      source: 'missing',
      error: 'OpenAI API key not configured'
    }
  } catch (error) {
    const envKey = process.env.OPENAI_API_KEY
    return envKey ? { key: envKey, source: 'env' } : {
      key: null,
      source: 'missing',
      error: 'Failed to retrieve OpenAI API key'
    }
  }
}

/**
 * Validate and log API key status
 */
export function logApiKeyStatus(keyName: string, source: 'database' | 'env' | 'missing') {
  const emoji = source === 'database' ? '🗄️' : source === 'env' ? '📁' : '❌'
  const message = source === 'missing' 
    ? `${emoji} ${keyName}: NOT FOUND` 
    : `${emoji} ${keyName}: loaded from ${source.toUpperCase()}`
  
  console.log(message)
}
