const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfjptqdkthmejxpwbmvq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTUyMjAsImV4cCI6MjA2ODY3MTIyMH0.OGYdQYRAkL_4njlwLOymfmE_kMDWM8pGvOeWv-YuDZk'

async function testAuth() {
  try {
    console.log('🧪 Testing browser session...\n')
    console.log('Instructions:')
    console.log('1. In your browser, open Developer Tools (F12)')
    console.log('2. Go to Console tab')
    console.log('3. Paste this code and press Enter:\n')
    console.log('─'.repeat(60))
    console.log(`
const supabaseUrl = '${supabaseUrl}'
const supabaseAnonKey = '${supabaseAnonKey}'

// Import Supabase (if not already available)
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get current session
const { data: { session }, error } = await supabase.auth.getSession()

if (error) {
  console.error('❌ Session error:', error)
} else if (!session) {
  console.log('⚠️  No active session - You need to log in')
  console.log('Please log in to the application first')
} else {
  console.log('✅ Session found:')
  console.log('  User ID:', session.user.id)
  console.log('  Email:', session.user.email)
  
  // Check if admin
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
  
  if (adminCheck) {
    console.log('✅ User IS an admin!')
  } else {
    console.log('❌ User is NOT an admin in admin_users table')
  }
  
  // Now test the API
  console.log('\\n🔍 Testing API endpoint...')
  const response = await fetch('/api/admin/content')
  console.log('API Status:', response.status, response.statusText)
  const data = await response.json()
  if (response.ok) {
    console.log('✅ API Success! Got', data.length, 'blocks')
  } else {
    console.log('❌ API Error:', data)
  }
}
`)
    console.log('─'.repeat(60))
    console.log('\n4. Check the output to see if you have a valid session')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAuth()
