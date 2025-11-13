import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    await cookies()
    const supabaseAdmin = await createAdminClient()
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Failed to initialize admin client" },
        { status: 500 }
      )
    }

    const { userId, isAdmin } = await request.json()

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { success: false, error: "User ID and admin status are required" },
        { status: 400 }
      )
    }

    if (isAdmin) {
      // Add user to admin_users table
      const { error } = await supabaseAdmin.from("admin_users").upsert(
        {
          user_id: userId,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

      if (error) {
        console.error("Error promoting user to admin:", error)
        return NextResponse.json(
          { success: false, error: error.message || "Failed to promote user" },
          { status: 500 }
        )
      }

      console.log(`✅ User ${userId} promoted to admin`)
    } else {
      // Remove user from admin_users table
      const { error } = await supabaseAdmin
        .from("admin_users")
        .delete()
        .eq("user_id", userId)

      if (error) {
        console.error("Error removing admin status:", error)
        return NextResponse.json(
          { success: false, error: error.message || "Failed to remove admin status" },
          { status: 500 }
        )
      }

      console.log(`✅ User ${userId} removed from admin`)
    }

    return NextResponse.json({
      success: true,
      message: isAdmin ? "User promoted to admin" : "Admin status removed",
    })
  } catch (error: any) {
    console.error("Error in update-admin-status:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
