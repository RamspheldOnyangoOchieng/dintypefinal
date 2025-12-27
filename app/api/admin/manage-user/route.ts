import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { isUserAdmin } from "@/lib/admin-auth"

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient()
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
        }

        // Get the current user (admin)
        const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser()

        if (userError || !adminUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if the user is an admin
        const adminStatus = await isUserAdmin(supabase, adminUser.id)
        if (!adminStatus) {
            return NextResponse.json({ error: "Forbidden: Only admins can use this endpoint" }, { status: 403 })
        }

        const body = await request.json()
        const { userId, action, amount, planId, status, expiresAt } = body

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 })
        }

        // Initialize admin client for sensitive operations
        const { createAdminClient } = await import("@/lib/supabase-admin")
        const supabaseAdmin = await createAdminClient()
        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Failed to initialize admin client" }, { status: 500 })
        }

        if (action === "grant-tokens") {
            if (typeof amount !== 'number' || amount === 0) {
                return NextResponse.json({ error: "Invalid token amount" }, { status: 400 })
            }

            const description = body.description || `Admin manual adjustment by ${adminUser.email}`

            const { error: updateError } = await supabaseAdmin.rpc('admin_add_tokens', {
                p_user_id: userId,
                p_amount: amount,
                p_description: description
            })

            if (updateError) {
                console.error("Error granting tokens:", updateError)
                return NextResponse.json({ error: updateError.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, message: `Tokens updated for user ${userId}` })
        }

        if (action === "update-subscription") {
            // Update premium_profiles
            const subscriptionData: any = {
                user_id: userId,
                status: status || 'active',
                updated_at: new Date().toISOString()
            }

            if (planId) subscriptionData.plan_id = planId
            if (expiresAt) {
                subscriptionData.current_period_end = expiresAt
                // Also set legacy field if it exists
                subscriptionData.expires_at = expiresAt
            }

            const { error: subError } = await supabaseAdmin
                .from('premium_profiles')
                .upsert(subscriptionData, { onConflict: 'user_id' })

            if (subError) {
                console.error("Error updating subscription:", subError)
                return NextResponse.json({ error: subError.message }, { status: 500 })
            }

            // Sync with profiles table
            const isPremium = (status === 'active' || !status)
            await supabaseAdmin
                .from('profiles')
                .update({ is_premium: isPremium } as any)
                .eq('id', userId)

            // Log activity
            const { logActivity } = await import("@/lib/activity")
            await logActivity({
                userId,
                type: 'subscription_upgrade',
                description: `Admin manual subscription update: ${status || 'active'} (Plan: ${planId || 'standard'})`,
                metadata: { admin_id: adminUser.id, status, planId, expiresAt }
            })

            return NextResponse.json({ success: true, message: `Subscription updated for user ${userId}` })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error: any) {
        console.error("Admin manage-user error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
