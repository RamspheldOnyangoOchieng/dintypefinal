import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { getOAuthCredentials } from "@/lib/integration-config"

/**
 * This endpoint helps admins sync OAuth credentials from database to Supabase Auth
 * Note: OAuth providers must still be enabled in Supabase Dashboard
 */
export async function POST(request: Request) {
  try {
    const { provider } = await request.json()

    if (!provider || !["google", "discord", "twitter"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be google, discord, or twitter" },
        { status: 400 }
      )
    }

    const credentials = await getOAuthCredentials(provider as "google" | "discord" | "twitter")

    if (!credentials.clientId || !credentials.clientSecret) {
      return NextResponse.json(
        { 
          error: `${provider} OAuth credentials not configured`,
          configured: false 
        },
        { status: 400 }
      )
    }

    // Return the credentials status
    // Note: Actual OAuth configuration must be done in Supabase Dashboard
    return NextResponse.json({
      success: true,
      provider,
      configured: true,
      clientId: credentials.clientId,
      message: `${provider} OAuth credentials are configured in database. Please ensure the provider is enabled in Supabase Dashboard → Authentication → Providers.`,
      instructions: {
        supabaseUrl: "https://supabase.com/dashboard/project/_/auth/providers",
        steps: [
          `1. Go to Supabase Dashboard → Authentication → Providers`,
          `2. Enable ${provider} provider`,
          `3. Enter Client ID: ${credentials.clientId}`,
          `4. Enter Client Secret: ${credentials.clientSecret}`,
          `5. Add redirect URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        ],
      },
    })
  } catch (error) {
    console.error("Error syncing OAuth:", error)
    return NextResponse.json(
      { error: "Failed to sync OAuth credentials" },
      { status: 500 }
    )
  }
}

// GET - Check OAuth configuration status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get("provider")

    if (!provider || !["google", "discord", "twitter"].includes(provider)) {
      // Return status for all providers
      const google = await getOAuthCredentials("google")
      const discord = await getOAuthCredentials("discord")
      const twitter = await getOAuthCredentials("twitter")

      return NextResponse.json({
        google: {
          configured: !!(google.clientId && google.clientSecret),
          hasClientId: !!google.clientId,
          hasClientSecret: !!google.clientSecret,
        },
        discord: {
          configured: !!(discord.clientId && discord.clientSecret),
          hasClientId: !!discord.clientId,
          hasClientSecret: !!discord.clientSecret,
        },
        twitter: {
          configured: !!(twitter.clientId && twitter.clientSecret),
          hasClientId: !!twitter.clientId,
          hasClientSecret: !!twitter.clientSecret,
        },
      })
    }

    const credentials = await getOAuthCredentials(provider as "google" | "discord" | "twitter")

    return NextResponse.json({
      provider,
      configured: !!(credentials.clientId && credentials.clientSecret),
      hasClientId: !!credentials.clientId,
      hasClientSecret: !!credentials.clientSecret,
    })
  } catch (error) {
    console.error("Error checking OAuth status:", error)
    return NextResponse.json(
      { error: "Failed to check OAuth status" },
      { status: 500 }
    )
  }
}
