#!/usr/bin/env node

/**
 * Download images from Novita AI S3 and upload to Supabase Storage
 * This fixes the expiring URL issue
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';

// Download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Upload image to Supabase Storage
async function uploadToSupabase(buffer, characterId) {
  const filename = `${characterId}.jpeg`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/images/characters/${filename}`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true'
    },
    body: buffer
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }
  
  return `${SUPABASE_URL}/storage/v1/object/public/images/characters/${filename}`;
}

// Get all characters with S3 URLs
async function getCharactersWithS3Images() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/characters?select=id,name,image_url&image_url=like.*s3.ap-southeast-1.amazonaws.com*`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch characters: ${await response.text()}`);
  }
  
  return await response.json();
}

// Update character's image URL in database
async function updateCharacterImageUrl(characterId, newImageUrl) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/characters?id=eq.${characterId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ image_url: newImageUrl })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update: ${await response.text()}`);
  }
}

async function main() {
  console.log('\n🔄 MIGRATING IMAGES TO SUPABASE STORAGE\n');
  console.log('='.repeat(70) + '\n');
  
  // Get all characters with S3 URLs
  console.log('📊 Fetching characters with S3 image URLs...');
  const characters = await getCharactersWithS3Images();
  console.log(`   Found: ${characters.length} characters\n`);
  
  const results = { success: [], failed: [] };
  
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    console.log(`[${i + 1}/${characters.length}] ${char.name}`);
    console.log('─'.repeat(70));
    
    try {
      // Download image
      console.log('  📥 Downloading image...');
      const imageBuffer = await downloadImage(char.image_url);
      console.log(`  ✅ Downloaded (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
      
      // Upload to Supabase
      console.log('  📤 Uploading to Supabase Storage...');
      const newUrl = await uploadToSupabase(imageBuffer, char.id);
      console.log(`  ✅ Uploaded: ${newUrl}`);
      
      // Update database
      console.log('  💾 Updating database...');
      await updateCharacterImageUrl(char.id, newUrl);
      console.log(`  ✅ Database updated!`);
      
      results.success.push(char.name);
      console.log(`  ✅ ${char.name} COMPLETE!\n`);
      
      // Small delay
      if (i < characters.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
      
    } catch (error) {
      console.error(`  ❌ FAILED: ${error.message}\n`);
      results.failed.push({ name: char.name, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('✅ MIGRATION COMPLETE!');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${results.success.length}/${characters.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${characters.length}\n`);
  
  if (results.success.length > 0) {
    console.log('✨ Migrated:');
    results.success.forEach(name => console.log(`   - ${name}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n⚠️  Failed:');
    results.failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
  }
  
  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
