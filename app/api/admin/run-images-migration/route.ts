import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Create a Supabase client with admin privileges
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        // SQL to add the images column if it doesn't exist
        // We use TEXT[] for the array of image URLs
        const sql = `
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
      
      COMMENT ON COLUMN characters.images IS 'Array of additional profile image URLs';
      
      -- Also add video_url just in case the previous migration didn't run
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS video_url TEXT;
      
      -- Add updated_at if it doesn't exist
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `

        // Execute the SQL via the pgclient RPC if it exists
        // Fallback to exec_sql if pgclient doesn't exist
        let response = await supabaseAdmin.rpc("pgclient", { query: sql })

        if (response.error && response.error.message.includes("Could not find the function")) {
            console.log("pgclient not found, trying exec_sql...")
            response = await supabaseAdmin.rpc("exec_sql", { sql: sql })
        }

        if (response.error) {
            console.error("Migration error:", response.error)
            return NextResponse.json({ success: false, error: response.error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Required columns added successfully" })
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
    }
}
