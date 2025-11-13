#!/usr/bin/env node

/**
 * Clean and setup correct SEK token packages
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function setupTokenPackages() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🧹 Cleaning up token packages...\n');

  try {
    // Delete all existing packages
    console.log('🗑️  Removing old packages...');
    const { error: deleteError } = await supabase
      .from('token_packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.log('⚠️  Delete warning:', deleteError.message);
    } else {
      console.log('✅ Old packages removed\n');
    }

    // Insert the correct 4 packages with SEK pricing
    console.log('📦 Creating new SEK token packages...\n');
    
    const packages = [
      { name: 'Small Package', tokens: 200, price: 99 },
      { name: 'Medium Package', tokens: 550, price: 249 },
      { name: 'Large Package', tokens: 1550, price: 499 },
      { name: 'Mega Package', tokens: 5800, price: 1499 }
    ];

    for (const pkg of packages) {
      const { data, error } = await supabase
        .from('token_packages')
        .insert(pkg)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${pkg.name}:`, error.message);
      } else {
        console.log(`✅ Created: ${pkg.name} - ${pkg.tokens} tokens for ${pkg.price} kr`);
      }
    }

    // Verify final state
    console.log('\n📊 Final token packages:\n');
    const { data: finalData, error: finalError } = await supabase
      .from('token_packages')
      .select('*')
      .order('tokens');

    if (finalError) {
      console.error('❌ Error fetching packages:', finalError.message);
    } else {
      console.log('ID | Name | Tokens | Price');
      console.log('---|------|--------|------');
      finalData.forEach(pkg => {
        const id = pkg.id.substring(0, 8);
        console.log(`${id}... | ${pkg.name} | ${pkg.tokens} | ${pkg.price} kr`);
      });
    }

    console.log('\n✅ Token packages setup complete!');
    console.log('\n💰 Swedish Krona Pricing:');
    console.log('   • Small:  200 tokens  =  99 kr (~40 images)');
    console.log('   • Medium: 550 tokens  = 249 kr (~110 images)');
    console.log('   • Large:  1,550 tokens = 499 kr (~310 images)');
    console.log('   • Mega:   5,800 tokens = 1,499 kr (~1,160 images)');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupTokenPackages();
