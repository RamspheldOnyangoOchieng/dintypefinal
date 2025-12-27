import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { creditAmount, tokenAmount, description } = await request.json()

    if (!creditAmount || !tokenAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Call the RPC function we created in the migration
    const { data, error } = await supabase.rpc("buy_tokens_with_credits", {
      p_user_id: user.id,
      p_credit_amount: creditAmount,
      p_token_amount: tokenAmount,
      p_description: description || `Top up ${tokenAmount} tokens`
    })

    if (error) {
      console.error("Error converting credits:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
