import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get("userId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    try {
        const supabase = await createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let userId = targetUserId

        // If no userId is targetted, default to current user
        if (!userId) {
            userId = currentUser.id
        }

        // If current user is not target user, they must be admin
        if (userId !== currentUser.id) {
            const { data: adminUser } = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", currentUser.id)
                .maybeSingle()

            if (!adminUser) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        const supabaseAdmin = await createAdminClient()
        if (!supabaseAdmin) throw new Error("Failed to initialize admin client")

        // Fetch token transactions
        const { data: tokenTx, count: tokenCount } = await supabaseAdmin
            .from("token_transactions")
            .select("*", { count: "exact" })
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1)

        // Fetch credit transactions
        const { data: creditTx, count: creditCount } = await supabaseAdmin
            .from("credit_transactions")
            .select("*", { count: "exact" })
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1)

        // Combine and format
        const combined = [
            ...(tokenTx || []).map(tx => ({
                id: tx.id,
                amount: tx.amount,
                type: tx.type,
                description: tx.description,
                created_at: tx.created_at,
                kind: 'token'
            })),
            ...(creditTx || []).map(tx => ({
                id: tx.id,
                amount: Number(tx.amount),
                type: tx.type,
                description: tx.description,
                created_at: tx.created_at,
                kind: 'credit'
            }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit)

        return NextResponse.json({
            success: true,
            activities: combined,
            total: (tokenCount || 0) + (creditCount || 0)
        })
    } catch (error: any) {
        console.error("User activity API error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
