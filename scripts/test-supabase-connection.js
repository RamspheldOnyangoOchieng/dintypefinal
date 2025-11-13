#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const testUserId = 'e3885385-f2ee-45c3-b92f-32bc4e3a9958';
    console.log('\n📊 Checking if user is admin...');
    console.log('   User ID:', testUserId);
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', testUserId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Result:', data ? 'IS ADMIN' : 'NOT ADMIN');
      if (data) console.log('   Data:', data);
    }
  } catch (error) {
    console.error('\n❌ Exception:', error.message);
  }
}

testConnection();
