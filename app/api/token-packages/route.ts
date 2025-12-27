import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
    try {
        const supabase = await createClient()

        // Fetch only active packages, ordered by price or tokens
        const { data, error } = await supabase
            .from("token_packages")
            .select("*")
            .eq("active", true)
            .order("tokens", { ascending: true })

        if (error) {
            console.error("Error fetching token packages:", error)
            return NextResponse.json({ success: false, error: "Failed to fetch packages" }, { status: 500 })
        }

        // Format for frontend if needed (e.g. adding priceDisplay if missing)
        const formattedPackages = data.map(pkg => ({
            ...pkg,
            // Fallback for UI if specific fields aren't present
            priceDisplay: pkg.price_display || `${pkg.price} kr`,
        }))

        return NextResponse.json({ success: true, packages: formattedPackages })
    } catch (error: any) {
        console.error("API error:", error)
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
    }
}
