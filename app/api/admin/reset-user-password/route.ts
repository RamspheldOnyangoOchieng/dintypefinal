import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

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

    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json(
        { success: false, error: "User ID and new password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Reset user password using Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error("Error resetting user password:", error)
      return NextResponse.json(
        { success: false, error: error.message || "Failed to reset password" },
        { status: 500 }
      )
    }

    console.log(`✅ Password reset for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error: any) {
    console.error("Error in reset-user-password:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
