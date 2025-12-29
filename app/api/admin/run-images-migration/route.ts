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
      -- Characters table updates
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
      
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS video_url TEXT;
      
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      -- Generated images table updates
      CREATE TABLE IF NOT EXISTS generated_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        model_used TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE generated_images 
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
      
      COMMENT ON COLUMN generated_images.metadata IS 'Additional image metadata like subscription status at creation time';
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
