import { createAdminClient } from "./supabase-admin"

// Cache for integration settings (5 minute TTL)
let integrationCache: Record<string, string> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get integration settings from database
 * Results are cached for 5 minutes to reduce database queries
 */
export async function getIntegrationSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (integrationCache && now - cacheTimestamp < CACHE_TTL) {
    return integrationCache
  }

  try {
    const supabase = await createAdminClient()
    
    if (!supabase) {
      console.error("Failed to create admin client for integration settings")
      return {}
    }

    const { data, error } = await supabase
      .from("system_integrations")
      .select("key, value")

    if (error) {
      console.error("Error fetching integration settings:", error)
      return {}
    }

    const config: Record<string, string> = {}
    data?.forEach((item) => {
      config[item.key] = item.value || ""
    })

    // Update cache
    integrationCache = config
    cacheTimestamp = now

    return config
  } catch (error) {
    console.error("Error getting integration settings:", error)
    return {}
  }
}

/**
 * Get a specific integration value
 * Falls back to environment variable if database value is empty
 */
export async function getIntegrationValue(
  key: string,
  fallbackEnvVar?: string
): Promise<string> {
  const settings = await getIntegrationSettings()
  const dbValue = settings[key]

  // Return database value if it exists
  if (dbValue) {
    return dbValue
  }

  // Fallback to environment variable
  if (fallbackEnvVar && process.env[fallbackEnvVar]) {
    return process.env[fallbackEnvVar] as string
  }

  return ""
}

/**
 * Clear the integration cache (useful after updates)
 */
export function clearIntegrationCache() {
  integrationCache = null
  cacheTimestamp = 0
}

/**
 * Get Stripe configuration (API keys and webhook secret)
 */
export async function getStripeConfig(): Promise<{
  secretKey: string
  publishableKey: string
  webhookSecret: string
}> {
  const settings = await getIntegrationSettings()

  return {
    secretKey: settings.stripe_secret_key || process.env.STRIPE_SECRET_KEY || "",
    publishableKey: settings.stripe_publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: settings.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || "",
  }
}

/**
 * Get Stripe webhook secret (from DB or env)
 */
export async function getStripeWebhookSecret(): Promise<string> {
  return getIntegrationValue("stripe_webhook_secret", "STRIPE_WEBHOOK_SECRET")
}

/**
 * Get Stripe secret key (from DB or env)
 */
export async function getStripeSecretKey(): Promise<string> {
  return getIntegrationValue("stripe_secret_key", "STRIPE_SECRET_KEY")
}

/**
 * Get Stripe publishable key (from DB or env)
 */
export async function getStripePublishableKey(): Promise<string> {
  return getIntegrationValue("stripe_publishable_key", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
}

/**
 * Get OAuth credentials for a provider
 */
export async function getOAuthCredentials(
  provider: "google" | "discord" | "twitter"
): Promise<{ clientId: string; clientSecret: string }> {
  const settings = await getIntegrationSettings()

  return {
    clientId: settings[`${provider}_oauth_client_id`] || "",
    clientSecret: settings[`${provider}_oauth_client_secret`] || "",
  }
}

/**
 * Get email service configuration
 */
export async function getEmailConfig(): Promise<{
  provider: string
  apiKey: string
  fromAddress: string
  fromName: string
}> {
  const settings = await getIntegrationSettings()

  return {
    provider: settings.email_provider || process.env.EMAIL_PROVIDER || "resend",
    apiKey: settings.email_api_key || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || "",
    fromAddress: settings.email_from_address || process.env.FROM_EMAIL || "",
    fromName: settings.email_from_name || process.env.NEXT_PUBLIC_SITE_NAME || "App",
  }
}
