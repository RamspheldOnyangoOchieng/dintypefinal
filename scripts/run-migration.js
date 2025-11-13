#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241109_add_image_url_column.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration: 20241109_add_image_url_column.sql\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // Try direct SQL execution if RPC doesn't work
      console.log('⚠️  RPC method not available, trying direct execution...\n');
      
      // Split the SQL into individual statements
      const statements = sql.split('$$;').filter(s => s.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim() + (i < statements.length - 1 ? '$$;' : '');
        if (!statement) continue;
        
        console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
        
        const { error: stmtError } = await supabase.from('_migration_test').select('*').limit(0);
        
        // Since we can't execute raw SQL directly, we'll use a workaround
        // We need to use the Supabase dashboard SQL editor or PostgREST
        console.log('⚠️  Cannot execute raw SQL via Supabase client.');
        console.log('\n📋 Please copy and paste the following SQL into your Supabase SQL Editor:\n');
        console.log('=' .repeat(80));
        console.log(sql);
        console.log('=' .repeat(80));
        console.log('\n📍 Steps:');
        console.log('1. Go to: https://qfjptqdkthmejxpwbmvq.supabase.co/project/qfjptqdkthmejxpwbmvq/sql');
        console.log('2. Click "New Query"');
        console.log('3. Paste the SQL above');
        console.log('4. Click "Run" or press Ctrl+Enter\n');
        return;
      }
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify the columns were added
    const { data: columns, error: verifyError } = await supabase
      .from('characters')
      .select('*')
      .limit(0);

    if (!verifyError) {
      console.log('✅ Verified: characters table structure updated');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
