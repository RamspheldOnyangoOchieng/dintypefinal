#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runUnifiedMigration() {
  const dbUrl = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  
  if (!dbUrl) {
    console.error('❌ No database URL found in environment variables');
    process.exit(1);
  }

  const client = new Client({ 
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '99999999_unified_migration.sql');
    console.log('📖 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running unified migration (this may take a minute)...');
    const result = await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Show verification results
    if (result.rows && result.rows.length > 0) {
      console.log('\n📊 Table verification:');
      result.rows.forEach(row => {
        console.log(`   ${row.table_name}: ${row.row_count} rows`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.position) {
      console.error(`Position: ${error.position}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runUnifiedMigration();
