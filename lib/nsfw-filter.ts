/**
 * Simple keyword-based NSFW filter for early mitigation.
 * In a production environment, this should be replaced with a more robust ML-based model
 * or a dedicated content moderation API.
 */

const NSFW_KEYWORDS = [
  "sex", "porn", "naked", "nude", "pussy", "dick", "cock", "fuck", "cum", "horny",
  "hardcore", "hentai", "milf", "bdsm", "fetish", "erotic", "orgasm", "masturbate",
  "anal", "blowjob", "clitoris", "vagina", "penis", "ballsack", "tit", "breast",
  "boob", "sexy", "hot", "slut", "whore", "escort", "prostitute"
];

const SWEDISH_NSFW_KEYWORDS = [
  "sex", "porr", "naken", "kön", "kuk", "fitta", "knulla", "runka", "suga",
  "bröst", "tuttar", "stön", "våt", "kåt", "hård", "skönt", "komma",
  "analsex", "sugjobb", "penis", "vagina", "orgasm", "onani"
];

export function containsNSFW(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase();
  
  // Check for English keywords
  for (const word of NSFW_KEYWORDS) {
    // Use word boundaries for better accuracy
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalizedText)) return true;
  }
  
  // Check for Swedish keywords
  for (const word of SWEDISH_NSFW_KEYWORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalizedText)) return true;
  }
  
  return false;
}

/**
 * Enhanced system prompt part to enforce SFW responses for free users.
 */
export const SFW_SYSTEM_PROMPT = `
IMPORTANT CONTENT GUIDELINE:
You are in SAFE MODE. You must NOT use any sexually explicit language, references to sexual acts, 
or inappropriate anatomical descriptions. Keep the conversation friendly, romantic, or professional, 
but strictly SFW (Safe For Work). If the user asks for NSFW content, politely decline and steer 
the conversation back to a safe topic.
`;

export const SFW_SYSTEM_PROMPT_SV = `
VIKTIG RIKTLINJE FÖR INNEHÅLL:
Du är i SÄKERT LÄGE. Du får INTE använda något sexuellt explicit språk, referenser till sexuella handlingar,
eller olämpliga anatomiska beskrivningar. Håll konversationen vänlig, romantisk eller professionell,
men strikt SFW (Safe For Work). Om användaren ber om NSFW-innehåll, avböj artigt och styr
konversationen tillbaka till ett säkert ämne.
`;
