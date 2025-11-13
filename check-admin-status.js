const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfjptqdkthmejxpwbmvq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminStatus() {
  try {
    console.log('🔍 Checking database for admin setup...\n')
    
    // Check all admin_users entries
    const { data: allAdmins, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
    
    if (adminError) {
      console.log('❌ Error checking admin_users table:', adminError.message)
      return
    }
    
    console.log(`📋 Total admin entries: ${allAdmins ? allAdmins.length : 0}`)
    if (allAdmins && allAdmins.length > 0) {
      console.log('   Admin user IDs:')
      allAdmins.forEach(admin => console.log(`   - ${admin.user_id} (created: ${admin.created_at})`))
    } else {
      console.log('   ⚠️  No admin users found in admin_users table!')
    }
    console.log()
    
    // List all auth users to find which one might be the admin
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Error with auth admin:', authError.message)
      return
    }
    
    console.log(`📋 Total users in auth system: ${authData.users.length}`)
    console.log('\n🔍 Checking which users are admins:')
    
    for (const user of authData.users) {
      const isAdmin = allAdmins.some(admin => admin.user_id === user.id)
      if (isAdmin) {
        console.log(`   ✅ ADMIN: ${user.email} (${user.id})`)
      }
    }
    
    console.log('\n🔍 Looking for users with "admin" in email:')
    const adminEmails = authData.users.filter(u => u.email.toLowerCase().includes('admin'))
    if (adminEmails.length > 0) {
      adminEmails.forEach(u => {
        const isAdmin = allAdmins.some(admin => admin.user_id === u.id)
        console.log(`   ${isAdmin ? '✅' : '❌'} ${u.email} (${u.id})`)
      })
    } else {
      console.log('   No users with "admin" in email found')
    }
    
    // If no admins exist, suggest creating one
    if (!allAdmins || allAdmins.length === 0) {
      console.log('\n⚠️  WARNING: No admins found in the system!')
      console.log('   You need to add at least one admin user.')
      console.log('\n💡 To add the first admin, you need to:')
      console.log('   1. Find your user ID from the list above')
      console.log('   2. Run SQL in Supabase:')
      console.log('      INSERT INTO admin_users (user_id) VALUES (\'YOUR-USER-ID\');')
    }
    
    // Also check if admin_users table exists
    console.log('\n📊 Checking admin_users table structure...')
    const { data: tableData, error: tableError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(5)
    
    if (tableError) {
      console.log('❌ Error accessing admin_users table:', tableError.message)
    } else {
      console.log('✅ admin_users table exists')
      console.log('   Total admin records found:', tableData.length)
      console.log('   Sample records:', tableData)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkAdminStatus()
