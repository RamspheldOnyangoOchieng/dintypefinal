import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  let finalUserId = userId
  if (!finalUserId) {
    // Fallback to authenticated user if no userId param
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    finalUserId = user.id
  }

  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", finalUserId)
      .maybeSingle()

    const { data: creditData, error: creditError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", finalUserId)
      .maybeSingle()

    if (tokenError || creditError) {
      console.error("Error fetching balances:", tokenError || creditError)
      return NextResponse.json({ success: false, error: "Failed to fetch balance" }, { status: 500 })
    }

    const tokenBalance = (tokenData as any)?.balance ?? 0
    const creditBalance = (creditData as any)?.balance ?? 0
    
    return NextResponse.json({ success: true, balance: tokenBalance, creditBalance })
  } catch (error) {
    console.error("Error fetching balance:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch balance" }, { status: 500 })
  }
}
