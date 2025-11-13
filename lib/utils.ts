import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatSEK } from "./currency"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "N/A"

  const d = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

/**
 * Format currency in Swedish Krona (SEK)
 * @param amount - Amount in Swedish Krona
 * @returns Formatted string like "99 kr" or "1 499 kr"
 * @deprecated Use formatSEK from @/lib/currency instead
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "N/A"
  return formatSEK(amount)
}
