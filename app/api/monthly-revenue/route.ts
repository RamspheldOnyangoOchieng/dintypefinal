import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

import { cookies } from "next/headers"

export async function GET() {
    try {
        await cookies()
        const supabase = await createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "Failed to create Supabase admin client" }, { status: 500 })
        }
        
        const today = new Date()
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const { data, error } = await supabase
            .from("token_transactions")
            .select("amount")
            .gte("created_at", firstDayOfMonth.toISOString())

        if (error) {
            console.error("Error fetching monthly revenue:", error)
            return NextResponse.json({ error: error }, { status: 500 })
        }

        const totalRevenue = data ? data.reduce((acc, transaction) => acc + transaction.amount, 0) : 0

        return NextResponse.json({ totalRevenue })
    } catch (error: any) {
        console.error("Error fetching monthly revenue:", {
            message: error?.message || "Unknown error",
            details: error?.stack || error?.toString(),
            hint: error?.hint || "",
            code: error?.code || ""
        })
        return NextResponse.json({ 
            error: "Internal server error", 
            details: error?.message 
        }, { status: 500 })
    }
}