"use server"

import { getApiKey } from "./db-init"
import { isAskingForImage } from "./image-utils"
import { checkMonthlyBudget, logApiCost } from "./budget-monitor"

import { incrementMessageUsage, getUserPlanInfo } from "./subscription-limits"
import { SFW_SYSTEM_PROMPT_SV } from "./nsfw-filter"

export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
  isImage?: boolean
  imageUrl?: string
}

export async function sendChatMessage(
  messages: Message[],
  systemPrompt: string,
  userId?: string,
): Promise<{ id: string; content: string; timestamp: string; isImage?: boolean; imageUrl?: string }> {
  try {
    // Check monthly budget before processing
    const budgetStatus = await checkMonthlyBudget()
    if (!budgetStatus.allowed) {
      return {
        id: Math.random().toString(36).substring(2, 15),
        content: "Tjänsten är tillfälligt otillgänglig på grund av budgetgränser. Vänligen kontakta admin.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    }

    // Check if the user is asking for an image
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === "user" && isAskingForImage(lastMessage.content)) {
      // Return a placeholder response indicating an image is being generated
      return {
        id: Math.random().toString(36).substring(2, 15),
        content: "Jag genererar en bild åt dig. Vänta lite...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isImage: true,
      }
    }

    // Check if the user is on the free plan to enforce SFW responses
    let isFreeUser = true;
    if (userId) {
      const planInfo = await getUserPlanInfo(userId);
      isFreeUser = planInfo.planType === 'free';
    }

    // Enhance system prompt with Swedish language instructions and SFW if needed
    const enhancedSystemPrompt = `${systemPrompt}
${isFreeUser ? SFW_SYSTEM_PROMPT_SV : ""}

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
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    try {
      // PRIORITY: Use OPENAI_API_KEY from .env first, then fallback to NOVITA
      const openaiApiKey = process.env.OPENAI_API_KEY
      const novitaApiKey = process.env.NOVITA_API_KEY || process.env.NEXT_PUBLIC_NOVITA_API_KEY

      // Determine which API to use
      const useOpenAI = !!openaiApiKey
      let apiKey = openaiApiKey || novitaApiKey

      // Only try database if environment variables are not available
      if (!apiKey) {
        try {
          const dbApiKey = await getApiKey("novita_api_key")
          apiKey = dbApiKey || undefined;
          console.log("API key from database:", apiKey ? "Found" : "Not found")
        } catch (error) {
          console.warn("Could not fetch API key from database:", error)
        }
      }

      console.log("Chat API Configuration:", {
        usingOpenAI: useOpenAI,
        OPENAI_API_KEY: openaiApiKey ? `${openaiApiKey.substring(0, 10)}...` : "Not found",
        NOVITA_API_KEY: novitaApiKey ? `${novitaApiKey.substring(0, 10)}...` : "Not found",
      })

      if (!apiKey) {
        throw new Error("No API key found - please set OPENAI_API_KEY or NOVITA_API_KEY in .env")
      }

      let response: Response
      let apiCostPerMillion: number

      if (useOpenAI) {
        // Use OpenAI API
        console.log("Using OpenAI API for chat...")
        const openaiRequestBody = {
          model: "gpt-4o-mini", // Cost-effective and fast
          messages: apiMessages,
          max_tokens: 150,
          temperature: 0.7,
        }

        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(openaiRequestBody),
        })
        apiCostPerMillion = 0.15 // $0.15 per 1M input tokens for gpt-4o-mini
      } else {
        // Use Novita API (fallback)
        console.log("Using Novita API for chat...")
        const novitaRequestBody = {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: apiMessages,
          response_format: { type: "text" },
          max_tokens: 150,
          temperature: 0.7,
          top_p: 1,
          min_p: 0,
          top_k: 50,
          presence_penalty: 0,
          frequency_penalty: 0.5,
          repetition_penalty: 1.1,
        }

        response = await fetch("https://api.novita.ai/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(novitaRequestBody),
        })
        apiCostPerMillion = 0.10 // $0.10 per 1M tokens for Llama 3.1 8B
      }

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`${useOpenAI ? 'OpenAI' : 'Novita'} API error:`, response.status, errorText)
        throw new Error(`API request failed: ${response.status} ${errorText}`)
      }

      const completion = await response.json()
      const responseContent = completion.choices[0].message.content || "I'm not sure how to respond to that."

      // Log API cost (approximate)
      const totalTokens = completion.usage?.total_tokens || 250
      const apiCost = (totalTokens / 1_000_000) * apiCostPerMillion
      await logApiCost('Chat message', 5, apiCost, userId).catch(err =>
        console.error('Failed to log API cost:', err)
      )

      // Increment message usage count
      if (userId) {
        await incrementMessageUsage(userId).catch(err => 
          console.error('Failed to increment message usage:', err)
        )
      }

      return {
        id: Math.random().toString(36).substring(2, 15),
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    } catch (apiError) {
      console.error("API error:", apiError)
      // If there's an API error, return a friendly message in Swedish
      return {
        id: Math.random().toString(36).substring(2, 15),
        content: "Jag har problem med att ansluta till mitt system just nu. Kan vi försöka igen om en stund?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    }
  } catch (error) {
    console.error("Error sending chat message:", error)
    return {
      id: Math.random().toString(36).substring(2, 15),
      content: "Ursäkta, jag har problem med anslutningen just nu. Försök igen senare.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }
}

export async function generateImageFromPrompt(characterImageUrl: string, userPrompt: string): Promise<string | null> {
  try {
    // This function would be implemented to handle the img2img generation
    // For now, we'll return a placeholder
    return null
  } catch (error) {
    console.error("Error generating image:", error)
    return null
  }
}
