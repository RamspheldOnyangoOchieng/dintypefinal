import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId, action, reason, duration } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (action === "ban") {
      // Calculate ban end date
      let bannedUntil: string | null = null
      if (duration && duration !== "permanent") {
        const now = new Date()
        if (duration === "1day") {
          now.setDate(now.getDate() + 1)
        } else if (duration === "7days") {
          now.setDate(now.getDate() + 7)
        } else if (duration === "30days") {
          now.setDate(now.getDate() + 30)
        }
        bannedUntil = now.toISOString()
      } else {
        // Permanent ban - set far future date
        bannedUntil = "2099-12-31T00:00:00Z"
      }

      // Update user ban status in custom table
      const { error: banError } = await supabaseAdmin.from("banned_users").upsert({
        user_id: userId,
        banned_at: new Date().toISOString(),
        banned_until: bannedUntil,
        reason: reason || "Banned by admin",
        is_active: true,
      }, { onConflict: "user_id" })

      if (banError) {
        console.error("Error banning user:", banError)
        return NextResponse.json(
          { success: false, error: "Failed to ban user" },
          { status: 500 }
        )
      }

      // Also try to ban in Supabase Auth (if available)
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: duration === "permanent" ? "876000h" : duration, // 100 years for permanent
        })
      } catch (authError) {
        console.warn("Could not ban in auth system:", authError)
      }

      return NextResponse.json({ success: true, message: "User banned successfully" })

    } else if (action === "unban") {
      // Remove ban
      const { error: unbanError } = await supabaseAdmin
        .from("banned_users")
        .update({ is_active: false })
        .eq("user_id", userId)

      if (unbanError) {
        console.error("Error unbanning user:", unbanError)
        return NextResponse.json(
          { success: false, error: "Failed to unban user" },
          { status: 500 }
        )
      }

      // Unban in auth system
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        })
      } catch (authError) {
        console.warn("Could not unban in auth system:", authError)
      }

      return NextResponse.json({ success: true, message: "User unbanned successfully" })

    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("User block API error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Check if user is banned
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      )
    }

    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data: banData, error } = await supabaseAdmin
      .from("banned_users")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking ban status:", error)
      return NextResponse.json(
        { success: false, error: "Failed to check ban status" },
        { status: 500 }
      )
    }

    const isBanned = banData !== null && (
      !banData.banned_until || new Date(banData.banned_until) > new Date()
    )

    return NextResponse.json({
      success: true,
      isBanned,
      banDetails: banData,
    })
  } catch (error: any) {
    console.error("Ban check error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
