import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

/**
 * Robust endpoint to check the current user's premium status, token balance, and credit balance.
 * This is used to maintain real-time synchronization across the application.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        isPremium: false,
        tokenBalance: 0,
        creditBalance: 0
      })
    }

    // Check if a specific userId is requested (Admin only)
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get("userId")

    let userId = user.id

    if (requestedUserId && requestedUserId !== user.id) {
      // Check if current user is admin
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!adminUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      userId = requestedUserId
    }

    // 1. Check premium status from premium_profiles
    const { data: premiumProfile, error: premiumError } = await supabase
      .from("premium_profiles")
      .select("expires_at, plan_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (premiumError) {
      console.error("Error fetching premium profile:", premiumError)
    }

    const now = new Date()
    const expiresAt = premiumProfile?.expires_at ? new Date(premiumProfile.expires_at) : null
    const isPremium = expiresAt ? expiresAt > now : false
    const isExpired = expiresAt ? expiresAt <= now : false
    const wasPremium = !!premiumProfile

    // 2. Get token balance
    const { data: tokenData } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    const tokenBalance = (tokenData as any)?.balance || 0

    // 3. Get credit balance
    const { data: creditData } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    const creditBalance = (creditData as any)?.balance || 0

    return NextResponse.json({
      success: true,
      authenticated: true,
      userId,
      isPremium,
      isExpired,
      wasPremium,
      expiresAt: premiumProfile?.expires_at || null,
      planId: (premiumProfile as any)?.plan_id || null,
      tokenBalance,
      creditBalance
    })
  } catch (error) {
    console.error("Server error checking premium status:", error)
    return NextResponse.json(
      {
        authenticated: false,
        isPremium: false,
        error: "server_error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
