/**
 * Swedish Krona (SEK) Currency Formatting Utilities
 * 
 * Provides consistent currency formatting across the application
 * following Swedish conventions.
 */

/**
 * Format a price in Swedish Krona
 * 
 * Swedish conventions:
 * - Space as thousands separator: 1 499 kr
 * - No decimal places for whole numbers: 99 kr
 * - Currency symbol after amount: 99 kr (not kr 99)
 * 
 * @param amount - The amount in SEK
 * @param options - Formatting options
 * @returns Formatted price string
 * 
 * @example
 * formatSEK(99) // "99 kr"
 * formatSEK(1499) // "1 499 kr"
 * formatSEK(249.50) // "249,50 kr"
 */
export function formatSEK(
  amount: number,
  options: {
    includeDecimals?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { includeDecimals = false, compact = false } = options;

  // Use Swedish locale for number formatting
  const formatted = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);

  // Return with " kr" suffix (space before kr)
  return compact ? `${formatted}kr` : `${formatted} kr`;
}

/**
 * Format token package price with equivalent images
 * 
 * @example
 * formatTokenPackagePrice(200, 99) // "99 kr (200 tokens, ~40 images)"
 */
export function formatTokenPackagePrice(tokens: number, price: number): {
  price: string;
  tokens: string;
  images: string;
  full: string;
} {
  const images = Math.floor(tokens / 5); // Assuming 5 tokens per image
  
  return {
    price: formatSEK(price),
    tokens: `${tokens} tokens`,
    images: `~${images} images`,
    full: `${formatSEK(price)} (${tokens} tokens, ~${images} images)`
  };
}

/**
 * Format subscription price
 * 
 * @example
 * formatSubscriptionPrice(119) // "119 kr/månad"
 */
export function formatSubscriptionPrice(
  price: number,
  period: 'month' | 'year' = 'month'
): string {
  const periodText = period === 'month' ? '/månad' : '/år';
  return `${formatSEK(price)}${periodText}`;
}

/**
 * Parse price from database (handles both number and string)
 */
export function parsePrice(price: any): number {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') return parseFloat(price);
  return 0;
}

/**
 * Get currency symbol
 */
export const CURRENCY_SYMBOL = 'kr';
export const CURRENCY_CODE = 'SEK';
export const CURRENCY_NAME = 'Svenska kronor';

/**
 * Premium subscription pricing constants
 */
export const PRICING = {
  PREMIUM_MONTHLY_SEK: 119,
  PREMIUM_MONTHLY_FORMATTED: '119 kr/månad',
  
  TOKEN_PACKAGES: {
    SMALL: { tokens: 200, price: 99, images: 40 },
    MEDIUM: { tokens: 550, price: 249, images: 110 },
    LARGE: { tokens: 1550, price: 499, images: 310 },
    MEGA: { tokens: 5800, price: 1499, images: 1160 },
  },
} as const;

/**
 * Format price for Stripe (convert to öre - smallest currency unit)
 * Stripe expects amounts in the smallest currency unit (öre for SEK)
 * 1 kr = 100 öre
 * 
 * @example
 * toStripeAmount(99) // 9900 (öre)
 */
export function toStripeAmount(amountInKr: number): number {
  return Math.round(amountInKr * 100);
}

/**
 * Format price from Stripe (convert from öre to kr)
 * 
 * @example
 * fromStripeAmount(9900) // 99
 */
export function fromStripeAmount(amountInOre: number): number {
  return amountInOre / 100;
}

/**
 * Format price range
 * 
 * @example
 * formatPriceRange(99, 1499) // "99-1 499 kr"
 */
export function formatPriceRange(min: number, max: number): string {
  return `${formatSEK(min, { includeDecimals: false }).replace(' kr', '')}-${formatSEK(max)}`;
}
