"use server"

import { getApiKey } from "./db-init"
import { isAskingForImage } from "./image-utils"
import { checkMonthlyBudget, logApiCost } from "./budget-monitor"

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
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    try {
      // Get the API key for direct HTTP request - prioritize environment variables
      let apiKey = process.env.NOVITA_API_KEY || process.env.NEXT_PUBLIC_NOVITA_API_KEY
      
      // Only try database if environment variables are not available
      if (!apiKey) {
        try {
          apiKey = await getApiKey("novita_api_key")
          console.log("API key from database:", apiKey ? "Found" : "Not found")
        } catch (error) {
          console.warn("Could not fetch API key from database:", error)
        }
      } else {
        console.log("Using API key from environment variables")
      }
      console.log("Environment variables check:", {
        NEXT_PUBLIC_NOVITA_API_KEY: process.env.NEXT_PUBLIC_NOVITA_API_KEY ? `${process.env.NEXT_PUBLIC_NOVITA_API_KEY.substring(0, 10)}...` : "Not found",
        NOVITA_API_KEY: process.env.NOVITA_API_KEY ? `${process.env.NOVITA_API_KEY.substring(0, 10)}...` : "Not found"
      })
      console.log("Final API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "Not found")
      console.log("API key length:", apiKey ? apiKey.length : 0)
      console.log("API key starts with 'sk_':", apiKey ? apiKey.startsWith('sk_') : false)
      
      // Test if we can access the environment variable directly
      console.log("Direct env access test:", {
        NOVITA_API_KEY_DIRECT: process.env.NOVITA_API_KEY ? "Found" : "Not found",
        NEXT_PUBLIC_NOVITA_API_KEY_DIRECT: process.env.NEXT_PUBLIC_NOVITA_API_KEY ? "Found" : "Not found"
      })
      
      // Test all possible environment variable names
      console.log("All env vars test:", {
        NOVITA_API_KEY: process.env.NOVITA_API_KEY ? `${process.env.NOVITA_API_KEY.substring(0, 10)}...` : "Not found",
        NEXT_PUBLIC_NOVITA_API_KEY: process.env.NEXT_PUBLIC_NOVITA_API_KEY ? `${process.env.NEXT_PUBLIC_NOVITA_API_KEY.substring(0, 10)}...` : "Not found",
        NOVITA_API_KEY_LENGTH: process.env.NOVITA_API_KEY?.length || 0,
        NEXT_PUBLIC_NOVITA_API_KEY_LENGTH: process.env.NEXT_PUBLIC_NOVITA_API_KEY?.length || 0
      })
      
      if (!apiKey) {
        throw new Error("No API key found")
      }

      // Make direct HTTP request to Novita API
      const requestBody = {
        messages: apiMessages,
        model: "meta-llama/llama-3.1-8b-instruct",
        temperature: 0.7,
        max_tokens: 800,
      }
      
      console.log("Making request to Novita API with headers:", {
        Authorization: `Bearer ${apiKey.substring(0, 10)}...`,
        "Content-Type": "application/json"
      })
      console.log("Request body:", JSON.stringify(requestBody, null, 2))
      
      // First, let's test the API key with a simple models request
      console.log("Testing API key with models endpoint...")
      const testResponse = await fetch("https://api.novita.ai/openai/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })
      console.log("Models test response status:", testResponse.status)
      if (!testResponse.ok) {
        const testError = await testResponse.text()
        console.error("Models test error:", testError)
      } else {
        console.log("API key test successful!")
      }
      
      // Let's also test the chat completions endpoint with a minimal request
      console.log("Testing chat completions endpoint with minimal request...")
      const minimalRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "meta-llama/llama-3.1-8b-instruct",
      }
      
      const testChatResponse = await fetch("https://api.novita.ai/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(minimalRequest),
      })
      
      console.log("Chat completions test response status:", testChatResponse.status)
      if (!testChatResponse.ok) {
        const testChatError = await testChatResponse.text()
        console.error("Chat completions test error:", testChatError)
      } else {
        console.log("Chat completions test successful!")
      }
      
      // Use the same format that works in img2img route
      const workingRequestBody = {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: apiMessages,
        response_format: { type: "text" },
        max_tokens: 150, // Reduced from 800 to 150 for shorter responses
        temperature: 0.7,
        top_p: 1,
        min_p: 0,
        top_k: 50,
        presence_penalty: 0,
        frequency_penalty: 0.5, // Increased to discourage repetition and encourage brevity
        repetition_penalty: 1.1, // Slightly increased to reduce repetition
      }
      
      console.log("Using working request format:", JSON.stringify(workingRequestBody, null, 2))
      
      // Make the request using the working format
      console.log("Making request to Novita API with working format...")
      const response = await fetch("https://api.novita.ai/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workingRequestBody),
      })
      
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Novita API error:", response.status, errorText)
        throw new Error(`API request failed: ${response.status} ${errorText}`)
      }

      const completion = await response.json()
      const responseContent = completion.choices[0].message.content || "I'm not sure how to respond to that."

      // Log API cost (approximate)
      const totalTokens = completion.usage?.total_tokens || 250
      const apiCost = (totalTokens / 1_000_000) * 0.10 // $0.10 per 1M tokens for Llama 3.1 8B
      await logApiCost('Chat message', 5, apiCost, userId).catch(err => 
        console.error('Failed to log API cost:', err)
      )

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
