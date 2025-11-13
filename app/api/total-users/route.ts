import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { cookies } from "next/headers"

export async function GET() {
  await cookies()
  const supabase = await createAdminClient()
  
  if (!supabase) {
    return NextResponse.json({ error: "Failed to create Supabase admin client" }, { status: 500 })
  }

  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error fetching total users:", error)
      return NextResponse.json({ error: "Failed to fetch total users" }, { status: 500 })
    }

    return NextResponse.json({ totalUsers: count || 0 })
  } catch (error) {
    console.error("Error in total-users endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
