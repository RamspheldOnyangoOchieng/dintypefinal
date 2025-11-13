const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfjptqdkthmejxpwbmvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllBlocks() {
  try {
    const { data, error } = await supabase
      .from('content_blocks')
      .select('page, block_key, content_sv')
      .order('page', { ascending: true })
      .order('block_key', { ascending: true })
    
    if (error) {
      console.log('❌ Error:', error.message)
      return
    }
    
    console.log(`\n📊 Total blocks: ${data.length}\n`)
    
    // Group by page
    const byPage = {}
    data.forEach(block => {
      if (!byPage[block.page]) byPage[block.page] = []
      byPage[block.page].push(block)
    })
    
    console.log('📋 Content Blocks by Page:\n')
    Object.keys(byPage).forEach(page => {
      console.log(`\n📄 ${page.toUpperCase()} (${byPage[page].length} blocks):`)
      byPage[page].forEach(block => {
        console.log(`   • ${block.block_key}: "${block.content_sv?.substring(0, 50)}..."`)
      })
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

listAllBlocks()
