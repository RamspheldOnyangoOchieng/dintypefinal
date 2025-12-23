import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ authenticated: false, isAdmin: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check admin_users table first
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    // Fallback: check profiles.is_admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()

    const isAdmin = !!adminUser || profile?.is_admin === true

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      userId: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ authenticated: false, isAdmin: false, error: "Server error" }, { status: 500 })
  }
}
