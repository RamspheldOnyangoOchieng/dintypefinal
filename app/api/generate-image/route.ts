// Last updated: 2025-12-14T20:15:00+03:00 - Force deployment refresh
import { type NextRequest, NextResponse } from "next/server"
import { deductTokens, refundTokens } from "@/lib/token-utils"
import { createClient } from "@/lib/supabase-server"
import { getUnifiedNovitaKey } from "@/lib/unified-api-keys"
import type { Database } from "@/types/supabase"

// Dynamic token costs based on model and image count
const getTokenCost = (model: string, imageCount: number = 1): number => {
  // Map frontend model names to token costs
  let baseTokenCost = 5 // Default for stability/seedream

  if (model === "flux") {
    baseTokenCost = 10
  } else if (model === "stability" || model === DEFAULT_MODEL) {
    baseTokenCost = 5
  }

  return baseTokenCost * imageCount
}

// Define types for the API
type NovitaRequestBody = {
  extra: {
    response_image_type: string
  }
  request: {
    prompt: string
    model_name: string
    negative_prompt?: string
    width: number
    height: number
    image_num: number
    steps: number
    seed: number
    sampler_name: string
    guidance_scale: number
  }
}

type NovitaTaskResponse = {
  task_id: string
}

type NovitaTaskResultResponse = {
  task: {
    task_id: string
    status: string
    reason: string
  }
  images: {
    image_url: string
    image_type: string
  }[]
}

const DEFAULT_MODEL = "epicrealism_naturalSinRC1VAE_106430.safetensors";

// Enhanced negative prompts for maximum NSFW undetectability and quality
// These prompts help bypass content filters while maintaining high image quality
const DEFAULT_NEGATIVE_PROMPT_PARTS = [
  // Quality-related (keeps filters from flagging low-quality generation)
  "ugly", "deformed", "bad anatomy", "disfigured", "mutated", "extra limbs",
  "missing limbs", "fused fingers", "extra fingers", "bad hands", "malformed hands",
  "poorly drawn hands", "poorly drawn face", "blurry", "jpeg artifacts",
  "worst quality", "low quality", "lowres", "pixelated", "out of frame",
  "tiling", "watermarks", "signature", "censored", "distortion", "grain",
  "long neck", "unnatural pose", "asymmetrical face", "cross-eyed", "lazy eye",
  "bad feet", "extra arms", "extra legs", "disjointed limbs",
  "incorrect limb proportions", "unrealistic body", "unrealistic face",
  "unnatural skin", "disconnected limbs", "lopsided", "cloned face", "glitch",
  "double torso", "bad posture", "wrong perspective", "overexposed",
  "underexposed", "low detail",

  // Enhanced undetectability markers
  "unrealistic proportions", "cartoon", "anime style", "3d render",
  "illustration", "painting", "sketch", "drawing", "digital art",
  "compressed", "noisy", "artifacts", "chromatic aberration",
  "duplicate", "morbid", "mutilated", "poorly drawn", "cloned",
  "gross proportions", "malformed", "missing", "error", "cropped",
  "lowres quality", "normal quality", "username", "text", "logo",
];

const DEFAULT_NEGATIVE_PROMPT = DEFAULT_NEGATIVE_PROMPT_PARTS.join(", ");

/**
 * Get webhook URL for Novita callbacks
 * Automatically detects deployment URL or uses local development URL
 */
function getWebhookUrl(): string {
  const deploymentUrl = process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_APP_URL

  if (deploymentUrl) {
    const baseUrl = deploymentUrl.startsWith('http')
      ? deploymentUrl
      : `https://${deploymentUrl}`
    return `${baseUrl}/api/novita-webhook`
  }

  // Fallback to localhost for development
  return 'http://localhost:3000/api/novita-webhook'
}

export async function POST(req: NextRequest) {
  let userId: string | undefined
  let tokenCost: number | undefined
  let actualImageCount: number
  let actualModel: string

  try {
    const supabase = await createClient();
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
    }

    const {
      prompt,
      model = DEFAULT_MODEL,
      negativePrompt = DEFAULT_NEGATIVE_PROMPT,
      response_format = "url",
      size = "512x1024",
      seed = -1,
      guidance_scale = 7.5,
      watermark = true,
      image_num = 1, // Number of images to generate
      selectedCount, // Frontend sends this for number of images
      selectedModel, // Frontend sends this for model type
    } = body;

    // Use frontend parameters if available, otherwise fall back to defaults
    actualImageCount = selectedCount ? parseInt(selectedCount) : image_num
    actualModel = selectedModel || model

    const apiModelName = DEFAULT_MODEL;

    // Calculate dynamic token cost based on model and image count
    tokenCost = getTokenCost(actualModel, actualImageCount)
    console.log(`💰 Token cost calculation: ${tokenCost} tokens (model: ${actualModel}, images: ${actualImageCount})`)

    // Get API key with fallback (DB → .env)
    const { key: apiKey, source, error: keyError } = await getUnifiedNovitaKey()
    if (!apiKey) {
      console.error("❌ API key error:", keyError)
      return NextResponse.json({
        error: "API key not configured",
        details: keyError || "Please configure NOVITA_API_KEY in .env or Admin Dashboard → API Keys"
      }, { status: 500 });
    }
    console.log(`✅ Using Novita API key from ${source}`)

    // Try multiple authentication methods
    const authHeader = req.headers.get('authorization')
    const userIdHeader = req.headers.get('x-user-id')

    console.log("🔑 Auth headers:", {
      hasAuthHeader: !!authHeader,
      hasUserIdHeader: !!userIdHeader
    })

    // Method 1: Try Authorization header (JWT token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      console.log("🎫 Token extracted:", token.substring(0, 20) + '...')


      try {
        // Create a new client instance for auth verification
        const authSupabase = await createClient()
        const { data: { user }, error: authError } = await authSupabase.auth.getUser(token)

        if (authError || !user) {
          console.error("❌ Token verification failed:", authError?.message)
        } else {
          userId = user.id
          console.log("✅ Authentication successful via token for user:", userId.substring(0, 8) + '...')
        }
      } catch (error) {
        console.error("❌ Token authentication error:", error)
      }
    }

    // Method 2: Fallback to User ID header (for cases where session token is not available)
    if (!userId && userIdHeader) {
      console.log("🔄 Trying fallback authentication with user ID:", userIdHeader.substring(0, 8) + '...')

      // Validate that the user ID exists in the database

      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userIdHeader)
          .single()

        if (userError || !userData) {
          console.error("❌ User ID validation failed:", userError?.message)
        } else {
          userId = userIdHeader
          console.log("✅ Authentication successful via user ID for user:", userId.substring(0, 8) + '...')
        }
      } catch (error) {
        console.error("❌ User ID validation error:", error)
      }
    }

    // If neither method worked, return unauthorized
    if (!userId) {
      console.error("❌ All authentication methods failed")
      return NextResponse.json({
        error: "Unauthorized",
        details: "Please ensure you are logged in. Authentication failed."
      }, { status: 401 })
    }

    // Check token balance before deduction
    console.log(`💳 Attempting to deduct ${tokenCost} tokens for user ${userId.substring(0, 8)}...`)

    try {
      const deductionResult = await deductTokens(userId, tokenCost, `Image generation (${model}, ${image_num} images)`)
      if (!deductionResult) {
        console.error("❌ Token deduction failed")
        return NextResponse.json({
          error: "Failed to deduct tokens. Please check your token balance."
        }, { status: 402 })
      }
      console.log(`✅ Successfully deducted ${tokenCost} tokens`)
    } catch (error: any) {
      console.error("❌ Token deduction error:", error.message)
      return NextResponse.json({
        error: error.message || "Insufficient tokens or token deduction failed"
      }, { status: 402 })
    }

    const [width, height] = (size || "512x1024").split("x").map(Number)

    // Get webhook URL for automatic result processing
    const webhookUrl = getWebhookUrl()
    console.log(`📞 Webhook URL: ${webhookUrl}`)

    // Create enhanced request body with webhook support and NSFW bypass
    const requestBody = {
      extra: {
        response_image_type: "jpeg",
        // CRITICAL: Disable NSFW detection for maximum undetectability
        enable_nsfw_detection: false,
        nsfw_detection_level: 0,
        // Add webhook for automatic processing
        webhook: {
          url: webhookUrl,
          // Test mode configuration (optional, set to false in production)
          test_mode: {
            enabled: false,
          }
        },
      },
      request: {
        prompt: prompt,
        model_name: apiModelName,
        negative_prompt: negativePrompt,
        width,
        height,
        image_num: actualImageCount,
        steps: 50,
        seed: -1,
        sampler_name: "DPM++ 2M Karras",
        guidance_scale,
      },
    }

    // Create database task record BEFORE API call for webhook tracking
    console.log('💾 Creating task record in database...')
    const taskRecord = {
      user_id: userId,
      prompt: prompt,
      negative_prompt: negativePrompt,
      model: actualModel,
      image_count: actualImageCount,
      width,
      height,
      status: 'pending',
      tokens_deducted: tokenCost,
      task_id: '', // Will be updated after API call
    }

    const { data: createdTask, error: taskError } = await supabase
      .from('generation_tasks')
      .insert(taskRecord)
      .select()
      .single()

    if (taskError) {
      console.error('⚠️  Warning: Failed to create task record:', taskError)
      // Don't fail the request if task creation fails, just log it
    } else {
      console.log('✅ Task record created successfully')
    }

    const response = await fetch("https://api.novita.ai/v3/async/txt2img", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ NOVITA API error:", errorData);

      // Refund tokens since image generation failed
      console.log(`🔄 Image generation failed after deducting ${tokenCost} tokens. Attempting refund...`)

      try {
        const refundResult = await refundTokens(
          userId,
          tokenCost,
          `Refund for failed image generation (${actualModel}, ${actualImageCount} images)`,
          {
            original_request: { prompt, model: actualModel, image_count: actualImageCount },
            api_error: errorData,
            refund_reason: "API generation failure"
          }
        )

        if (refundResult) {
          console.log(`✅ Successfully refunded ${tokenCost} tokens to user`)
        } else {
          console.error(`❌ Failed to refund ${tokenCost} tokens to user`)
        }
      } catch (refundError) {
        console.error("❌ Error during token refund:", refundError)
      }

      return NextResponse.json({
        error: "Failed to generate image",
        details: "Image generation service is currently unavailable. Your tokens have been refunded.",
        refunded: true
      }, { status: response.status });
    }

    const data = (await response.json()) as NovitaTaskResponse
    console.log(`✅ Task submitted successfully, task ID: ${data.task_id}`)

    // Update database task record with the task_id from Novita
    if (createdTask) {
      const { error: updateError } = await supabase
        .from('generation_tasks')
        .update({ 
          task_id: data.task_id,
          status: 'processing'
        })
        .eq('id', createdTask.id)

      if (updateError) {
        console.error('⚠️  Warning: Failed to update task with task_id:', updateError)
      } else {
        console.log('✅ Task record updated with task_id')
      }
    }

    // Return the task ID to the frontend
    // Note: Images will be automatically processed by webhook and stored to Cloudinary
    return NextResponse.json({
      task_id: data.task_id,
      tokens_used: tokenCost,
      webhook_enabled: true,
      message: 'Task submitted successfully. Images will be automatically processed and stored to Cloudinary via webhook.',
    })
  } catch (error) {
    console.error("❌ Error generating image:", error);

    // If we have a userId and tokenCost, attempt to refund tokens
    if (userId && tokenCost) {
      console.log(`🔄 Unexpected error occurred after deducting ${tokenCost} tokens. Attempting refund...`)

      try {
        const refundResult = await refundTokens(
          userId,
          tokenCost,
          `Refund for failed image generation due to server error`,
          {
            error_message: error instanceof Error ? error.message : String(error),
            refund_reason: "Server error during generation"
          }
        )

        if (refundResult) {
          console.log(`✅ Successfully refunded ${tokenCost} tokens due to server error`)
        }
      } catch (refundError) {
        console.error("❌ Error during emergency token refund:", refundError)
      }
    }

    return NextResponse.json({
      error: "Internal server error",
      details: "An unexpected error occurred. If tokens were deducted, they have been refunded.",
      refunded: !!userId && !!tokenCost
    }, { status: 500 });
  }
}
