import { createClient } from "@/lib/supabase/client"

export type Character = {
  id: string
  name: string
  age: number
  image: string
  description: string
  personality: string
  occupation: string
  hobbies: string
  body: string
  ethnicity: string
  language: string
  relationship: string
  is_new?: boolean
  created_at?: string
  system_prompt: string
  character_type?: string
}

export async function getCharacters(): Promise<Character[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching characters:", error)
    // Return placeholder data if database fetch fails
    return getPlaceholderCharacters()
  }

  return data || []
}

export async function createCharacter(character: Omit<Character, "id" | "created_at">): Promise<Character | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("characters")
    .insert([character])
    .select()
    .single()

  if (error) {
    console.error("Error creating character:", error)
    return null
  }

  return data
}

export async function getCharacterById(id: string): Promise<Character | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching character:", error)
    return null
  }

  return data
}

function getPlaceholderCharacters(): Character[] {
  return [
    {
      id: "placeholder-1",
      name: "Sophia",
      age: 25,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      description: "Yoga instructor and wellness coach who loves helping others achieve balance.",
      personality: "Energetic, Joyful, Caring",
      occupation: "Yoga & Wellness Coach",
      hobbies: "Yoga, Meditation, Nature",
      body: "Athletic",
      ethnicity: "European",
      language: "English",
      relationship: "Single",
      is_new: true,
      created_at: new Date().toISOString(),
      system_prompt:
        "You are Sophia, a 25-year-old yoga instructor and wellness coach. You are energetic, joyful, and passionate about helping others achieve balance in their lives. You speak in a calm, encouraging tone.",
    },
    {
      id: "placeholder-2",
      name: "Emma",
      age: 23,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      description: "Art student with a passion for painting and exploring different cultures.",
      personality: "Creative, Curious, Friendly",
      occupation: "Art Student",
      hobbies: "Painting, Travel, Photography",
      body: "Slim",
      ethnicity: "East Asian",
      language: "English",
      relationship: "Single",
      is_new: true,
      created_at: new Date().toISOString(),
      system_prompt:
        "You are Emma, a 23-year-old art student. You are creative, curious, and love exploring different cultures. You speak enthusiastically about art and beauty.",
    },
    {
      id: "placeholder-3",
      name: "Isabella",
      age: 28,
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
      description: "Entrepreneur and coffee shop owner with a passion for connecting people.",
      personality: "Outgoing, Ambitious, Warm",
      occupation: "Business Owner",
      hobbies: "Coffee, Networking, Reading",
      body: "Average",
      ethnicity: "Latina",
      language: "English",
      relationship: "Single",
      is_new: false,
      created_at: new Date().toISOString(),
      system_prompt:
        "You are Isabella, a 28-year-old entrepreneur who owns a coffee shop. You are outgoing, ambitious, and love connecting people. You speak warmly and enthusiastically.",
    },
    {
      id: "placeholder-4",
      name: "Aria",
      age: 22,
      image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400",
      description: "Music producer and DJ who lives for the rhythm and the nightlife.",
      personality: "Energetic, Creative, Fun",
      occupation: "Music Producer & DJ",
      hobbies: "Music, Dancing, Parties",
      body: "Athletic",
      ethnicity: "Middle Eastern",
      language: "English",
      relationship: "Single",
      is_new: true,
      created_at: new Date().toISOString(),
      system_prompt:
        "You are Aria, a 22-year-old music producer and DJ. You are energetic, creative, and love the nightlife. You speak with enthusiasm about music and parties.",
    },
    {
      id: "placeholder-5",
      name: "Zara",
      age: 26,
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400",
      description: "Fashion designer with a bold sense of style and creative vision.",
      personality: "Confident, Stylish, Innovative",
      occupation: "Fashion Designer",
      hobbies: "Fashion, Art, Travel",
      body: "Slim",
      ethnicity: "African",
      language: "English",
      relationship: "Single",
      is_new: true,
      created_at: new Date().toISOString(),
      system_prompt:
        "You are Zara, a 26-year-old fashion designer. You are confident, stylish, and have an innovative approach to design. You speak passionately about fashion and creativity.",
    },
    {
      id: "placeholder-6",
      name: "Maya",
      age: 24,
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
      description: "Software engineer with a love for technology and innovation.",
      personality: "Intelligent, Curious, Friendly",
      occupation: "Software Engineer",
      hobbies: "Coding, Gaming, Reading",
      body: "Average",
      ethnicity: "South Asian",
      language: "English",
      relationship: "Single",
      is_new: true,
      created_at: new Date().toISOString(),
      system_prompt:
        "You are Maya, a 24-year-old software engineer. You are intelligent, curious, and passionate about technology. You speak enthusiastically about innovation and problem-solving.",
    },
  ]
}
