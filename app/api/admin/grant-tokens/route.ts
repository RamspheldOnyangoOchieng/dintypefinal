import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { isUserAdmin } from "@/lib/admin-auth"

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient()
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
        }

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if the user is an admin
        const adminStatus = await isUserAdmin(supabase, user.id)
        if (!adminStatus) {
            return NextResponse.json({ error: "Forbidden: Only admins can use this endpoint" }, { status: 403 })
        }

        const body = await request.json()
        const { tokenAmount, description } = body

        if (!tokenAmount || typeof tokenAmount !== 'number' || tokenAmount <= 0) {
            return NextResponse.json({ error: "Invalid token amount" }, { status: 400 })
        }

        // Grant tokens to the admin user using the specialized RPC
        const { error: updateError } = await supabase.rpc('admin_add_tokens', {
            p_user_id: user.id,
            p_amount: tokenAmount,
            p_description: description || "Admin self-grant"
        })

        if (updateError) {
            console.error("Error granting tokens:", updateError)
            return NextResponse.json({ error: "Failed to grant tokens" }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: `${tokenAmount} tokens granted to admin` })
    } catch (error: any) {
        console.error("Admin grant error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
