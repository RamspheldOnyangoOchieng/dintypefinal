import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

// Removed in-memory cache to ensure real-time status updates after payment

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated using getUser() (more secure)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ authenticated: false, isPremium: false, tokenBalance: 0 }, { status: 200 })
    }

    const userId = user.id


    // Check premium_profiles table for active premium status
    const { data: premiumProfile, error: premiumError } = await supabase
      .from("premium_profiles")
      .select("expires_at")
      .eq("user_id", userId)
      .maybeSingle()

    let isPremium = false

    if (premiumProfile && !premiumError) {
      // Check if premium has not expired
      const expiresAt = new Date((premiumProfile as any).expires_at)
      isPremium = expiresAt > new Date()
    }

    // Get token balance
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    const tokenBalance = (tokenData as any)?.balance || 0

    // Get credit balance
    const { data: creditData, error: creditError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    const creditBalance = (creditData as any)?.balance || 0

    // Update profile.is_premium to match premium_profiles status
    try {
      await supabase
        .from("profiles")
        .upsert({ id: userId, is_premium: isPremium } as any, { onConflict: "id" })
    } catch (e) {
      // Ignore profile update errors
      console.log("Profile update skipped:", e)
    }

    const response = {
      authenticated: true,
      isPremium,
      tokenBalance,
      creditBalance,
    }


    return NextResponse.json(response)
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: "server_error",
        message: error instanceof Error ? error.message : "Unknown error",
        isPremium: false,
        tokenBalance: 0,
        creditBalance: 0,
      },
      { status: 200 },
    )
  }
}
