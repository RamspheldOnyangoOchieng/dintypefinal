import { createAdminClient } from './supabase-admin'

const NOVITA_API_KEY = process.env.NOVITA_API_KEY

type Style = 'realistic' | 'anime'

const DEFAULT_NEGATIVE = 'man, male, boy, men, masculine, beard, facial hair, mustache, guy, dude, multiple people, group, animal, creature, nude, naked, nsfw, explicit, sexual, low quality, blurry, distorted, deformed'

function buildPrompt(category: string, value: string, style: Style, gender?: string) {
  // ALWAYS FEMALE - NO EXCEPTIONS
  const femaleBase = 'beautiful woman, single female, solo lady, one woman only';
  
  const styleText = style === 'anime' 
    ? 'anime girl, anime woman, female anime character, vibrant anime, detailed anime art'
    : 'beautiful woman, photorealistic woman, professional portrait, female model';

  // Simple category-specific descriptions
  const categoryDesc = `${value}`;
  
  return `${femaleBase}, ${styleText}, ${categoryDesc}, high quality, portrait, detailed, beautiful`;
}

async function generateWithNovita(prompt: string, negative: string): Promise<string> {
  if (!NOVITA_API_KEY) throw new Error('NOVITA_API_KEY not configured')

  const res = await fetch('https://api.novita.ai/v3/async/txt2img', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOVITA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      extra: { response_image_type: 'jpeg', enable_nsfw_detection: false },
      request: {
        model_name: 'dreamshaper_8_93211.safetensors', // BEST MODEL FOR WOMEN
        prompt,
        negative_prompt: negative,
        width: 512,
        height: 768,
        image_num: 1,
        sampler_name: 'DPM++ 2M Karras',
        guidance_scale: 7.5,
        steps: 30,
        seed: -1,
      }
    })
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Novita error: ${txt}`)
  }

  const data = await res.json()
  const taskId = data.task_id

  // Poll for completion
  let attempts = 0
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 2000))
    const progress = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${NOVITA_API_KEY}` }
    })
    if (!progress.ok) {
      attempts++
      continue
    }
    const pd = await progress.json()
    if (pd.task?.status === 'TASK_STATUS_SUCCEED') {
      return pd.images[0].image_url
    }
    if (pd.task?.status === 'TASK_STATUS_FAILED') {
      throw new Error('Image generation failed')
    }
    attempts++
  }

  throw new Error('Image generation timeout')
}

async function uploadToSupabaseBuffer(buffer: ArrayBuffer, fileName: string) {
  const supabase = await createAdminClient()
  if (!supabase) throw new Error('Failed to create Supabase admin client')

  const { data, error } = await supabase.storage.from('attributes').upload(fileName, Buffer.from(buffer), {
    contentType: 'image/jpeg',
    cacheControl: '86400',
    upsert: true,
  })

  if (error) throw error

  const { data: urlData } = supabase.storage.from('attributes').getPublicUrl(data.path)
  return urlData.publicUrl
}

// Exported functions used by the attribute-images route
export async function getAttributeImage(category: string, value: string, style: Style, gender?: string) {
  const supabase = await createAdminClient()

  // Try to find existing image in DB
  const { data: rows, error } = await supabase
    .from('attribute_images')
    .select('*')
    .eq('category', category)
    .eq('value', value)
    .eq('style', style)
    .limit(1)
    .single()

  if (error) {
    // If not found or DB error, fall through to generation
    console.warn('Supabase lookup error for attribute image:', error.message || error)
  }

  if (rows && rows.image_url) {
    return rows
  }

  // Generate new image using Novita and upload
  try {
    const prompt = buildPrompt(category, value, style, gender)
    const negative = DEFAULT_NEGATIVE
    const imageUrl = await generateWithNovita(prompt, negative)

    // download
    const resp = await fetch(imageUrl)
    const buffer = await resp.arrayBuffer()

    const fileName = `attribute-images/${category}-${value.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${style}-${Date.now()}.jpg`
    const publicUrl = await uploadToSupabaseBuffer(buffer, fileName)

    // Insert into DB
    const { data: inserted } = await supabase.from('attribute_images').insert({
      category,
      value,
      style,
      image_url: publicUrl,
      prompt,
      width: 512,
      height: 768,
    }).select().single()

    return inserted || { image_url: publicUrl, prompt }
  } catch (err: any) {
    console.error('Failed to generate attribute image:', err?.message || err)
    return null
  }
}

export async function regenerateImage(category: string, value: string, style: Style, gender?: string) {
  // Force regeneration by generating a new image and updating DB
  const supabase = await createAdminClient()
  try {
    const prompt = buildPrompt(category, value, style, gender)
    const negative = DEFAULT_NEGATIVE
    const imageUrl = await generateWithNovita(prompt, negative)
    const resp = await fetch(imageUrl)
    const buffer = await resp.arrayBuffer()
    const fileName = `attribute-images/${category}-${value.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${style}-${Date.now()}.jpg`
    const publicUrl = await uploadToSupabaseBuffer(buffer, fileName)

    // Update DB (insert new row)
    const { data: inserted } = await supabase.from('attribute_images').insert({
      category,
      value,
      style,
      image_url: publicUrl,
      prompt,
      width: 512,
      height: 768,
    }).select().single()

    return inserted || { image_url: publicUrl, prompt }
  } catch (err: any) {
    console.error('Regenerate failed:', err?.message || err)
    return null
  }
}

export async function getCategoryImages(category: string, style: Style) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('attribute_images').select('*').eq('category', category).eq('style', style)
  if (error) {
    console.error('Error fetching category images:', error.message || error)
    return new Map()
  }
  const map = new Map()
  (data || []).forEach((row: any) => map.set(row.value, row))
  return map
}

export async function batchGenerateImages(category: string, values: string[], style: Style, gender?: string) {
  const results: any[] = []
  for (const value of values) {
    // Try to get existing first
    const img = await getAttributeImage(category, value, style, gender)
    if (img) results.push(img)
  }
  return results
}
