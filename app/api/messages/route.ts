import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { v4 as uuidv4 } from "uuid"

export const dynamic = 'force-dynamic'

/**
 * GET - Retrieve chat history for a character
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get("characterId")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!characterId) {
      return NextResponse.json({ success: false, error: "characterId is required" }, { status: 400 })
    }

    const supabase = await createClient() as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Use RPC function from migration if available, otherwise manual join
    const { data: messages, error } = await supabase
      .rpc('get_conversation_history', {
        p_user_id: user.id,
        p_character_id: characterId,
        p_limit: limit
      })

    if (error) {
      // Fallback if RPC fails or doesn't exist (e.g. migration issue)
      console.log("Falling back to manual history fetch")

      // First find the session
      const { data: session } = await supabase
        .from('conversation_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('character_id', characterId)
        .eq('is_archived', false)
        .maybeSingle()

      if (!session) {
        return NextResponse.json({ success: true, messages: [] })
      }

      const { data: fallbackMessages, error: fallbackError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (fallbackError) {
        console.error("Error fetching fallback messages:", fallbackError)
        return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, messages: fallbackMessages || [] })
    }

    return NextResponse.json({ success: true, messages: messages || [] })

  } catch (error: any) {
    console.error("Error in GET /api/messages:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST - Save a new message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { characterId, content, role = "user", isImage = false, imageUrl = null, metadata = {} } = body

    if (!characterId || !content) {
      return NextResponse.json({ success: false, error: "characterId and content are required" }, { status: 400 })
    }

    const supabase = await createClient() as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get or create conversation session
    let sessionId: string | null = null
    const { data: sid, error: sessionError } = await supabase.rpc('get_or_create_conversation_session', {
      p_user_id: user.id,
      p_character_id: characterId
    })

    if (sessionError || !sid) {
      console.log("Falling back to manual session creation")
      // Manual fallback
      const { data: existingSession } = await supabase
        .from('conversation_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('character_id', characterId)
        .eq('is_archived', false)
        .maybeSingle()

      if (existingSession) {
        sessionId = existingSession.id
      } else {
        const { data: newSession, error: createError } = await supabase
          .from('conversation_sessions')
          .insert({
            user_id: user.id,
            character_id: characterId,
            title: role === 'user' ? content.substring(0, 50) : 'Nu chat'
          })
          .select('id')
          .single()

        if (createError) throw createError
        sessionId = newSession.id
      }
    } else {
      sessionId = sid
    }

    // 2. Insert the message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role: role,
        content: content,
        is_image: isImage,
        image_url: imageUrl,
        metadata: metadata
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting message:", insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message })

  } catch (error: any) {
    console.error("Error in POST /api/messages:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE - Clear conversation history (archive session)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get("characterId")

    if (!characterId) {
      return NextResponse.json({ success: false, error: "characterId is required" }, { status: 400 })
    }

    const supabase = await createClient() as any
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Archive all existing sessions for this user-character pair
    const { error } = await supabase
      .from('conversation_sessions')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('character_id', characterId)
      .eq('is_archived', false)

    if (error) {
      console.error("Error archiving sessions:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Chat history cleared" })

  } catch (error: any) {
    console.error("Error in DELETE /api/messages:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
