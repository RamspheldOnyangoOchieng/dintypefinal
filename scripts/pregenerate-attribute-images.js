#!/usr/bin/env node

/**
 * Script to pre-generate all attribute images for the create-character flow
 * This avoids the 20-second wait time for users when they first select an attribute
 * 
 * Usage: node scripts/pregenerate-attribute-images.js
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Define all attributes that need images
const ATTRIBUTES = {
  age: ['teen', '20s', '30s', '40s+'],
  ethnicity: ['caucasian', 'latina', 'asian', 'african', 'indian'],
  eyeColor: ['brown', 'blue', 'green', 'red', 'yellow'],
  hairStyle: ['straight', 'short', 'long', 'curly', 'bangs', 'bun', 'ponytail'],
  hairColor: ['blonde', 'brunette', 'black', 'red', 'gray'],
  bodyType: ['petite', 'slim', 'athletic', 'voluptuous', 'curvy'],
  breastSize: ['small', 'medium', 'large', 'huge', 'flat'],
  buttSize: ['small', 'medium', 'large', 'athletic', 'skinny'],
};

const STYLES = ['realistic', 'anime'];

async function generateAttributeImage(category, value, style) {
  const url = `${SITE_URL}/api/attribute-images?category=${category}&value=${encodeURIComponent(value)}&style=${style}&gender=female`;
  
  console.log(`📡 Generating: ${category}/${value} (${style})...`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && data.image_url) {
      console.log(`✅ Generated: ${category}/${value} (${style})`);
      return { success: true, category, value, style, image_url: data.image_url };
    } else {
      console.error(`❌ Failed: ${category}/${value} (${style}) - ${data.error || 'Unknown error'}`);
      return { success: false, category, value, style, error: data.error };
    }
  } catch (error) {
    console.error(`❌ Error: ${category}/${value} (${style}) - ${error.message}`);
    return { success: false, category, value, style, error: error.message };
  }
}

async function pregenerateAll() {
  console.log('🚀 Starting pre-generation of attribute images...\n');
  console.log(`📍 Site URL: ${SITE_URL}\n`);
  
  const results = {
    success: [],
    failed: [],
    total: 0,
  };
  
  // Calculate total images to generate
  for (const [category, values] of Object.entries(ATTRIBUTES)) {
    results.total += values.length * STYLES.length;
  }
  
  console.log(`📊 Total images to generate: ${results.total}\n`);
  console.log(`⏱️  Estimated time: ${Math.ceil(results.total * 20 / 60)} minutes (20s per image)\n`);
  console.log('─'.repeat(70) + '\n');
  
  let completed = 0;
  
  // Generate images for each style
  for (const style of STYLES) {
    console.log(`\n🎨 Generating ${style} images...\n`);
    
    // Generate images for each category
    for (const [category, values] of Object.entries(ATTRIBUTES)) {
      console.log(`\n📁 Category: ${category}`);
      
      // Generate images sequentially to avoid rate limits
      for (const value of values) {
        const result = await generateAttributeImage(category, value, style);
        completed++;
        
        if (result.success) {
          results.success.push(result);
        } else {
          results.failed.push(result);
        }
        
        // Show progress
        const percent = Math.round((completed / results.total) * 100);
        console.log(`   Progress: ${completed}/${results.total} (${percent}%)\n`);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 PRE-GENERATION COMPLETE!');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📊 Total: ${results.total}`);
  console.log(`✨ Success Rate: ${Math.round((results.success.length / results.total) * 100)}%`);
  
  if (results.failed.length > 0) {
    console.log('\n⚠️  Failed images:');
    results.failed.forEach(item => {
      console.log(`   - ${item.category}/${item.value} (${item.style}): ${item.error}`);
    });
  }
  
  console.log('\n🎉 All attribute images have been pre-generated and cached!');
  console.log('💾 Images are stored in Supabase and will load instantly for users.\n');
}

// Run the script
pregenerateAll().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
