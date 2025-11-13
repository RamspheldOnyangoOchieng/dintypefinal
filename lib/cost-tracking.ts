// Cost configuration for different actions
export const ACTION_COSTS = {
  // Chat/Message costs
  CHAT_MESSAGE: 5, // tokens per message
  CHAT_MESSAGE_GPT4: 10, // tokens per GPT-4 message
  CHAT_IMAGE_GENERATION: 50, // tokens per image generated in chat
  
  // Character creation costs
  CHARACTER_CREATE: 25, // tokens to create a character
  CHARACTER_IMAGE_GENERATE: 100, // tokens to generate character image
  CHARACTER_UPDATE: 10, // tokens to update character details
  
  // Image generation costs
  IMAGE_GENERATE_SD: 75, // Stable Diffusion image
  IMAGE_GENERATE_DALLE: 150, // DALL-E image
  IMAGE_UPSCALE: 50, // Image upscaling
  IMAGE_VARIATION: 60, // Image variation
  
  // Voice/TTS costs
  TTS_GENERATION: 10, // tokens per TTS generation
  VOICE_CLONE: 200, // tokens to clone a voice
  
  // Collection costs
  COLLECTION_CREATE: 5, // tokens to create collection
  COLLECTION_SHARE: 2, // tokens to share collection
} as const

export type ActionType = keyof typeof ACTION_COSTS

export interface CostLog {
  userId: string
  actionType: ActionType
  cost: number
  timestamp: Date
  metadata?: Record<string, any>
}

// Track usage cost
export async function trackCost(log: CostLog): Promise<void> {
  try {
    // Log to database
    const response = await fetch("/api/track-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    })

    if (!response.ok) {
      console.error("Failed to track cost:", await response.text())
    }
  } catch (error) {
    console.error("Error tracking cost:", error)
  }
}

// Calculate cost for an action
export function calculateCost(actionType: ActionType, quantity: number = 1): number {
  return ACTION_COSTS[actionType] * quantity
}

// Get cost for display
export function getCostDisplay(actionType: ActionType): string {
  const cost = ACTION_COSTS[actionType]
  return `${cost} tokens`
}
