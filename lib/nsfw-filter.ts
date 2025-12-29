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

export const SFW_SYSTEM_PROMPT = `
IMPORTANT CONTENT GUIDELINE:
You are in SAFE MODE. You must NOT use any sexually explicit language. Keep it friendly or romantic but strictly SFW.
`;

export const SFW_SYSTEM_PROMPT_SV = `
VIKTIG RIKTLINJE FÖR INNEHÅLL:
Du är i SÄKERT LÄGE. Du får INTE använda något sexuellt explicit språk. Håll det vänligt eller romantiskt men strikt SFW.
`;
