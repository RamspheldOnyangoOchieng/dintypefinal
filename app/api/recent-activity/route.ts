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
        // 1. Get token transactions
        const { data: tokenTx, error: tokenTxError } = await supabase
            .from("token_transactions")
            .select("*, created_at")
            .order("created_at", { ascending: false })
            .limit(15)

        // 2. Get credit transactions
        const { data: creditTx, error: creditTxError } = await supabase
            .from("credit_transactions")
            .select("*, created_at")
            .order("created_at", { ascending: false })
            .limit(15)

        if (tokenTxError || creditTxError) {
            console.error("Error fetching transactions:", tokenTxError || creditTxError)
            return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
        }

        // 3. Combine and sort
        const combined = [
            ...(tokenTx || []).map(t => ({ ...t, activity_kind: 'token' })),
            ...(creditTx || []).map(t => ({ ...t, activity_kind: 'credit' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20)

        // 4. Enrich with user data
        if (combined.length > 0) {
            const userIds = [...new Set(combined.map(t => t.user_id).filter(Boolean))]
            
            const { data: users, error: userError } = await supabase
                .from("profiles")
                .select("id, username")
                .in("id", userIds)

            if (!userError && users) {
                const userMap = new Map(users.map(u => [u.id, u]))
                
                const enrichedData = combined.map(t => ({
                    ...t,
                    user: t.user_id ? userMap.get(t.user_id) : null
                }))
                
                return NextResponse.json({ activity: enrichedData })
            }
        }

        return NextResponse.json({ activity: combined })
    } catch (error) {
        console.error("Error fetching recent activity:", error)
        return NextResponse.json({ error: "Failed to fetch recent activity" }, { status: 500 })
    }
}