#!/usr/bin/env node

/**
 * Setup Super Admin User via Supabase API
 * Creates user account and adds to admin_users table
 */

require('dotenv').config();
const https = require('https');
const { Client } = require('pg');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const adminEmail = 'info@dintyp.se';
const adminPassword = 'jdAlx!02!A';
const adminName = 'Dintype MasterAdmin';

// Make HTTPS request helper
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error: ${parsed.message || parsed.msg || data}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function setupSuperAdmin() {
  try {
    console.log('🚀 Setting up Super Admin User via API\n');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Name: ${adminName}\n`);

    const supabaseHost = new URL(SUPABASE_URL).hostname;

    // Step 1: Create user via Supabase Admin API
    console.log('➕ Creating user account via Supabase API...');
    
    const createUserOptions = {
      hostname: supabaseHost,
      path: '/auth/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const userData = {
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        full_name: adminName
      }
    };

    let userId;
    
    try {
      const user = await makeRequest(createUserOptions, userData);
      userId = user.id;
      console.log('✅ User account created!');
      console.log(`   User ID: ${userId}`);
    } catch (error) {
      if (error.message.includes('already registered')) {
        console.log('⚠️  User already exists, fetching user ID...');
        
        // Get existing user
        const listUsersOptions = {
          hostname: supabaseHost,
          path: '/auth/v1/admin/users',
          method: 'GET',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          }
        };
        
        const usersData = await makeRequest(listUsersOptions);
        const existingUser = usersData.users.find(u => u.email === adminEmail);
        
        if (!existingUser) {
          throw new Error('User exists but could not be found');
        }
        
        userId = existingUser.id;
        console.log(`✅ Found existing user: ${userId}`);
      } else {
        throw error;
      }
    }

    // Step 2: Add to admin_users table via database
    console.log('\n🔐 Adding to admin_users table...');
    
    const dbClient = new Client({ 
      connectionString: POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await dbClient.connect();
    
    // Check if already admin
    const checkAdmin = await dbClient.query(
      'SELECT * FROM admin_users WHERE user_id = $1',
      [userId]
    );
    
    if (checkAdmin.rows.length > 0) {
      console.log('✅ User is already an admin');
    } else {
      await dbClient.query(
        'INSERT INTO admin_users (user_id) VALUES ($1)',
        [userId]
      );
      console.log('✅ Added to admin_users table');
    }

    // Step 3: Initialize tokens
    console.log('\n💰 Setting up user tokens...');
    
    const checkTokens = await dbClient.query(
      'SELECT * FROM user_tokens WHERE user_id = $1',
      [userId]
    );
    
    if (checkTokens.rows.length > 0) {
      console.log(`✅ Token balance: ${checkTokens.rows[0].balance}`);
    } else {
      await dbClient.query(
        'INSERT INTO user_tokens (user_id, balance) VALUES ($1, $2)',
        [userId, 10000]
      );
      console.log('✅ Initialized with 10,000 tokens');
    }

    // Verify admin status
    const verifyAdmin = await dbClient.query(
      'SELECT is_admin($1) as is_admin',
      [userId]
    );
    
    await dbClient.end();

    console.log('\n🎉 SUPER ADMIN SETUP COMPLETE!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Login Credentials:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Name:     ${adminName}`);
    console.log(`   User ID:  ${userId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Admin Status:', verifyAdmin.rows[0].is_admin ? 'VERIFIED' : 'PENDING');
    console.log('\n🔗 Login at:', process.env.NEXT_PUBLIC_SITE_URL || SUPABASE_URL);
    console.log('   Full admin access enabled!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupSuperAdmin();
