import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"


export async function POST(request: NextRequest) {
  try {
    const { characterId, videoUrl } = await request.json()

    if (!characterId || !videoUrl) {
      return NextResponse.json({ error: "Missing characterId or videoUrl" }, { status: 400 })
    }


    // Download the video from RunPod
    console.log("Downloading video from:", videoUrl)
    const videoResponse = await fetch(videoUrl)

    if (!videoResponse.ok) {
      throw new Error("Failed to download video from RunPod")
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    console.log("Video downloaded, size:", videoBuffer.byteLength)

    // Upload to Cloudinary
    console.log("Uploading to Cloudinary...")
    const { uploadVideoBufferToCloudinary } = await import("@/lib/cloudinary-upload")
    const cloudinaryUrl = await uploadVideoBufferToCloudinary(Buffer.from(videoBuffer), 'hover-videos')
    console.log("Video uploaded to Cloudinary:", cloudinaryUrl)

    // Update character record with video URL
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from("characters")
      .update({
        video_url: cloudinaryUrl,
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
      cdnUrl: cloudinaryUrl,
      message: "Video saved successfully"
    })

  } catch (error: any) {
    console.error("Error in save-character-hover-video:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
