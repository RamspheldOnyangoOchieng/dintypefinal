import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { userId, actionType, cost, metadata } = await request.json()

    if (!userId || !actionType || cost === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert cost log
    const { error: logError } = await supabase.from("cost_logs").insert({
      user_id: userId,
      action_type: actionType,
      cost,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    })

    if (logError) {
      console.error("Error logging cost:", logError)
      return NextResponse.json(
        { success: false, error: "Failed to log cost" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Cost tracking error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const actionType = searchParams.get("actionType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const supabase = await createClient()

    let query = supabase
      .from("cost_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (actionType) {
      query = query.eq("action_type", actionType)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching cost logs:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch cost logs" },
        { status: 500 }
      )
    }

    // Calculate total cost
    const totalCost = data?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0

    return NextResponse.json({
      success: true,
      logs: data || [],
      totalCost,
    })
  } catch (error: any) {
    console.error("Cost tracking fetch error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
