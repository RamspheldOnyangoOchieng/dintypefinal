import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = 'force-dynamic'

// GET - Retrieve chat history for a character
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get("characterId")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!characterId) {
      return NextResponse.json(
        { success: false, error: "characterId is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Use the database function to get conversation history
    const { data: messages, error } = await supabase.rpc('get_conversation_history', {
      p_user_id: user.id,
      p_character_id: characterId,
      p_limit: limit
    })

    if (error) {
      console.error("Error fetching conversation history:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messages: messages || []
    })

  } catch (error: any) {
    console.error("Error in GET /api/messages:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { characterId, content, role = "user", isImage = false, imageUrl = null } = body

    if (!characterId || !content) {
      return NextResponse.json(
        { success: false, error: "characterId and content are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check daily message limit (only for user messages)
    if (role === "user") {
      const { data: limitCheck, error: limitError } = await supabase.rpc('check_daily_message_limit', {
        p_user_id: user.id
      })

      if (limitError) {
        console.error("Error checking message limit:", limitError)
      } else if (limitCheck && limitCheck.length > 0) {
        const limit = limitCheck[0]
        
        if (!limit.allowed) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Daily message limit reached",
              details: {
                currentUsage: limit.current_usage,
                limit: limit.limit_value,
                isPremium: limit.is_premium,
                upgradeRequired: !limit.is_premium
              }
            },
            { status: 429 } // 429 Too Many Requests
          )
        }
      }
    }

    // Get or create conversation session
    const { data: sessionId, error: sessionError } = await supabase.rpc('get_or_create_conversation_session', {
      p_user_id: user.id,
      p_character_id: characterId
    })

    if (sessionError || !sessionId) {
      console.error("Error getting/creating session:", sessionError)
      return NextResponse.json(
        { success: false, error: "Failed to create conversation session" },
        { status: 500 }
      )
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role,
        content,
        is_image: isImage,
        image_url: imageUrl,
        metadata: {
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting message:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error: any) {
    console.error("Error in POST /api/messages:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Clear conversation history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get("characterId")

    if (!characterId) {
      return NextResponse.json(
        { success: false, error: "characterId is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Find the active session
    const { data: session, error: sessionError } = await supabase
      .from("conversation_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("character_id", characterId)
      .eq("is_archived", false)
      .single()

    if (sessionError && sessionError.code !== 'PGRST116') { // Ignore "not found" error
      console.error("Error finding session:", sessionError)
      return NextResponse.json(
        { success: false, error: sessionError.message },
        { status: 500 }
      )
    }

    if (session) {
      // Archive the session (soft delete)
      const { error: archiveError } = await supabase
        .from("conversation_sessions")
        .update({ is_archived: true })
        .eq("id", session.id)

      if (archiveError) {
        console.error("Error archiving session:", archiveError)
        return NextResponse.json(
          { success: false, error: archiveError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Conversation history cleared"
    })

  } catch (error: any) {
    console.error("Error in DELETE /api/messages:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
