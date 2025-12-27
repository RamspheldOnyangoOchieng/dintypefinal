import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


// Keep Cloudinary image upload for backward compatibility (deprecated)
export async function uploadImageToCloudinary(imageUrl: string, folder: string = 'chat-images'): Promise<string> {
  try {
    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    })

    return result.secure_url
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}


// Keep Cloudinary video upload for backward compatibility (deprecated)
export async function uploadVideoToCloudinary(videoData: string, folder: string = 'generated-videos'): Promise<string> {
  try {
    // Check if it's already a data URI, if not and it's base64, add the prefix
    const finalData = videoData.startsWith('data:') ? videoData : `data:video/mp4;base64,${videoData}`

    // Upload the video to Cloudinary
    const result = await cloudinary.uploader.upload(finalData, {
      folder: folder,
      resource_type: 'video',
    })

    return result.secure_url
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error)
    throw new Error('Failed to upload video to Cloudinary')
  }
}

export async function uploadVideoBufferToCloudinary(buffer: Buffer, folder: string = 'generated-videos'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'video',
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading video buffer to Cloudinary:', error)
          reject(new Error('Failed to upload video buffer to Cloudinary'))
          return
        }
        resolve(result!.secure_url)
      }
    )
    uploadStream.end(buffer)
  })
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw new Error('Failed to delete image from Cloudinary')
  }
}
