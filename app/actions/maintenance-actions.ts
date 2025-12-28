"use server"

import { getAdminClient } from "@/lib/supabase-admin"

export async function fixCharacterPolicies() {
    try {
        const supabaseAdmin = await getAdminClient()
        if (!supabaseAdmin) {
            return { success: false, error: "Failed to create admin client" }
        }

        const fixSQL = `
      -- Enable Row Level Security
      ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies
      DROP POLICY IF EXISTS "Allow public read access" ON characters;
      DROP POLICY IF EXISTS "Allow authenticated users full access" ON characters;
      DROP POLICY IF EXISTS "Users can view their own private characters or all public ones" ON characters;
      DROP POLICY IF EXISTS "Users can insert their own characters" ON characters;
      DROP POLICY IF EXISTS "Users can update their own characters" ON characters;
      DROP POLICY IF EXISTS "Users can delete their own characters" ON characters;

      -- Policy for viewing: Public characters ARE visible to everyone. Private ones ONLY to owners.
      CREATE POLICY "Users can view their own private characters or all public ones" 
      ON characters FOR SELECT 
      USING (is_public = true OR auth.uid() = user_id);

      -- Policy for inserting: Only authenticated users can create characters, and they must be the owner.
      CREATE POLICY "Users can insert their own characters" 
      ON characters FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated' AND (auth.uid() = user_id OR user_id IS NULL));

      -- Policy for updating: Only owners can update their characters.
      CREATE POLICY "Users can update their own characters" 
      ON characters FOR UPDATE 
      USING (auth.uid() = user_id);

      -- Policy for deleting: Only owners can delete their characters.
      CREATE POLICY "Users can delete their own characters" 
      ON characters FOR DELETE 
      USING (auth.uid() = user_id);
    `

        const { error } = await supabaseAdmin.rpc("exec_sql", { sql: fixSQL })

        if (error) {
            console.error("Error fixing policies:", error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error("Unexpected error fixing policies:", error)
        return { success: false, error: (error as Error).message }
    }
}
