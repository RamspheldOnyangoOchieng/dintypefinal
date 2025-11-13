#!/usr/bin/env node

/**
 * Update admin password using bcrypt properly
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const POSTGRES_URL = process.env.POSTGRES_URL;
const adminEmail = 'info@dintyp.se';
const adminPassword = 'jdAlx!02!A';

async function updateAdminPassword() {
  const client = new Client({ 
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔐 Updating admin password with proper bcrypt hash...\n');

    // Generate bcrypt hash (Supabase compatible)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Update the password in auth.users
    const result = await client.query(
      `UPDATE auth.users 
       SET encrypted_password = $1,
           updated_at = NOW()
       WHERE email = $2
       RETURNING id, email`,
      [hashedPassword, adminEmail]
    );

    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log('   User:', result.rows[0].email);
      console.log('   User ID:', result.rows[0].id);
      console.log('\n📝 Login Credentials:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('\n🔗 You can now login at your application\n');
    } else {
      console.log('❌ User not found');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateAdminPassword();
