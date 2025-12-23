import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "subscriptions_enabled")
        .maybeSingle()

    if (error) {
        console.error("Error fetching subscriptions_enabled setting:", error);
        return NextResponse.json({ value: true }); // Default to true on error
    }

    if (data === null || data.value === null) {
        return NextResponse.json({ value: true }); // Default to true if not set
    }

    return NextResponse.json({ value: data.value });
}