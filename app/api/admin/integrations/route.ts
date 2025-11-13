import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { clearIntegrationCache } from "@/lib/integration-config"

// GET - Load integration settings
export async function GET() {
  try {
    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const { data, error } = await supabase
      .from("system_integrations")
      .select("key, value")

    if (error) {
      console.error("Error fetching integrations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert array to object
    const config: Record<string, string> = {}
    data?.forEach((item) => {
      config[item.key] = item.value || ""
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error in GET /api/admin/integrations:", error)
    return NextResponse.json(
      { error: "Failed to load integrations" },
      { status: 500 }
    )
  }
}

// POST - Save integration settings
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Update each key in the database
    const updates = Object.entries(body).map(async ([key, value]) => {
      const { error } = await supabase
        .from("system_integrations")
        .upsert({
          key,
          value: value as string,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error(`Error updating ${key}:`, error)
        throw error
      }
    })

    await Promise.all(updates)

    // Clear the cache so new values are loaded immediately
    clearIntegrationCache()

    return NextResponse.json({ success: true, message: "Settings saved successfully" })
  } catch (error) {
    console.error("Error in POST /api/admin/integrations:", error)
    return NextResponse.json(
      { error: "Failed to save integrations" },
      { status: 500 }
    )
  }
}
