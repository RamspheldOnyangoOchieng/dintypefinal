const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfjptqdkthmejxpwbmvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContentBlocks() {
  try {
    console.log('🔍 Checking content_blocks table...\n')
    
    // Try to fetch all content blocks
    const { data, error } = await supabase
      .from('content_blocks')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Error fetching content_blocks:', error.message)
      console.log('   Error details:', error)
      return
    }
    
    console.log(`📊 Total blocks found: ${data ? data.length : 0}`)
    
    if (data && data.length > 0) {
      console.log('\n✅ Sample content blocks:')
      console.log(JSON.stringify(data, null, 2))
      
      console.log('\n📋 Table columns found:')
      console.log(Object.keys(data[0]).join(', '))
    } else {
      console.log('\n⚠️  No content blocks in database')
      console.log('\nExpected columns: page, block_key, content_sv, content_en, content_type')
      console.log('Need to either:')
      console.log('1. Run the migration to create the table with correct schema')
      console.log('2. Insert sample data')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkContentBlocks()
