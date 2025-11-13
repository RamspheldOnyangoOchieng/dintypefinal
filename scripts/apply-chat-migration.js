#!/usr/bin/env node

/**
 * Apply Chat System Migration
 * Run this to add chat tables to the database
 */

require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Starting chat system migration...\n');

  // Get database credentials from environment
  let connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ Error: POSTGRES_URL not found in environment variables');
    console.error('Please make sure .env file contains POSTGRES_URL');
    process.exit(1);
  }

  // Sanitize the connection string (remove ?xxx parameters for pg client)
  const cleanConnectionString = connectionString.split('?')[0];

  // Check if this is a pooled connection (port 6543) and warn
  if (cleanConnectionString.includes(':6543')) {
    console.log('⚠️  Warning: Using pooled connection (port 6543)');
    console.log('   This is fine for most operations.\n');
  }

  const client = new Client({
    connectionString: cleanConnectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251113000001_create_chat_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📝 Running migration: 20251113000001_create_chat_tables.sql');
    console.log('   This will create:');
    console.log('   - conversation_sessions table');
    console.log('   - messages table');
    console.log('   - message_usage_tracking table');
    console.log('   - Database functions for chat operations');
    console.log('   - RLS policies for security\n');

    // Execute migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('conversation_sessions', 'messages', 'message_usage_tracking')
      ORDER BY table_name
    `);

    if (result.rows.length === 3) {
      console.log('✅ All chat tables verified:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    } else {
      console.warn('⚠️  Warning: Some tables may not have been created');
      console.log('   Found tables:', result.rows.map(r => r.table_name).join(', '));
    }

    console.log('\n🎉 Chat system is now ready to use!');
    console.log('   Messages will be stored in the database');
    console.log('   Cross-device sync is enabled');
    console.log('   Daily message limits are enforced');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run migration
applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
