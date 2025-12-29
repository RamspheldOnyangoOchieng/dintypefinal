require('dotenv').config();
import { createClient } from "@supabase/supabase-js"

async function debugImages() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Supabase URL or service role key is missing in .env")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log("🔍 Starting image debug...")

  // 1. Check total count
  const { count, error: countError } = await supabase
    .from("generated_images")
    .select("*", { count: "exact", head: true })

  if (countError) {
    console.error("❌ Error fetching count:", countError)
  } else {
    console.log(`✅ Total images in database: ${count}`)
  }

  // 2. Check counts per user
  const { data: userCounts, error: userError } = await supabase
    .from("generated_images")
    .select("user_id")

  if (userError) {
    console.error("❌ Error fetching per-user counts:", userError)
  } else {
    const counts: Record<string, number> = {}
    userCounts.forEach((row: any) => {
      counts[row.user_id] = (counts[row.user_id] || 0) + 1
    })
    console.log("📊 Image counts per user:")
    console.table(counts)
  }

  // 3. Check 5 most recent images
  const { data: recentImages, error: recentError } = await supabase
    .from("generated_images")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  if (recentError) {
    console.error("❌ Error fetching recent images:", recentError)
  } else {
    console.log("🆕 5 Most recent images:")
    console.log(JSON.stringify(recentImages, null, 2))
  }
}

checkImages();
