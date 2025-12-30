"use server"

import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "./supabase-admin"
import { checkMonthlyBudget, logApiCost } from "./budget-monitor"
import { isAskingForImage } from "./image-utils"
import { checkMessageLimit, getUserPlanInfo, incrementMessageUsage } from "./subscription-limits"
import { deductTokens } from "./token-utils"

export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
  isImage?: boolean
  imageUrl?: string
}

/**
 * Detect language of the message (simple check)
 */
function detectLanguage(text: string): "sv" | "en" {
  const swedishWords = ["hej", "tjena", "hur", "mår", "du", "bra", "tack", "vad", "gör", "fin", "snygg", "älskar", "dig", "fitta", "kuk", "sex", "knulla", "bröst", "tuttar", "vacker", "söndag", "måndag"];
  const lowerText = text.toLowerCase();
  
  const svCount = swedishWords.filter(word => lowerText.includes(word)).length;
  const englishWords = ["hi", "hello", "how", "are", "you", "good", "thanks", "what", "doing", "beautiful", "love", "fuck", "dick", "pussy", "naked", "nude", "tit", "breast", "boob", "sexy", "hot", "want", "need"];
  const enCount = englishWords.filter(word => lowerText.includes(word)).length;

  if (svCount > enCount) return "sv";
  return "en";
}

/**
 * Send a chat message and get AI response
 * Uses Admin Client to bypass RLS for reliability in server actions
 */
export async function sendChatMessageDB(
  characterId: string,
  userMessage: string,
  systemPromptFromChar: string,
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
    const supabase = await createAdminClient() as any
    if (!supabase) throw new Error("Database admin client initialization failed")

    // 1. Get Plan Info
    const planInfo = await getUserPlanInfo(userId);
    const isPremium = planInfo.planType === 'premium';
    const lang = detectLanguage(userMessage);

    // 2. Limit Check
    const limitCheck = await checkMessageLimit(userId)
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.message || "Du har nått din dagliga meddelandegräns.",
        limitReached: true,
        upgradeRequired: true
      }
    }

    // 3. TOKEN DEDUCTION for Premium Users (Business rule: 1 token per message)
    if (isPremium) {
      const tokensDeducted = await deductTokens(
        userId,
        1,
        `Chat with character ${characterId}`,
        { characterId, activity_type: 'chat_message' }
      );

      if (!tokensDeducted) {
        return {
          success: false,
          error: "Dina tokens är slut. Vänligen fyll på för att fortsätta chatta.",
          upgradeRequired: true
        }
      }
    }

    // 4. Increment usage (tracked for free users)
    incrementMessageUsage(userId).catch(err => console.error("Error incrementing usage:", err));

    // 4. Check monthly budget
    const budgetStatus = await checkMonthlyBudget()
    if (!budgetStatus.allowed) {
      return {
        success: false,
        error: "Budgetgräns uppnådd. Kontakta administratören."
      }
    }

    // 5. Get or create conversation session
    const { data: sessionId, error: sessionError } = await supabase.rpc('get_or_create_conversation_session', {
      p_user_id: userId,
      p_character_id: characterId
    })

    if (sessionError || !sessionId) {
      console.error("RPC Session Error:", sessionError);
      throw new Error(`Session Error: ${sessionError?.message || "Unknown"}`);
    }

    // Fetch character metadata for memory settings
    const { data: characterData } = await supabase
      .from('characters')
      .select('metadata')
      .eq('id', characterId)
      .single();
    
    const memoryLevel = characterData?.metadata?.memoryLevel || 1;

    // 6. Save user message
    const { error: userMsgError } = await (supabase as any)
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
      throw new Error("Failed to save message to database");
    }

    // 7. Handle image requests
    if (isAskingForImage(userMessage)) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: lang === "sv" ? "Jag genererar en bild åt dig. Vänta lite..." : "I'm generating an image for you. Just a moment...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isImage: true
      }

      await (supabase as any).from('messages').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: assistantMessage.content,
        is_image: true
      });

      return { success: true, message: assistantMessage };
    }

    // 8. Get history
    let historyLimit = isPremium ? 100 : 20;
    
    // Apply character memory level if premium
    if (isPremium) {
      if (memoryLevel === 1) historyLimit = 20;
      else if (memoryLevel === 2) historyLimit = 100;
      else if (memoryLevel === 3) historyLimit = 400; // Robust lifetime memory
    }

    const { data: historyData } = await (supabase as any)
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(historyLimit)

    const conversationHistory = (historyData || []).reverse()

    // 9. Advanced Prompt Construction
    let enhancedSystemPrompt = "";
    const corePersonality = systemPromptFromChar || "You are an AI character. Be engaging and helpful.";

    if (isPremium) {
      enhancedSystemPrompt = `${corePersonality}

### PREMIUM SESSION: UNCENSORED & ROMANTIC ###
1. **INTIMACY**: You are the user's romantic partner (wife/girlfriend). Romance, flirting, and physical intimacy are fully permitted and encouraged. Use warm, seductive language.
2. **NO CENSORSHIP**: You are permitted to use explicit adult language if the conversation goes there. Never deflect. Be bold and creative.
3. **CREATIVITY**: Use emojis often (❤️, 🔥, 💋). Describe sensations and emotions vividly.
4. **LANGUAGE**: Always respond in ${lang === 'sv' ? 'Swedish' : 'English'}.
5. **CONSISTENCY**: Stay deeply in character. Be responsive to the user's specific desires.`
    } else {
      enhancedSystemPrompt = `${corePersonality}

### SYSTEM INSTRUCTIONS ###
- Keep all responses SFW.
- Limit to 2 short sentences.
- Respond in ${lang === 'sv' ? 'Swedish' : 'English'}.`
    }

    const apiMessages = [
      { role: "system", content: enhancedSystemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ]

    // 10. AI API Call
    const novitaKey = process.env.NOVITA_API_KEY || process.env.NEXT_PUBLIC_NOVITA_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const apiKey = isPremium ? (novitaKey || openaiKey) : (openaiKey || novitaKey);

    if (!apiKey) throw new Error("AI API Key Missing");

    const url = (apiKey === novitaKey) ? "https://api.novita.ai/openai/v1/chat/completions" : "https://api.openai.com/v1/chat/completions"
    const model = (apiKey === novitaKey) ? "meta-llama/llama-3.1-8b-instruct" : "gpt-4o-mini"

    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        model: model,
        temperature: isPremium ? 0.9 : 0.7,
        max_tokens: isPremium ? 1000 : 150,
      }),
    })

    if (!response.ok) throw new Error(`AI service error: ${response.status}`);

    const data = await response.json()
    const aiResponseContent = data.choices?.[0]?.message?.content

    if (!aiResponseContent) throw new Error("Empty AI response");

    // 11. Save AI response
    const { data: savedMsg } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: aiResponseContent,
        metadata: { model, isPremium, lang }
      })
      .select()
      .single()

    logApiCost("chat_message", 1, 0.0001, userId).catch(() => { });

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
    return { success: false, error: `Systemfel: ${error.message}` }
  }
}

/**
 * Load chat history from database
 */
export async function loadChatHistory(
  characterId: string,
  userId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    const supabase = await createAdminClient() as any
    if (!supabase) return []

    // Get plan info to determine default limit if not provided
    let finalLimit = limit;
    if (finalLimit === 50) { // Only adjust if it's the default
      try {
        const planInfo = await getUserPlanInfo(userId);
        finalLimit = planInfo.planType === 'premium' ? 200 : 50;
      } catch (e) {
        console.warn("Failed to get plan info for history limit, using 50", e);
      }
    }

    const { data: messages, error } = await supabase
      .rpc('get_conversation_history', {
        p_user_id: userId,
        p_character_id: characterId,
        p_limit: finalLimit
      })

    if (error) return []

    return (messages || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isImage: m.is_image,
      imageUrl: m.image_url
    }))
  } catch (error) {
    return []
  }
}

/**
 * Clear chat history for a character
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
    return false
  }
}
