const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfjptqdkthmejxpwbmvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function normalizePage() {
  try {
    console.log('🔧 Normalizing page names to lowercase...\n')
    
    // First, let's see what we have
    const { data: allBlocks } = await supabase
      .from('content_blocks')
      .select('id, page, block_key')
      .limit(5)
    
    console.log('📋 Sample data:', JSON.stringify(allBlocks, null, 2))
    console.log()
    
    // Get unique page values
    const { data: allPages } = await supabase
      .from('content_blocks')
      .select('page')
    
    const uniquePages = [...new Set(allPages.map(b => b.page))]
    console.log('📄 Unique page values:', uniquePages)
    console.log()
    
    // Update each page individually
    for (const page of uniquePages) {
      if (page && page !== page.toLowerCase()) {
        const lowercase = page.toLowerCase()
        console.log(`🔄 Updating "${page}" → "${lowercase}"...`)
        
        const { data, error } = await supabase
          .from('content_blocks')
          .update({ page: lowercase })
          .eq('page', page)
          .select('id')
        
        if (error) {
          console.log(`   ❌ Error:`, error.message)
        } else {
          console.log(`   ✅ Updated ${data.length} blocks`)
        }
      } else {
        console.log(`✓ "${page}" already lowercase`)
      }
    }
    
    console.log('\n🎉 Done! Page names normalized.')
    console.log('   Please refresh your browser.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

normalizePage()
