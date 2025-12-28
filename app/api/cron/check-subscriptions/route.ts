import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

/**
 * Cron job to check for expired subscriptions and monthly token credits.
 * This should be called once every 24 hours.
 */
export async function GET(request: Request) {
    // Check authorization (e.g., secret token from Vercel)
    const { searchParams } = new URL(request.url)
    const cronSecret = searchParams.get("secret")

    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const supabase = await createAdminClient()
        if (!supabase) throw new Error("Failed to initialize admin client")

        console.log("🕒 Starting subscription and token refresh job...")
        const now = new Date()
        const nowISO = now.toISOString()

        // 1. Handle Expired Subscriptions
        // -------------------------------------------------------------------------

        // Find active subscriptions that have passed their end date
        const { data: expiredSubs, error: subError } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("status", "active")
            .lt("current_period_end", nowISO)

        if (subError) {
            console.error("Error fetching expired subscriptions:", subError)
        } else if (expiredSubs && expiredSubs.length > 0) {
            console.log(`📉 Found ${expiredSubs.length} expired subscriptions. Downgrading...`)

            const userIds = expiredSubs.map(sub => sub.user_id)

            // Update status to 'expired'
            await supabase
                .from("user_subscriptions")
                .update({ status: "expired" })
                .in("user_id", userIds)

            // Also update premium_profiles (if exists)
            // This ensures components that use premium_profiles also see the expiry
            // No need to delete, check-premium-status already handles isPremium based on date
        }

        // 2. Handle Monthly Token Credits (Premium Users)
        // -------------------------------------------------------------------------

        // Find all active premium users who haven't been credited this month
        // We can check the last bonus transaction in token_transactions
        const { data: activePremiumUsers, error: premiumError } = await supabase
            .from("user_subscriptions")
            .select("user_id, current_period_start")
            .eq("plan_type", "premium")
            .eq("status", "active")

        if (premiumError) {
            console.error("Error fetching premium users:", premiumError)
        } else if (activePremiumUsers && activePremiumUsers.length > 0) {
            console.log(`💰 Checking token credits for ${activePremiumUsers.length} premium users...`)

            const { creditMonthlyTokens } = await import("@/lib/subscription-limits")

            let creditCount = 0
            for (const sub of activePremiumUsers) {
                // Only credit if it's been about a month since the last credit
                // Or simplified: check if they already got a credit in the current billing cycle
                // For now, call creditMonthlyTokens which handles the balance update and transaction logging
                // We might want to add a check inside creditMonthlyTokens to prevent double crediting

                // Let's implement a "last_token_credit_at" check
                const { data: lastCredit } = await supabase
                    .from("token_transactions")
                    .select("created_at")
                    .eq("user_id", sub.user_id)
                    .eq("type", "bonus")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()

                const oneMonthAgo = new Date()
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

                if (!lastCredit || new Date(lastCredit.created_at) < oneMonthAgo) {
                    const success = await creditMonthlyTokens(sub.user_id)
                    if (success) creditCount++
                }
            }
            console.log(`✅ Credited monthly tokens to ${creditCount} users.`)
        }

        return NextResponse.json({
            success: true,
            timestamp: nowISO,
            expiredHandled: expiredSubs?.length || 0,
            activePremiumUsers: activePremiumUsers?.length || 0
        })

    } catch (error) {
        console.error("❌ Cron job failed:", error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 })
    }
}
