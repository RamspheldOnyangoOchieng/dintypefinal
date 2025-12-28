import { Message } from "./chat-actions"

/**
 * Saves a chat message to the database via the API
 */
export async function saveMessageToDatabase(characterId: string, message: Message): Promise<boolean> {
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        characterId,
        content: message.content,
        role: message.role,
      }),
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error("Error saving message to database:", error)
    return false
  }
}

/**
 * Fetches chat history from the database for a character
 */
export async function getChatHistoryFromDatabase(characterId: string): Promise<Message[]> {
  try {
    const response = await fetch(`/api/messages?characterId=${characterId}`)
    const data = await response.json()
    
    if (data.success && data.messages) {
      return data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isImage: msg.is_image,
        imageUrl: msg.image_url,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching chat history from database:", error)
    return []
  }
}
