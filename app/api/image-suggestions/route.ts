import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")

        let query = supabase
            .from("image_suggestions")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })

        if (category) {
            query = query.eq("category", category)
        }

        const { data, error } = await query

        if (error) {
            console.error("Error fetching image suggestions:", error)
            return NextResponse.json(
                { error: "Failed to fetch image suggestions" },
                { status: 500 }
            )
        }

        return NextResponse.json(data || [])
    } catch (err) {
        console.error("Failed to fetch image suggestions:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
