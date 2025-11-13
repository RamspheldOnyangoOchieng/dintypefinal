import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get("id")
  const userId = searchParams.get("userId")

  if (!invoiceId && !userId) {
    return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    let query = supabase
      .from("payment_transactions")
      .select(`
        *,
        subscription_plans (
          name,
          duration,
          original_price,
          discounted_price
        )
      `)

    if (invoiceId) {
      query = query.eq("id", invoiceId).single()
    } else if (userId) {
      query = query.eq("user_id", userId).order("created_at", { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching invoices:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoices: Array.isArray(data) ? data : [data] })
  } catch (error: any) {
    console.error("Invoice API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
