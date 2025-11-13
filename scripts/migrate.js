#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Starting database migration...\n');
console.log('📄 Migration file: 20241109_add_image_url_column.sql\n');

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20241109_add_image_url_column.sql');
const sqlContent = fs.readFileSync(migrationPath, 'utf8');

// Display the SQL
console.log('📋 SQL to be executed:');
console.log('='.repeat(80));
console.log(sqlContent);
console.log('='.repeat(80));

console.log('\n✅ Please copy the SQL above and run it in your Supabase SQL Editor:');
console.log(`   https://qfjptqdkthmejxpwbmvq.supabase.co/project/qfjptqdkthmejxpwbmvq/sql`);
console.log('\n💡 Steps:');
console.log('   1. Open the URL above');
console.log('   2. Click "New Query"');
console.log('   3. Paste the SQL');
console.log('   4. Click "Run" or press Ctrl+Enter\n');
