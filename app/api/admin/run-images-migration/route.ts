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
      -- Collections table
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Generated images table (Note: user_id without hard FK to allow anonymous dummy IDs)
      CREATE TABLE IF NOT EXISTS generated_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        model_used TEXT,
        character_id UUID,
        collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
        favorite BOOLEAN DEFAULT FALSE,
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Add missing columns to generated_images if table already exists
      ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS character_id UUID;
      ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;
      ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;
      ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
      ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
      
      -- Remove FK constraint if it exists (allows transition from hard FK to soft/no FK for anonymous support)
      ALTER TABLE generated_images DROP CONSTRAINT IF EXISTS generated_images_user_id_fkey;
      
      -- Characters table updates
      ALTER TABLE characters ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
      ALTER TABLE characters ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE characters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      -- Generation tasks table updates
      ALTER TABLE generation_tasks ADD COLUMN IF NOT EXISTS character_id UUID;
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
