import sharp from 'sharp'

/**
 * Add watermark to an image buffer
 * @param imageBuffer - Original image as Buffer
 * @param watermarkText - Text to display as watermark
 * @returns Watermarked image as Buffer
 */
export async function addWatermark(
  imageBuffer: Buffer,
  watermarkText: string = 'DINTYP AI'
): Promise<Buffer> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const { width = 512, height = 512 } = metadata

    // Calculate watermark size (10% of image width)
    const fontSize = Math.floor(width / 15)
    const padding = Math.floor(width / 30)

    // Create SVG watermark
    const svgWatermark = `
      <svg width="${width}" height="${height}">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text 
          x="${width - padding}" 
          y="${height - padding}" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          font-weight="bold"
          fill="white" 
          fill-opacity="0.7"
          text-anchor="end"
          filter="url(#shadow)"
        >${watermarkText}</text>
      </svg>
    `

    // Composite watermark onto image
    const watermarkedImage = await sharp(imageBuffer)
      .composite([{
        input: Buffer.from(svgWatermark),
        gravity: 'southeast'
      }])
      .toBuffer()

    return watermarkedImage

  } catch (error) {
    console.error('Error adding watermark:', error)
    // Return original image if watermarking fails
    return imageBuffer
  }
}

/**
 * Add watermark to image URL
 * @param imageUrl - URL of the image
 * @param watermarkText - Text to display as watermark
 * @returns Watermarked image as Buffer
 */
export async function addWatermarkToUrl(
  imageUrl: string,
  watermarkText: string = 'DINTYP AI'
): Promise<Buffer> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    // Add watermark
    return await addWatermark(imageBuffer, watermarkText)

  } catch (error) {
    console.error('Error adding watermark to URL:', error)
    throw error
  }
}

/**
 * Check if user should get watermarked images
 */
export async function shouldAddWatermark(userId: string): Promise<boolean> {
  try {
    const { getUserPlanInfo } = await import('@/lib/subscription-limits')
    const planInfo = await getUserPlanInfo(userId)
    
    // Free users get watermark
    if (planInfo.planType === 'free') {
      return planInfo.restrictions.image_watermark === 'true'
    }
    
    // Premium users don't get watermark
    return false

  } catch (error) {
    console.error('Error checking watermark status:', error)
    // Default to adding watermark if error
    return true
  }
}
