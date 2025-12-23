"use server"

import { getApiKey } from "./db-init"

export type GenerateCharacterParams = {
  name?: string
  age?: number
  occupation?: string
  personality?: string
  interests?: string
}

export async function generateCharacterDescription(params: GenerateCharacterParams): Promise<string> {
  try {
    // PRIORITY: Use OPENAI_API_KEY from .env first, then fallback to NOVITA
    const openaiApiKey = process.env.OPENAI_API_KEY
    const novitaApiKey = process.env.NOVITA_API_KEY || process.env.NEXT_PUBLIC_NOVITA_API_KEY

    const useOpenAI = !!openaiApiKey
    let apiKey = openaiApiKey || novitaApiKey

    // Only try database if environment variables are not available
    if (!apiKey) {
      try {
        apiKey = await getApiKey("novita_api_key")
      } catch (error) {
        console.warn("Could not fetch API key from database:", error)
      }
    }

    if (!apiKey) {
      throw new Error("No API key found - please set OPENAI_API_KEY or NOVITA_API_KEY in .env")
    }

    const prompt = `
      Create a detailed description for an AI character with the following attributes:
      ${params.name ? `Name: ${params.name}` : ""}
      ${params.age ? `Age: ${params.age}` : ""}
      ${params.occupation ? `Occupation: ${params.occupation}` : ""}
      ${params.personality ? `Personality: ${params.personality}` : ""}
      ${params.interests ? `Interests/Hobbies: ${params.interests}` : ""}
      
      The description should be 1-2 sentences long and highlight the character's most interesting qualities.
    `

    const messages = [
      {
        role: "system",
        content: "You are a creative assistant that specializes in creating engaging character descriptions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]

    let response: Response

    if (useOpenAI) {
      // Use OpenAI API
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model: "gpt-4o-mini",
          max_tokens: 200,
        }),
      })
    } else {
      // Use Novita API (fallback)
      response = await fetch("https://api.novita.ai/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model: "meta-llama/llama-3.1-8b-instruct",
          stream: false,
        }),
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${useOpenAI ? 'OpenAI' : 'Novita'} API error:`, response.status, errorText)
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }

    const completion = await response.json()
    return completion.choices[0].message.content || "No description generated."
  } catch (error) {
    console.error("Error generating character description:", error)
    return "Error generating character description. Please try again."
  }
}

export async function generateSystemPrompt(character: {
  name: string
  age: number
  description: string
  personality: string
  occupation: string
  hobbies: string
}): Promise<string> {
  try {
    // PRIORITY: Use OPENAI_API_KEY from .env first, then fallback to NOVITA
    const openaiApiKey = process.env.OPENAI_API_KEY
    const novitaApiKey = process.env.NOVITA_API_KEY || process.env.NEXT_PUBLIC_NOVITA_API_KEY
    
    const useOpenAI = !!openaiApiKey
    let apiKey = openaiApiKey || novitaApiKey

    // Only try database if environment variables are not available
    if (!apiKey) {
      try {
        apiKey = await getApiKey("novita_api_key")
      } catch (error) {
        console.warn("Could not fetch API key from database:", error)
      }
    }

    if (!apiKey) {
      throw new Error("No API key found - please set OPENAI_API_KEY or NOVITA_API_KEY in .env")
    }

    const prompt = `
      Create a system prompt for an AI chatbot that will roleplay as the following character:
      
      Name: ${character.name}
      Age: ${character.age}
      Description: ${character.description}
      Personality: ${character.personality}
      Occupation: ${character.occupation}
      Hobbies: ${character.hobbies}
      
      The system prompt should instruct the AI on how to behave, speak, and respond as this character.
      Keep it under 200 words and focus on the character's personality, speech patterns, and knowledge areas.
    `

    const messages = [
      {
        role: "system",
        content: "You are a creative assistant that specializes in creating system prompts for AI characters.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]

    let response: Response

    if (useOpenAI) {
      // Use OpenAI API
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model: "gpt-4o-mini",
          max_tokens: 300,
        }),
      })
    } else {
      // Use Novita API (fallback)
      response = await fetch("https://api.novita.ai/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model: "meta-llama/llama-3.1-8b-instruct",
          stream: false,
        }),
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${useOpenAI ? 'OpenAI' : 'Novita'} API error:`, response.status, errorText)
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }

    const completion = await response.json()
    return completion.choices[0].message.content || "No system prompt generated."
  } catch (error) {
    console.error("Error generating system prompt:", error)
    return `You are ${character.name}, a ${character.age}-year-old ${character.occupation}. ${character.description}`
  }
}

