require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Correct token packages with SEK pricing
const CORRECT_PACKAGES = [
  { name: 'Small Package', tokens: 200, price: 99 },
  { name: 'Medium Package', tokens: 550, price: 249 },
  { name: 'Large Package', tokens: 1550, price: 499 },
  { name: 'Mega Package', tokens: 5800, price: 1499 },
];

async function cleanupTokenPackages() {
  try {
    console.log('🧹 Cleaning up token packages database...\n');

    // Step 1: Get all existing packages
    const { data: allPackages, error: fetchError } = await supabase
      .from('token_packages')
      .select('*')
      .order('tokens', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError.message);
      return;
    }

    console.log(`📦 Found ${allPackages.length} existing packages\n`);

    // Step 2: Delete ALL existing packages
    console.log('🗑️  Deleting all existing packages...');
    const { error: deleteError } = await supabase
      .from('token_packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (deleteError) {
      console.error('❌ Error deleting packages:', deleteError.message);
      return;
    }

    console.log('✅ All old packages deleted\n');

    // Step 3: Create correct 4 packages
    console.log('📦 Creating correct SEK token packages...\n');
    
    for (const pkg of CORRECT_PACKAGES) {
      const { data, error } = await supabase
        .from('token_packages')
        .insert({
          name: pkg.name,
          tokens: pkg.tokens,
          price: pkg.price,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${pkg.name}:`, error.message);
      } else {
        console.log(`✅ Created: ${pkg.name} - ${pkg.tokens} tokens for ${pkg.price} kr`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 4: Verify final state
    console.log('\n📊 Verifying final token packages...\n');
    const { data: finalPackages, error: verifyError } = await supabase
      .from('token_packages')
      .select('*')
      .order('tokens', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError.message);
      return;
    }

    console.log('ID                                   | Name           | Tokens | Price');
    console.log('-------------------------------------|----------------|--------|-------');
    finalPackages.forEach(pkg => {
      const shortId = pkg.id.substring(0, 8) + '...';
      console.log(`${shortId.padEnd(36)} | ${pkg.name.padEnd(14)} | ${String(pkg.tokens).padEnd(6)} | ${pkg.price} kr`);
    });

    console.log('\n✅ Token packages cleanup complete!');
    console.log(`\n📊 Total packages: ${finalPackages.length} (should be 4)`);

    if (finalPackages.length === 4) {
      console.log('🎉 Perfect! Database now has exactly 4 SEK packages.');
    } else {
      console.log(`⚠️  Warning: Expected 4 packages but found ${finalPackages.length}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

cleanupTokenPackages();
