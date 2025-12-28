import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { v4 as uuidv4 } from "uuid"

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

    // Fetch messages directly from chat_messages table
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('character_id', characterId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching chat messages:", error)
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

// POST - Save a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { characterId, content, role = "user" } = body

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

    // Insert the message into chat_messages
    const { data: message, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        id: uuidv4(),
        user_id: user.id,
        character_id: characterId,
        role: role,
        content: content,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting message into chat_messages:", insertError)
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

    // Delete messages for this user and character
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("character_id", characterId)

    if (deleteError) {
      console.error("Error deleting chat_messages:", deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
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
