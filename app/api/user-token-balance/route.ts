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
    const { data, error } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", finalUserId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching token balance:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch token balance" }, { status: 500 })
    }

    const balance = data?.balance ?? 0
    return NextResponse.json({ success: true, balance })
  } catch (error) {
    console.error("Error fetching token balance:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch token balance" }, { status: 500 })
  }
}
