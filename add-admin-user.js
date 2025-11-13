#!/usr/bin/env node

/**
 * Add user as admin - Uses .env file for database connection
 * Updated version that works with any database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addUserAsAdmin() {
  try {
    console.log('🔧 Add User as Admin Tool\n');
    console.log(`📡 Connected to: ${supabaseUrl}\n`);
    console.log('This tool will add any user email as an admin in the system.\n');
    
    const email = await question('Enter the email address to make admin: ');
    
    if (!email || !email.includes('@')) {
      console.log('❌ Invalid email address');
      rl.close();
      return;
    }
    
    console.log(`\n🔍 Searching for user: ${email}...`);
    
    // Get all users and find the one with matching email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching users:', authError.message);
      rl.close();
      return;
    }
    
    const user = authData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('\n📋 Available users:');
      if (authData.users.length === 0) {
        console.log('   (No users found - you need to sign up first!)');
      } else {
        authData.users.forEach(u => console.log(`   - ${u.email}`));
      }
      rl.close();
      return;
    }
    
    console.log('✅ Found user:');
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    
    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingAdmin) {
      console.log('\n✅ User is already an admin!');
      rl.close();
      return;
    }
    
    // Add as admin
    console.log('\n➕ Adding user to admin_users table...');
    
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({ user_id: user.id })
      .select();
    
    if (insertError) {
      console.log('❌ Error adding admin:', insertError.message);
      console.log('\n💡 Possible reasons:');
      console.log('   - admin_users table does not exist (run migrations first)');
      console.log('   - Database permissions issue');
      console.log('   - User ID already exists');
    } else {
      console.log('✅ Successfully added user as admin!');
      console.log('   Admin record:', newAdmin);
      console.log('\n🎉 Done! The user can now access admin features.');
      console.log('   Please refresh the browser to see the changes.');
    }
    
    rl.close();
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    rl.close();
  }
}

addUserAsAdmin();
