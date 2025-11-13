#!/usr/bin/env node

/**
 * Test connection to NEW client database
 * Uses credentials from env.txt
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read credentials from env.txt
const envPath = path.join(__dirname, 'env.txt');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const POSTGRES_URL_NON_POOLING = envVars.POSTGRES_URL_NON_POOLING;
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing New Client Database Connection\n');
console.log('═'.repeat(70));

async function testDatabaseConnection() {
  console.log('\n1️⃣ Testing PostgreSQL Direct Connection...');
  console.log(`   📡 Connecting to: ${POSTGRES_URL_NON_POOLING?.split('@')[1] || 'unknown'}`);
  
  if (!POSTGRES_URL_NON_POOLING) {
    console.error('   ❌ Missing POSTGRES_URL_NON_POOLING in env.txt');
    return false;
  }

  const client = new Client({
    connectionString: POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('   ✅ PostgreSQL connection successful!');

    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('   📊 PostgreSQL Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`   📋 Existing tables: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('   📝 Tables found:');
      tablesResult.rows.forEach(row => {
        console.log(`      - ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  No tables found - database is empty (migrations needed)');
    }

    await client.end();
    return true;
  } catch (error) {
    console.error('   ❌ PostgreSQL connection failed:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.error('   💡 Password might need URL encoding or is incorrect');
    }
    await client.end().catch(() => {});
    return false;
  }
}

async function testSupabaseAPI() {
  console.log('\n2️⃣ Testing Supabase API Connection...');
  console.log(`   📡 API URL: ${SUPABASE_URL}`);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('   ❌ Missing Supabase credentials in env.txt');
    return false;
  }

  try {
    // Disable SSL verification for testing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
      }
    });

    if (response.ok || response.status === 404) {
      console.log('   ✅ Supabase API is reachable!');
      
      // Try to list tables via API
      const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
        }
      });
      
      console.log('   📡 API Status:', response.status);
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('   ❌ Supabase API test failed:', error.message);
    return false;
  }
}

async function runTests() {
  const dbTest = await testDatabaseConnection();
  const apiTest = await testSupabaseAPI();

  console.log('\n═'.repeat(70));
  console.log('\n📊 Test Summary:');
  console.log(`   PostgreSQL: ${dbTest ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Supabase API: ${apiTest ? '✅ Connected' : '❌ Failed'}`);
  
  if (dbTest && apiTest) {
    console.log('\n✅ All connection tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Copy env.txt to .env (backup current .env first)');
    console.log('   2. Run migrations: node scripts/apply-migrations.js');
    console.log('   3. Run setup scripts as needed\n');
  } else {
    console.log('\n❌ Some tests failed. Please check credentials in env.txt\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
