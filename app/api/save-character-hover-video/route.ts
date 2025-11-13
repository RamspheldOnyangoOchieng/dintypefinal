import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "your-storage-zone"
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || "https://your-cdn.b-cdn.net"

export async function POST(request: NextRequest) {
  try {
    const { characterId, videoUrl } = await request.json()

    if (!characterId || !videoUrl) {
      return NextResponse.json({ error: "Missing characterId or videoUrl" }, { status: 400 })
    }

    if (!BUNNY_STORAGE_API_KEY) {
      return NextResponse.json({ error: "Bunny.net storage not configured" }, { status: 500 })
    }

    // Download the video from RunPod
    console.log("Downloading video from:", videoUrl)
    const videoResponse = await fetch(videoUrl)
    
    if (!videoResponse.ok) {
      throw new Error("Failed to download video from RunPod")
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    console.log("Video downloaded, size:", videoBuffer.byteLength)

    // Upload to Bunny.net CDN
    const fileName = `hover-videos/${characterId}-${Date.now()}.mp4`
    console.log("Uploading to Bunny.net:", fileName)
    
    const uploadResponse = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${fileName}`,
      {
        method: "PUT",
        headers: {
          "AccessKey": BUNNY_STORAGE_API_KEY,
          "Content-Type": "video/mp4",
        },
        body: Buffer.from(videoBuffer),
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Bunny.net upload error:", errorText)
      throw new Error("Failed to upload video to CDN")
    }

    const cdnUrl = `${BUNNY_CDN_URL}/${fileName}`
    console.log("Video uploaded to CDN:", cdnUrl)

    // Update character record with video URL
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from("characters")
      .update({ 
        video_url: cdnUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", characterId)

    if (updateError) {
      console.error("Database update error:", updateError)
      throw new Error("Failed to update character record")
    }

    console.log("Character updated successfully with video URL")

    return NextResponse.json({
      success: true,
      cdnUrl,
      message: "Video saved successfully"
    })

  } catch (error: any) {
    console.error("Error in save-character-hover-video:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
