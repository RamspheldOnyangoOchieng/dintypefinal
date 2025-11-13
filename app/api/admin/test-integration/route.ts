import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import Stripe from "stripe"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get("service")

    if (!service) {
      return NextResponse.json({ error: "Service parameter required" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Get configuration from database
    const { data, error } = await supabase
      .from("system_integrations")
      .select("key, value")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const config: Record<string, string> = {}
    data?.forEach((item) => {
      config[item.key] = item.value || ""
    })

    // Test connection based on service
    switch (service.toLowerCase()) {
      case "stripe":
        return await testStripe(config.stripe_webhook_secret)
      
      case "google":
        return await testOAuth("google", config.google_oauth_client_id, config.google_oauth_client_secret)
      
      case "discord":
        return await testOAuth("discord", config.discord_oauth_client_id, config.discord_oauth_client_secret)
      
      case "twitter":
        return await testOAuth("twitter", config.twitter_oauth_client_id, config.twitter_oauth_client_secret)
      
      case "email":
        return await testEmail(config.email_provider, config.email_api_key, config.email_from_address)
      
      default:
        return NextResponse.json({ error: "Unknown service" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error testing integration:", error)
    return NextResponse.json(
      { error: "Test failed" },
      { status: 500 }
    )
  }
}

async function testStripe(webhookSecret: string) {
  if (!webhookSecret || !webhookSecret.startsWith("whsec_")) {
    return NextResponse.json({
      success: false,
      error: "Invalid webhook secret format. Should start with 'whsec_'",
    })
  }

  // Basic validation - webhook secrets are always 64 characters after whsec_
  if (webhookSecret.length < 20) {
    return NextResponse.json({
      success: false,
      error: "Webhook secret too short",
    })
  }

  return NextResponse.json({
    success: true,
    message: "Webhook secret format is valid",
  })
}

async function testOAuth(provider: string, clientId: string, clientSecret: string) {
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      success: false,
      error: `Missing ${provider} OAuth credentials`,
    })
  }

  // Basic validation
  if (clientId.length < 10 || clientSecret.length < 10) {
    return NextResponse.json({
      success: false,
      error: "Credentials appear to be invalid",
    })
  }

  return NextResponse.json({
    success: true,
    message: `${provider} OAuth credentials format is valid`,
  })
}

async function testEmail(provider: string, apiKey: string, fromAddress: string) {
  if (!apiKey || !fromAddress) {
    return NextResponse.json({
      success: false,
      error: "Missing email configuration",
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(fromAddress)) {
    return NextResponse.json({
      success: false,
      error: "Invalid email address format",
    })
  }

  // Validate API key format
  if (provider === "resend" && !apiKey.startsWith("re_")) {
    return NextResponse.json({
      success: false,
      error: "Invalid Resend API key format. Should start with 're_'",
    })
  }

  if (provider === "sendgrid" && !apiKey.startsWith("SG.")) {
    return NextResponse.json({
      success: false,
      error: "Invalid SendGrid API key format. Should start with 'SG.'",
    })
  }

  return NextResponse.json({
    success: true,
    message: `${provider} configuration format is valid`,
  })
}
