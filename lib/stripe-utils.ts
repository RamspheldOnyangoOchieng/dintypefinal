import Stripe from "stripe"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { getStripeConfig } from "./integration-config"

export async function getStripeInstance() {
  try {
    // Get Stripe configuration from database or env
    const stripeConfig = await getStripeConfig()
    
    // Get the live mode setting from the database
    const supabase = await createClient()
    const { data: settingData, error: settingError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "stripe_live_mode")
      .maybeSingle()

    // Determine if we're in live mode
    // Default to false (test mode) if there's an error or no data
    const isLiveMode = settingData?.value === "true"

    console.log("Stripe mode from database:", isLiveMode ? "LIVE" : "TEST")

    // Use the secret key from integration config, fallback to env
    let stripeSecretKey = stripeConfig.secretKey
    
    // If not in integration config, fall back to old env logic
    if (!stripeSecretKey) {
      if (isLiveMode) {
        stripeSecretKey = (process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY) as string
        console.log("Using LIVE Stripe key from env")
      } else {
        stripeSecretKey = (process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY) as string
        console.log("Using TEST Stripe key from env")
      }
    } else {
      console.log("Using Stripe key from integration config")
    }

    if (!stripeSecretKey) {
      console.error("Stripe secret key is missing for mode:", isLiveMode ? "LIVE" : "TEST")
      return null
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    })
    return stripe
  } catch (error) {
    console.error("Error initializing Stripe:", error)
    return null
  }
}

export async function getStripeKeys() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  try {
    // Get Stripe configuration from integration config
    const stripeConfig = await getStripeConfig()
    
    // Get the live mode setting
    const { data: settingData, error: settingError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "stripe_live_mode")
      .maybeSingle()

    const isLiveMode = settingData?.value === "true"

    // Use publishable key from integration config first
    let publishableKey = stripeConfig.publishableKey
    
    // If not in integration config, use env
    if (!publishableKey) {
      if (isLiveMode) {
        publishableKey = (process.env.STRIPE_LIVE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) as string
      } else {
        publishableKey = (process.env.STRIPE_TEST_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) as string
      }
    }

    const { data, error } = await supabase.from("stripe_keys").select("*").single()

    if (error) {
      console.error("Error fetching Stripe keys:", error)
      return {
        liveMode: isLiveMode,
        publishableKey: publishableKey || "",
        secretKey: stripeConfig.secretKey || (isLiveMode
          ? process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ""
          : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ""),
      }
    }

    return {
      liveMode: isLiveMode,
      publishableKey: publishableKey || "",
      secretKey: stripeConfig.secretKey || (isLiveMode
        ? process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ""
        : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ""),
      ...data,
    }
  } catch (error) {
    console.error("Failed to fetch Stripe keys:", error)
    // Default to environment variables
    const isLiveMode = process.env.STRIPE_LIVE_MODE === "true"
    return {
      liveMode: isLiveMode,
      publishableKey: isLiveMode
        ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
        : process.env.STRIPE_TEST_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      secretKey: isLiveMode
        ? process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || ""
        : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "",
    }
  }
}
