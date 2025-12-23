// Last updated: 2025-12-14T20:15:00+03:00 - Force deployment refresh
/**
 * Novita Image Storage - Downloads images from Novita and uploads to Cloudinary
 * for permanent storage
 */

import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryStorageResult {
  success: boolean
  cloudinaryUrl?: string
  publicId?: string
  error?: string
  originalUrl: string
}

/**
 * Downloads an image from Novita and uploads it to Cloudinary for permanent storage
 * @param novitaImageUrl - The temporary URL from Novita
 * @param folder - Cloudinary folder path (default: 'novita-generations')
 * @param metadata - Optional metadata to attach to the image
 * @returns CloudinaryStorageResult with the permanent Cloudinary URL
 */
export async function storeNovitaImageToCloudinary(
  novitaImageUrl: string,
  folder: string = 'novita-generations',
  metadata?: {
    prompt?: string
    userId?: string
    taskId?: string
    model?: string
  }
): Promise<CloudinaryStorageResult> {
  try {
    console.log(`📥 Downloading image from Novita: ${novitaImageUrl.substring(0, 100)}...`)

    // Download the image from Novita
    const imageResponse = await fetch(novitaImageUrl)
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from Novita: ${imageResponse.status} ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`

    console.log(`📤 Uploading to Cloudinary (folder: ${folder})...`)

    // Build context metadata for Cloudinary
    const context: Record<string, string> = {}
    if (metadata?.prompt) {
      // Sanitize prompt for Cloudinary context (max 255 chars)
      context.prompt = metadata.prompt.substring(0, 255)
    }
    if (metadata?.userId) {
      context.user_id = metadata.userId
    }
    if (metadata?.taskId) {
      context.task_id = metadata.taskId
    }
    if (metadata?.model) {
      context.model = metadata.model
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      context: context,
      tags: ['novita', 'ai-generated'],
      // Quality optimization
      quality: 'auto:good',
      fetch_format: 'auto',
    })

    console.log(`✅ Successfully stored to Cloudinary: ${uploadResult.secure_url}`)

    return {
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalUrl: novitaImageUrl,
    }
  } catch (error) {
    console.error('❌ Error storing Novita image to Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      originalUrl: novitaImageUrl,
    }
  }
}

/**
 * Batch upload multiple Novita images to Cloudinary
 * @param novitaImageUrls - Array of temporary Novita URLs
 * @param folder - Cloudinary folder path
 * @param metadata - Optional metadata
 * @returns Array of CloudinaryStorageResult
 */
export async function storeMultipleNovitaImages(
  novitaImageUrls: string[],
  folder: string = 'novita-generations',
  metadata?: {
    prompt?: string
    userId?: string
    taskId?: string
    model?: string
  }
): Promise<CloudinaryStorageResult[]> {
  console.log(`📦 Batch uploading ${novitaImageUrls.length} images to Cloudinary...`)

  const uploadPromises = novitaImageUrls.map((url, index) => 
    storeNovitaImageToCloudinary(url, folder, {
      ...metadata,
      // Add image index to metadata
      prompt: metadata?.prompt ? `${metadata.prompt} [${index + 1}/${novitaImageUrls.length}]` : undefined,
    })
  )

  const results = await Promise.allSettled(uploadPromises)

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Upload failed',
        originalUrl: novitaImageUrls[index],
      }
    }
  })
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The Cloudinary public ID
 * @returns Success status
 */
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId)
    console.log(`🗑️  Deleted image from Cloudinary: ${publicId}`)
    return true
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error)
    return false
  }
}
