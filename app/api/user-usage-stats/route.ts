import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  // Try token-based authentication first
  const authHeader = request.headers.get('authorization')
  const userIdHeader = request.headers.get('x-user-id')

  let userId: string | null = null

  // Create supabase client (await the async function)
  const supabase = await createClient()

  // Method 1: Try Authorization header (JWT token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)

      if (!authError && user) {
        userId = user.id
        console.log("✅ User authenticated via token for usage stats")
      }
    } catch (error) {
      console.error("❌ Token authentication failed for usage stats:", error)
    }
  }

  // Method 2: Try session-based authentication
  if (!userId) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!authError && user) {
        userId = user.id
        console.log("✅ User authenticated via session for usage stats")
      }
    } catch (error) {
      console.error("❌ Session authentication failed for usage stats:", error)
    }
  }

  // Method 3: Fallback to User ID header (Use Admin Client for verification)
  if (!userId && userIdHeader) {
    try {
      const { createAdminClient } = await import("@/lib/supabase-admin")
      const adminClient = await createAdminClient()

      if (adminClient) {
        const { data: userData, error: userError } = await adminClient
          .from('profiles') // Changed from users_view to profiles as it's more standard
          .select('id')
          .eq('id', userIdHeader)
          .single()

        if (!userError && userData) {
          userId = userIdHeader
          console.log("✅ User authenticated via user ID for usage stats (verified via admin)")
        } else if (userError) {
          console.error("❌ User ID validation failed for usage stats:", userError.message)
        }
      }
    } catch (error) {
      console.error("❌ User ID validation exception for usage stats:", error)
    }
  }

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // Use admin client if we authenticated via User ID, otherwise use regular client
  // This ensures we can bypass RLS if we've already verified the user's ID
  const { createAdminClient } = await import("@/lib/supabase-admin")
  const adminClient = await createAdminClient()
  const dbSupabase = (userIdHeader && userId === userIdHeader && adminClient) ? adminClient : supabase

  try {
    // Get total images generated
    const { count: imagesGenerated, error: imagesError } = await dbSupabase
      .from("generated_images")
      .select("*", { count: "exact" })
      .eq("user_id", userId)

    if (imagesError) {
      console.error("Error fetching images count:", imagesError)
    }

    // Get total tokens spent
    const { data: tokensData, error: tokensError } = await dbSupabase
      .from("token_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "usage")
      .order("created_at", { ascending: false })

    if (tokensError) {
      console.error("Error fetching token usage:", tokensError)
    }

    // Calculate total tokens spent (absolute value since usage is negative)
    const tokensSpent = tokensData?.reduce((total: number, tx: any) => total + Math.abs(tx.amount), 0) || 0

    // Get last generation time
    const { data: lastGeneration, error: lastGenError } = await dbSupabase
      .from("generated_images")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (lastGenError && lastGenError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.error("Error fetching last generation:", lastGenError)
    }

    // Format last generation time
    let lastGenerationTime = "Never"
    if (lastGeneration?.created_at) {
      const date = new Date(lastGeneration.created_at)
      lastGenerationTime = date.toLocaleString()
    }

    return NextResponse.json({
      success: true,
      imagesGenerated: imagesGenerated || 0,
      tokensSpent,
      lastGeneration: lastGenerationTime,
    })
  } catch (error) {
    console.error("Error fetching user usage stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch usage stats" }, { status: 500 })
  }
}
