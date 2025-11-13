import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// RunPod video generation configuration
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY
const RUNPOD_ENDPOINT = process.env.RUNPOD_ENDPOINT || "https://api.runpod.ai/v2"
const NOVITA_API_KEY = process.env.NOVITA_API_KEY
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "your-storage-zone"
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || "https://your-cdn.b-cdn.net"

// In-memory job storage (in production, use Redis or database)
const jobs = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const { characterId, prompt } = await request.json()

    if (!characterId || !prompt) {
      return NextResponse.json({ error: "Missing characterId or prompt" }, { status: 400 })
    }

    if (!RUNPOD_API_KEY) {
      return NextResponse.json({ error: "RunPod API key not configured" }, { status: 500 })
    }

    // Get character data
    const supabase = await createClient()
    const { data: character, error: charError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single()

    if (charError || !character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 })
    }

    // Enhance the prompt using Novita AI
    let enhancedPrompt = prompt
    if (NOVITA_API_KEY) {
      try {
        const promptResponse = await fetch("https://api.novita.ai/v3/openai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${NOVITA_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-V3",
            messages: [
              {
                role: "system",
                content: "You are an expert at creating concise video animation prompts. Transform user input into a detailed but brief animation description focusing on movement, emotion, and visual dynamics. Keep it under 50 words."
              },
              {
                role: "user",
                content: `Transform this into a video animation prompt: "${prompt}"`
              }
            ],
            max_tokens: 100,
            temperature: 0.7,
          }),
        })

        if (promptResponse.ok) {
          const promptData = await promptResponse.json()
          enhancedPrompt = promptData.choices[0]?.message?.content || prompt
          console.log("Enhanced prompt:", enhancedPrompt)
        }
      } catch (error) {
        console.warn("Failed to enhance prompt, using original:", error)
      }
    }

    // Upload character image to Bunny.net for RunPod access
    let imageUrl = character.image
    if (BUNNY_STORAGE_API_KEY && character.image) {
      try {
        // Fetch the image
        const imageResponse = await fetch(character.image)
        const imageBuffer = await imageResponse.arrayBuffer()
        
        // Upload to Bunny.net
        const fileName = `hover-video-source-${characterId}-${Date.now()}.jpg`
        const uploadResponse = await fetch(
          `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/video-sources/${fileName}`,
          {
            method: "PUT",
            headers: {
              "AccessKey": BUNNY_STORAGE_API_KEY,
              "Content-Type": "image/jpeg",
            },
            body: Buffer.from(imageBuffer),
          }
        )

        if (uploadResponse.ok) {
          imageUrl = `${BUNNY_CDN_URL}/video-sources/${fileName}`
          console.log("Uploaded source image to Bunny.net:", imageUrl)
        }
      } catch (error) {
        console.warn("Failed to upload source image to Bunny.net:", error)
      }
    }

    // Start RunPod video generation job
    const jobId = `hover-video-${characterId}-${Date.now()}`
    
    const runpodResponse = await fetch(`${RUNPOD_ENDPOINT}/run`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          image_url: imageUrl,
          prompt: enhancedPrompt,
          width: 480,
          height: 832,
          video_length: 81, // ~3 seconds
          steps: 10,
          cfg_scale: 7.5,
          motion_bucket_id: 127,
          fps: 25,
        },
      }),
    })

    if (!runpodResponse.ok) {
      const errorText = await runpodResponse.text()
      console.error("RunPod error:", errorText)
      return NextResponse.json({ error: "Failed to start video generation" }, { status: 500 })
    }

    const runpodData = await runpodResponse.json()
    const runpodJobId = runpodData.id

    // Store job info
    jobs.set(jobId, {
      characterId,
      runpodJobId,
      status: "processing",
      createdAt: Date.now(),
    })

    return NextResponse.json({ 
      success: true, 
      jobId,
      message: "Video generation started"
    })

  } catch (error: any) {
    console.error("Error in generate-character-hover-video:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  try {
    const jobId = request.headers.get("x-job-id")

    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 })
    }

    const job = jobs.get(jobId)
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check RunPod job status
    const statusResponse = await fetch(`${RUNPOD_ENDPOINT}/status/${job.runpodJobId}`, {
      headers: {
        "Authorization": `Bearer ${RUNPOD_API_KEY}`,
      },
    })

    if (!statusResponse.ok) {
      return NextResponse.json({ 
        status: "processing",
        message: "Checking status..."
      })
    }

    const statusData = await statusResponse.json()

    if (statusData.status === "COMPLETED") {
      const videoUrl = statusData.output?.video_url
      
      jobs.set(jobId, {
        ...job,
        status: "completed",
        videoUrl,
      })

      return NextResponse.json({
        status: "completed",
        videoUrl,
      })
    } else if (statusData.status === "FAILED") {
      jobs.set(jobId, {
        ...job,
        status: "failed",
        error: statusData.error,
      })

      return NextResponse.json({
        status: "failed",
        error: statusData.error || "Video generation failed",
      })
    }

    return NextResponse.json({
      status: "processing",
      message: "Video is being generated..."
    })

  } catch (error: any) {
    console.error("Error checking job status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
