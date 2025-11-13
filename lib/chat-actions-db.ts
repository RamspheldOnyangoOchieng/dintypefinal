"use server"

import { createClient } from "@/lib/supabase-server"
import { checkMonthlyBudget, logApiCost } from "./budget-monitor"
import { isAskingForImage } from "./image-utils"

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
 * Now with database persistence!
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
  limitReached?: boolean
  upgradeRequired?: boolean
}> {
  try {
    const supabase = await createClient()

    // Check if user has premium
    const { data: premiumProfile } = await supabase
      .from('premium_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single()

    const isPremium = !!premiumProfile
    const messageLimit = isPremium ? 999999 : 100

    // Get today's message count
    const { data: usageData } = await supabase
      .from('message_usage_tracking')
      .select('message_count')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle()

    const currentUsage = (usageData as any)?.message_count || 0

    // Check if limit exceeded
    if (currentUsage >= messageLimit) {
      return {
        success: false,
        error: isPremium 
          ? "Daily message limit reached. Please try again tomorrow."
          : "You've reached your daily message limit (100 messages). Upgrade to premium for unlimited messages!",
        limitReached: true,
        upgradeRequired: !isPremium
      }
    }

    // Check monthly budget before processing
    const budgetStatus = await checkMonthlyBudget()
    if (!budgetStatus.allowed) {
      return {
        success: false,
        error: "Tjänsten är tillfälligt otillgänglig på grund av budgetgränser. Vänligen kontakta admin."
      }
    }

    // Save user message to database first
    const userMessageResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        characterId,
        content: userMessage,
        role: 'user',
        isImage: false
      })
    })

    if (!userMessageResponse.ok) {
      const errorData = await userMessageResponse.json()
      if (userMessageResponse.status === 429) {
        return {
          success: false,
          error: errorData.error || "Message limit reached",
          limitReached: true,
          upgradeRequired: errorData.details?.upgradeRequired || false
        }
      }
      throw new Error(errorData.error || "Failed to save user message")
    }

    const userMessageData = await userMessageResponse.json()

    // Check if user is asking for an image
    if (isAskingForImage(userMessage)) {
      // Return placeholder response for image generation
      const placeholderMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Jag genererar en bild åt dig. Vänta lite...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isImage: true
      }
      
      // Save placeholder to database
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId,
          content: placeholderMessage.content,
          role: 'assistant',
          isImage: true
        })
      })

      return {
        success: true,
        message: placeholderMessage
      }
    }

    // Get conversation history from database
    const historyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages?characterId=${characterId}&limit=10`
    )

    let conversationHistory: Message[] = []
    if (historyResponse.ok) {
      const historyData = await historyResponse.json()
      conversationHistory = historyData.messages || []
    }

    // Enhance system prompt with Swedish language instructions
    const enhancedSystemPrompt = `${systemPrompt}

VIKTIGT - SPRÅKINSTRUKTIONER:
- Du MÅSTE alltid svara på svenska
- Använd naturlig, vardaglig svenska
- Anpassa dig till svensk kultur och kontext
- Om någon skriver på engelska, svara ändå på svenska
- Var vänlig och personlig i din ton
- Använd svenska uttryck och ordföljd
- HÅLL SVAREN KORTA - max 1-2 meningar per svar
- Var koncis och gå rakt på sak

Kom ihåg att alltid kommunicera på svenska i alla dina svar och håll svaren korta.`

    // Format messages for the API
    const apiMessages = [
      { role: "system", content: enhancedSystemPrompt },
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // Get API key
    let apiKey = process.env.NOVITA_API_KEY || process.env.NEXT_PUBLIC_NOVITA_API_KEY
    
    if (!apiKey) {
      return {
        success: false,
        error: "API key not configured"
      }
    }

    // Make request to Novita API
    const requestBody = {
      messages: apiMessages,
      model: "meta-llama/llama-3.1-8b-instruct",
      temperature: 0.7,
      max_tokens: 800,
    }

    const startTime = Date.now()
    
    const response = await fetch("https://api.novita.ai/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Novita API error:", errorText)
      return {
        success: false,
        error: "Failed to generate AI response"
      }
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      return {
        success: false,
        error: "No response from AI"
      }
    }

    const apiLatency = Date.now() - startTime

    // Save AI response to database
    const aiMessageResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        characterId,
        content: aiResponse,
        role: 'assistant',
        isImage: false,
        metadata: {
          model: "meta-llama/llama-3.1-8b-instruct",
          api_latency_ms: apiLatency,
          tokens_estimated: Math.ceil(aiResponse.length / 4) // Rough estimate
        }
      })
    })

    if (!aiMessageResponse.ok) {
      console.error("Failed to save AI response to database")
    }

    // Log API cost
    await logApiCost(
      "chat_message",
      1, // Token cost (estimated)
      0.0001, // API cost (estimated)
      userId
    )

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return {
      success: true,
      message: aiMessage
    }

  } catch (error: any) {
    console.error("Error in sendChatMessageDB:", error)
    return {
      success: false,
      error: error.message || "Failed to send message"
    }
  }
}

/**
 * Load chat history from database
 */
export async function loadChatHistory(
  characterId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages?characterId=${characterId}&limit=${limit}`
    )

    if (!response.ok) {
      console.error("Failed to load chat history")
      return []
    }

    const data = await response.json()
    return data.messages || []

  } catch (error) {
    console.error("Error loading chat history:", error)
    return []
  }
}

/**
 * Clear chat history for a character
 */
export async function clearChatHistory(characterId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages?characterId=${characterId}`,
      {
        method: 'DELETE'
      }
    )

    return response.ok
    
  } catch (error) {
    console.error("Error clearing chat history:", error)
    return false
  }
}
