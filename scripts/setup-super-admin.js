#!/usr/bin/env node

/**
 * Setup Super Admin User
 * Creates a new user account and adds them as admin
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSuperAdmin() {
  const adminEmail = 'info@dintyp.se';
  const adminPassword = 'jdAlx!02!A';
  const adminName = 'Dintype MasterAdmin';

  try {
    console.log('🚀 Setting up Super Admin User\n');
    console.log(`📡 Connected to: ${supabaseUrl}`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Name: ${adminName}\n`);

    // Step 1: Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      u => u.email.toLowerCase() === adminEmail.toLowerCase()
    );

    let userId;

    if (existingUser) {
      console.log('✅ User already exists');
      console.log(`   User ID: ${existingUser.id}`);
      userId = existingUser.id;
    } else {
      // Step 2: Create the user account
      console.log('➕ Creating user account...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: adminName,
          full_name: adminName,
          role: 'super_admin'
        }
      });

      if (createError) {
        console.error('❌ Error creating user:', createError.message);
        process.exit(1);
      }

      console.log('✅ User account created successfully!');
      console.log(`   User ID: ${newUser.user.id}`);
      userId = newUser.user.id;
    }

    // Step 3: Check if already admin
    console.log('\n🔍 Checking admin status...');
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      console.log('✅ User is already a super admin!');
      console.log('   Admin since:', existingAdmin.created_at);
    } else {
      // Step 4: Add as admin
      console.log('➕ Adding user to admin_users table...');
      const { data: newAdmin, error: adminError } = await supabase
        .from('admin_users')
        .insert({ user_id: userId })
        .select()
        .single();

      if (adminError) {
        console.error('❌ Error adding admin:', adminError.message);
        process.exit(1);
      }

      console.log('✅ Successfully added as super admin!');
      console.log('   Admin ID:', newAdmin.id);
    }

    // Step 5: Initialize user tokens (if table exists)
    console.log('\n💰 Initializing user tokens...');
    const { data: existingTokens } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingTokens) {
      const { error: tokenError } = await supabase
        .from('user_tokens')
        .insert({ 
          user_id: userId, 
          balance: 10000 // Give admin 10,000 tokens to start
        });

      if (!tokenError) {
        console.log('✅ Initialized with 10,000 tokens');
      }
    } else {
      console.log('✅ Token balance:', existingTokens.balance);
    }

    // Step 6: Verify admin access
    console.log('\n🔐 Verifying admin access...');
    const { data: verifyAdmin } = await supabase.rpc('is_admin', { user_uuid: userId });
    
    if (verifyAdmin) {
      console.log('✅ Admin access verified!');
    } else {
      console.log('⚠️  Warning: Admin function verification failed');
    }

    console.log('\n🎉 SUPER ADMIN SETUP COMPLETE!\n');
    console.log('📝 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Name: ${adminName}`);
    console.log('\n🔗 You can now login at your application URL');
    console.log('   The user has full admin privileges\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupSuperAdmin();
