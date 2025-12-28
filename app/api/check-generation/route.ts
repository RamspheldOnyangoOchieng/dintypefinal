import { type NextRequest, NextResponse } from "next/server"
import { getNovitaApiKey } from "@/lib/api-keys"
import { createAdminClient } from "@/lib/supabase-admin"
import { refundTokens } from "@/lib/token-utils"

type NovitaTaskResultResponse = {
  extra: {
    seed: string
    debug_info: {
      request_info: string
      submit_time_ms: string
      execute_time_ms: string
      complete_time_ms: string
    }
  }
  task: {
    task_id: string
    task_type: string
    status: string
    reason: string
    eta: number
    progress_percent: number
  }
  images: {
    image_url: string
    image_url_ttl: string
    image_type: string
  }[]
  videos: any[]
  audios: any[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    // Get API key with automatic fallback to .env
    const apiKey = await getNovitaApiKey()

    if (!apiKey) {
      return NextResponse.json({
        error: "No Novita API key configured. Please add it in Admin Dashboard or .env file"
      }, { status: 500 })
    }

    console.log(`Checking task status for task ID: ${taskId}`)

    // Use the correct endpoint for checking task results
    const response = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`NOVITA API error (${response.status}):`, errorText)
      return NextResponse.json(
        {
          error: `Failed to check generation status: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = (await response.json()) as NovitaTaskResultResponse
    console.log(`Task status: ${data.task.status}`)

    // Initialize admin client to update task status/refund if needed
    const supabaseAdmin = await createAdminClient()

    // Return appropriate response based on task status
    if (data.task.status === "TASK_STATUS_SUCCEED") {
      // Task completed successfully
      console.log(`Task succeeded, found ${data.images.length} images`)
      
      // Update local task status if admin client is available
      if (supabaseAdmin) {
        await supabaseAdmin
          .from("generation_tasks")
          .update({ status: "succeeded" })
          .eq("task_id", taskId)
          .eq("status", "processing")
      }

      return NextResponse.json({
        status: "TASK_STATUS_SUCCEED",
        images: data.images.map((img) => img.image_url),
      })
    } else if (data.task.status === "TASK_STATUS_FAILED") {
      // Task failed
      console.log(`Task failed: ${data.task.reason}`)
      
      // Handle refund and status update
      if (supabaseAdmin) {
        // Find the task to get user ID and token cost
        const { data: taskRecord, error: fetchError } = await supabaseAdmin
          .from("generation_tasks")
          .select("id, user_id, tokens_deducted, status")
          .eq("task_id", taskId)
          .single()

        if (taskRecord && (taskRecord.status === "processing" || taskRecord.status === "pending")) {
          // Update status first to prevent race condition refunds
          await supabaseAdmin
            .from("generation_tasks")
            .update({ status: "failed", error_message: data.task.reason })
            .eq("id", taskRecord.id)

          // Refund tokens if any were deducted
          if (taskRecord.tokens_deducted > 0) {
            console.log(`🔄 Refunding ${taskRecord.tokens_deducted} tokens for failed task ${taskId}`)
            await refundTokens(
              taskRecord.user_id,
              taskRecord.tokens_deducted,
              `Refund for failed image generation (Task: ${taskId})`,
              { taskId, reason: data.task.reason }
            )
          }
        }
      }

      return NextResponse.json({
        status: "TASK_STATUS_FAILED",
        reason: data.task.reason || "Unknown error",
        refunded: true
      })
    } else {
      // Task still in progress
      console.log(`Task in progress: ${data.task.status}, progress: ${data.task.progress_percent}%`)
      
      // Update progress in DB (optional, but good for tracking)
      if (supabaseAdmin && data.task.progress_percent > 0) {
        await supabaseAdmin
          .from("generation_tasks")
          .update({ 
            progress: data.task.progress_percent,
            status: "processing" 
          })
          .eq("task_id", taskId)
          .neq("status", "succeeded") // Don't overwrite if already done
      }

      return NextResponse.json({
        status: data.task.status,
        progress: data.task.progress_percent,
        eta: data.task.eta,
      })
    }
  } catch (error) {
    console.error("Error checking generation status:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
