"use server"

import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "./supabase-admin"
import { checkMonthlyBudget, logApiCost } from "./budget-monitor"
import { isAskingForImage } from "./image-utils"
import { checkMessageLimit } from "./subscription-limits"

export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
  isImage?: boolean
  imageUrl?: string
}

/**
 * Send a chat message and get AI response
 * Uses Admin Client to bypass RLS for reliability in server actions
 */
export async function sendChatMessageDB(
  characterId: string,
  userMessage: string,
  systemPrompt: string,
  userId: string
): Promise<{
  success: boolean
  message?: Message
  error?: string
  details?: any
  limitReached?: boolean
  upgradeRequired?: boolean
}> {
  console.log(`💬 AI Chat Action [ADMIN]: User=${userId}, Character=${characterId}`);

  try {
    // 0. Use Admin Client to bypass RLS issues
    const supabase = await createAdminClient() as any
    if (!supabase) throw new Error("Database admin client initialization failed")

    // 1. Check message limits
    const limitCheck = await checkMessageLimit(userId)
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.message || "Du har nått din dagliga meddelandegräns.",
        limitReached: true,
        upgradeRequired: true
      }
    }

    // 2. Check monthly budget
    const budgetStatus = await checkMonthlyBudget()
    if (!budgetStatus.allowed) {
      return {
        success: false,
        error: "Budgetgräns uppnådd. Kontakta administratören."
      }
    }

    // 3. Get or create conversation session
    const { data: sessionId, error: sessionError } = await supabase.rpc('get_or_create_conversation_session', {
      p_user_id: userId,
      p_character_id: characterId
    })

    if (sessionError) {
      console.error("RPC Session Error:", sessionError);
      return {
        success: false,
        error: `Session Error: ${sessionError.message}`,
        details: sessionError
      }
    }

    if (!sessionId) {
      return {
        success: false,
        error: "Kunde inte initiera en chattsession."
      }
    }

    // 4. Save user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: userMessage,
        is_image: false
      })

    if (userMsgError) {
      console.error("User Message Insert Error:", userMsgError);
      return {
        success: false,
        error: `Kunde inte spara meddelande i databasen.`,
        details: userMsgError
      }
    }

    // 5. Handle image requests
    if (isAskingForImage(userMessage)) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Jag genererar en bild åt dig. Vänta lite...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isImage: true
      }

      await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          role: 'assistant',
          content: assistantMessage.content,
          is_image: true
        })

      return {
        success: true,
        message: assistantMessage
      }
    }

    // 6. Get history
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    const conversationHistory = (historyData || []).reverse()

    // 7. Prompt construction
    const enhancedSystemPrompt = `${systemPrompt || ""}

[Swedish Response Protocol Enabled]
- Alltid svara på svenska.
- Korta, koncisa svar (max 2 meningar).`

    const apiMessages = [
      { role: "system", content: enhancedSystemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // 8. API Keys
    const apiKey = process.env.OPENAI_API_KEY || process.env.NOVITA_API_KEY
    if (!apiKey) {
      return { success: false, error: "AI-konfiguration saknas (API-nyckel)." }
    }

    const useOpenAI = !!process.env.OPENAI_API_KEY
    const url = useOpenAI ? "https://api.openai.com/v1/chat/completions" : "https://api.novita.ai/openai/v1/chat/completions"
    const model = useOpenAI ? "gpt-4o-mini" : "meta-llama/llama-3.1-8b-instruct"

    // 9. Call AI
    const startTime = Date.now()
    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        model: model,
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: "AI-tjänsten returnerade ett fel.", details: errorText }
    }

    const data = await response.json()
    const aiResponseContent = data.choices?.[0]?.message?.content

    if (!aiResponseContent) {
      return { success: false, error: "AI returnerade ett tomt svar." }
    }

    // 10. Save AI response
    const { data: savedMsg, error: aiSaveError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: aiResponseContent,
        metadata: { model, latency: Date.now() - startTime }
      })
      .select()
      .single()

    // 11. Log cost (non-blocking)
    logApiCost("chat_message", 1, 0.0001, userId).catch(err => console.error("Logging error:", err))

    return {
      success: true,
      message: {
        id: savedMsg?.id || crypto.randomUUID(),
        role: "assistant",
        content: aiResponseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    }

  } catch (error: any) {
    console.error("Fatal sendChatMessageDB error:", error);
    return {
      success: false,
      error: `Ett oväntat fel uppstod: ${error.message || "Okänt fel"}`
    }
  }
}

/**
 * Load chat history from database (Uses Admin Client to see own history reliably)
 */
export async function loadChatHistory(
  characterId: string,
  userId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    const supabase = await createAdminClient() as any
    if (!supabase) return []

    const { data: messages, error } = await supabase
      .rpc('get_conversation_history', {
        p_user_id: userId,
        p_character_id: characterId,
        p_limit: limit
      })

    if (error) {
      console.error("Error loading chat history:", error)
      return []
    }

    return (messages || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isImage: m.is_image,
      imageUrl: m.image_url
    }))

  } catch (error) {
    console.error("Error loading chat history:", error)
    return []
  }
}

/**
 * Clear chat history for a character (archive session)
 */
export async function clearChatHistory(characterId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createAdminClient() as any
    if (!supabase) return false

    const { error } = await supabase
      .from('conversation_sessions')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .eq('is_archived', false)

    return !error
  } catch (error) {
    console.error("Error clearing chat history:", error)
    return false
  }
}
