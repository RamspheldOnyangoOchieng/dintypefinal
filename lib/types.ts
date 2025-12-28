export type Character = {
  id: string
  name: string
  age: number
  image: string
  images?: string[] // Array of additional profile images
  imageUrl?: string // Alternative field name from backend
  image_url?: string // Alternative field name from backend
  videoUrl?: string // Add this field
  description: string
  personality: string
  occupation: string
  hobbies: string
  body: string
  ethnicity: string
  language: string
  relationship: string
  isNew: boolean
  createdAt: string
  systemPrompt: string
  characterType?: "Girls" | "Anime" | "Guys" | string
  category?: string
  tags?: string[]
  isPublic?: boolean
  metadata?: any
}

export type CharacterInsert = Omit<Character, "id" | "createdAt">
export type CharacterUpdate = Partial<CharacterInsert>
