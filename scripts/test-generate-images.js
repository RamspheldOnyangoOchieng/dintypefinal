#!/usr/bin/env node

/**
 * Quick test script to generate a few sample attribute images
 * Use this to test the image generation before running the full pre-generation
 * 
 * Usage: node scripts/test-generate-images.js
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Just a few samples for testing
const TEST_SAMPLES = [
  { category: 'ethnicity', value: 'caucasian', style: 'realistic' },
  { category: 'ethnicity', value: 'latina', style: 'realistic' },
  { category: 'bodyType', value: 'athletic', style: 'realistic' },
  { category: 'hairStyle', value: 'long', style: 'realistic' },
  { category: 'eyeColor', value: 'blue', style: 'realistic' },
];

async function generateImage(category, value, style) {
  const url = `${SITE_URL}/api/attribute-images?category=${category}&value=${encodeURIComponent(value)}&style=${style}&gender=female`;
  
  console.log(`📡 Generating: ${category}/${value} (${style})...`);
  console.log(`   URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (data.success && data.image_url) {
      console.log(`✅ Success in ${elapsed}s`);
      console.log(`   Image: ${data.image_url.substring(0, 80)}...`);
      return { success: true, category, value, style, elapsed };
    } else {
      console.log(`❌ Failed: ${data.error || 'Unknown error'}`);
      return { success: false, category, value, style, error: data.error };
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, category, value, style, error: error.message };
  }
}

async function testGeneration() {
  console.log('🧪 Testing attribute image generation...\n');
  console.log(`📍 Site URL: ${SITE_URL}\n`);
  console.log(`📊 Testing ${TEST_SAMPLES.length} sample images\n`);
  console.log('─'.repeat(70) + '\n');
  
  const results = [];
  
  for (const sample of TEST_SAMPLES) {
    const result = await generateImage(sample.category, sample.value, sample.style);
    results.push(result);
    console.log(''); // Empty line between tests
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('='.repeat(70));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgTime = (successful.reduce((sum, r) => sum + parseFloat(r.elapsed), 0) / successful.length).toFixed(1);
    console.log(`⏱️  Average time: ${avgTime}s per image`);
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  Failed images:');
    failed.forEach(item => {
      console.log(`   - ${item.category}/${item.value}: ${item.error}`);
    });
  }
  
  if (successful.length === results.length) {
    console.log('\n🎉 All tests passed! Image generation is working correctly.');
    console.log('💡 You can now run: node scripts/pregenerate-attribute-images.js');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the test
testGeneration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
