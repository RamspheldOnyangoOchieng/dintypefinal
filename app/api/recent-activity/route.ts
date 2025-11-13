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
        // First get token transactions
        const { data: transactions, error: txError } = await supabase
            .from("token_transactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10)

        if (txError) {
            console.error("Error fetching recent activity:", txError)
            return NextResponse.json({ error: txError }, { status: 500 })
        }

        // Then get user data for each transaction
        if (transactions && transactions.length > 0) {
            const userIds = [...new Set(transactions.map(t => t.user_id).filter(Boolean))]
            
            const { data: users, error: userError } = await supabase
                .from("profiles")
                .select("id, username")
                .in("id", userIds)

            if (!userError && users) {
                const userMap = new Map(users.map(u => [u.id, u]))
                
                const enrichedData = transactions.map(t => ({
                    ...t,
                    user: t.user_id ? userMap.get(t.user_id) : null
                }))
                
                return NextResponse.json({ activity: enrichedData })
            }
        }

        return NextResponse.json({ activity: transactions || [] })
    } catch (error) {
        console.error("Error fetching recent activity:", error)
        return NextResponse.json({ error: "Failed to fetch recent activity" }, { status: 500 })
    }
}