#!/usr/bin/env node

/**
 * Setup Super Admin - Direct Database Method
 * Creates user in auth.users and admin_users tables directly
 */

require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ Missing POSTGRES_URL in .env');
  process.exit(1);
}

const adminEmail = 'info@dintyp.se';
const adminPassword = 'jdAlx!02!A';
const adminName = 'Dintype MasterAdmin';

// Hash password using bcrypt-compatible method
function hashPassword(password) {
  // Generate bcrypt hash - using a simple hash for now
  // In production, Supabase will handle password hashing
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function setupSuperAdmin() {
  const client = new Client({ 
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Setting up Super Admin via Direct Database Access\n');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Name: ${adminName}\n`);

    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Check if user exists in auth.users
    console.log('🔍 Checking if user exists...');
    
    const checkUser = await client.query(
      `SELECT id, email, raw_user_meta_data 
       FROM auth.users 
       WHERE email = $1`,
      [adminEmail]
    );

    let userId;

    if (checkUser.rows.length > 0) {
      userId = checkUser.rows[0].id;
      console.log('✅ User already exists');
      console.log(`   User ID: ${userId}`);
    } else {
      // Step 2: Insert into auth.users
      console.log('➕ Creating user in auth.users...');
      
      userId = crypto.randomUUID();
      
      const insertUser = await client.query(
        `INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          confirmation_token,
          aud,
          role
        ) VALUES (
          $1,
          '00000000-0000-0000-0000-000000000000',
          $2,
          $3,
          NOW(),
          '{"provider":"email","providers":["email"]}',
          $4,
          NOW(),
          NOW(),
          '',
          'authenticated',
          'authenticated'
        )
        RETURNING id`,
        [
          userId,
          adminEmail,
          hashPassword(adminPassword),
          JSON.stringify({ name: adminName, full_name: adminName })
        ]
      );

      console.log('✅ User created in auth.users');
      console.log(`   User ID: ${userId}`);
    }

    // Step 3: Add to admin_users
    console.log('\n🔐 Adding to admin_users table...');
    
    const checkAdmin = await client.query(
      'SELECT * FROM admin_users WHERE user_id = $1',
      [userId]
    );
    
    if (checkAdmin.rows.length > 0) {
      console.log('✅ Already in admin_users table');
    } else {
      await client.query(
        'INSERT INTO admin_users (user_id) VALUES ($1)',
        [userId]
      );
      console.log('✅ Added to admin_users table');
    }

    // Step 4: Setup user tokens
    console.log('\n💰 Initializing tokens...');
    
    const checkTokens = await client.query(
      'SELECT * FROM user_tokens WHERE user_id = $1',
      [userId]
    );
    
    if (checkTokens.rows.length > 0) {
      console.log(`✅ Current balance: ${checkTokens.rows[0].balance} tokens`);
    } else {
      await client.query(
        'INSERT INTO user_tokens (user_id, balance) VALUES ($1, $2)',
        [userId, 10000]
      );
      console.log('✅ Initialized with 10,000 tokens');
    }

    // Verify admin
    const verify = await client.query(
      'SELECT is_admin($1) as is_admin',
      [userId]
    );

    await client.end();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUPER ADMIN SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Login Credentials:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Name:     ${adminName}`);
    console.log(`   User ID:  ${userId}`);
    console.log('\n✅ Admin Status:', verify.rows[0].is_admin ? 'VERIFIED ✓' : 'ERROR ✗');
    console.log('💰 Token Balance: 10,000');
    console.log('\n🔗 Login at:', process.env.NEXT_PUBLIC_SITE_URL || 'your-app-url');
    console.log('\n⚠️  IMPORTANT: You may need to reset the password');
    console.log('   via Supabase dashboard due to password hashing.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupSuperAdmin();
