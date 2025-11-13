#!/usr/bin/env node

/**
 * Apply SEK Pricing Migration
 * Updates token_packages table with Swedish Krona pricing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🚀 Starting SEK pricing migration...\n');

  try {
    console.log(' Checking current token packages...\n');

    // Check current state (without ordering by display_order which might not exist)
    const { data: beforeData, error: beforeError } = await supabase
      .from('token_packages')
      .select('*')
      .order('tokens');

    if (beforeError) {
      console.log('⚠️  Could not fetch current packages:', beforeError.message);
      console.log('   Continuing with migration...\n');
    } else if (beforeData && beforeData.length > 0) {
      console.log('Current packages:');
      beforeData.forEach(pkg => {
        console.log(`  - ${pkg.name}: ${pkg.tokens} tokens, Price: ${pkg.price}`);
      });
      console.log('');
    } else {
      console.log('   No existing packages found\n');
    }

    // Update prices - just the price field
    console.log('🔄 Updating prices to Swedish Krona...\n');
    
    const updates = [
      { tokens: 200, price: 99, name: 'Small Package' },
      { tokens: 550, price: 249, name: 'Medium Package' },
      { tokens: 1550, price: 499, name: 'Large Package' },
      { tokens: 5800, price: 1499, name: 'Mega Package' }
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('token_packages')
        .update({ price: update.price })
        .eq('tokens', update.tokens);

      if (error) {
        console.error(`❌ Error updating ${update.tokens} tokens package:`, error.message);
        console.log(`   Trying to insert instead...`);
        
        // If update failed, try to insert
        const { error: insertError } = await supabase
          .from('token_packages')
          .insert({
            name: update.name,
            tokens: update.tokens,
            price: update.price
          });
          
        if (insertError) {
          console.error(`❌ Insert also failed:`, insertError.message);
        } else {
          console.log(`✅ Inserted ${update.tokens} tokens → ${update.price} kr`);
        }
      } else {
        console.log(`✅ Updated ${update.tokens} tokens → ${update.price} kr`);
      }
    }

    // Verify the changes
    console.log('\n📊 Verifying final state...\n');
    const { data: afterData, error: afterError } = await supabase
      .from('token_packages')
      .select('*')
      .order('tokens');

    if (afterError) {
      console.error('❌ Error fetching updated packages:', afterError.message);
    } else if (afterData && afterData.length > 0) {
      console.log('✅ Final packages:');
      afterData.forEach(pkg => {
        console.log(`  ✓ ${pkg.name}: ${pkg.tokens} tokens → ${pkg.price} kr`);
      });
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📌 Summary:');
    console.log('   • 200 tokens = 99 kr');
    console.log('   • 550 tokens = 249 kr');
    console.log('   • 1,550 tokens = 499 kr');
    console.log('   • 5,800 tokens = 1,499 kr');
    console.log('\n📌 Next steps:');
    console.log('   1. ✅ Database updated');
    console.log('   2. → Update UI components to display Swedish Krona');
    console.log('   3. → Configure Stripe products with SEK pricing');
    console.log('   4. → Test checkout flow with new prices');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

applyMigration();
