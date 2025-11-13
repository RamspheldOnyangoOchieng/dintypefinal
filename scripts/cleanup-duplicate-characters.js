#!/usr/bin/env node

/**
 * Cleanup duplicate characters from database
 * Keep only characters with valid Supabase storage URLs
 * Remove duplicates with missing/corrupted images
 */

require('dotenv').config();
const https = require('https');
const { URL } = require('url');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Helper to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function getAllCharacters() {
  console.log('📊 Fetching all characters from database...\n');
  return await makeRequest(`${SUPABASE_URL}/rest/v1/characters?select=*&order=created_at.desc`);
}

async function deleteCharacter(id, name, reason) {
  console.log(`  🗑️  Deleting: ${name} (${id.substring(0, 8)}...) - ${reason}`);
  
  try {
    await makeRequest(`${SUPABASE_URL}/rest/v1/characters?id=eq.${id}`, { method: 'DELETE' });
    console.log(`  ✅ Deleted ${name}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to delete ${name}: ${error.message}`);
    return false;
  }
}

function analyzeImageUrl(imageUrl) {
  if (!imageUrl) {
    return { type: 'missing', valid: false };
  }
  
  // Check if it's a Supabase storage URL
  if (imageUrl.includes(SUPABASE_URL) && imageUrl.includes('/storage/v1/object/public/images/')) {
    return { type: 'supabase-storage', valid: true };
  }
  
  // Check if it's a temporary Novita URL (faas-output-image.s3)
  if (imageUrl.includes('faas-output-image.s3') || imageUrl.includes('novita')) {
    return { type: 'novita-temp', valid: false };
  }
  
  // Check if it's Cloudinary
  if (imageUrl.includes('cloudinary.com')) {
    return { type: 'cloudinary', valid: true };
  }
  
  // Check if it's a placeholder
  if (imageUrl.includes('placeholder') || imageUrl.includes('unsplash')) {
    return { type: 'placeholder', valid: false };
  }
  
  // Unknown type
  return { type: 'unknown', valid: false };
}

async function main() {
  console.log('🧹 CHARACTER CLEANUP SCRIPT\n');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Fetch all characters
    const characters = await getAllCharacters();
    console.log(`📊 Total characters in database: ${characters.length}\n`);
    
    // Group by name (case-insensitive)
    const groupedByName = {};
    characters.forEach(char => {
      const nameLower = (char.name || '').toLowerCase().trim();
      if (!groupedByName[nameLower]) {
        groupedByName[nameLower] = [];
      }
      groupedByName[nameLower].push(char);
    });
    
    // Analyze duplicates
    console.log('🔍 Analyzing characters...\n');
    const duplicateGroups = Object.entries(groupedByName).filter(([_, chars]) => chars.length > 1);
    const singletons = Object.entries(groupedByName).filter(([_, chars]) => chars.length === 1);
    
    console.log(`📋 Summary:`);
    console.log(`   - Unique names: ${Object.keys(groupedByName).length}`);
    console.log(`   - Names with duplicates: ${duplicateGroups.length}`);
    console.log(`   - Names without duplicates: ${singletons.length}\n`);
    
    // Track what to delete
    const toDelete = [];
    const toKeep = [];
    
    // Process each group
    console.log('🔍 Processing duplicates...\n');
    
    for (const [name, chars] of Object.entries(groupedByName)) {
      if (chars.length === 1) {
        const char = chars[0];
        const imageAnalysis = analyzeImageUrl(char.image || char.image_url);
        
        if (imageAnalysis.valid) {
          toKeep.push(char);
        } else {
          toDelete.push({ char, reason: `Single entry with ${imageAnalysis.type} image` });
        }
        continue;
      }
      
      // Multiple characters with same name
      console.log(`\n📌 ${name} (${chars.length} duplicates):`);
      
      // Analyze each duplicate
      const analyzed = chars.map(char => {
        const imageUrl = char.image || char.image_url || '';
        const analysis = analyzeImageUrl(imageUrl);
        return { char, imageUrl, analysis };
      });
      
      // Find characters with valid Supabase storage URLs
      const withSupabaseStorage = analyzed.filter(a => a.analysis.type === 'supabase-storage');
      const withCloudinary = analyzed.filter(a => a.analysis.type === 'cloudinary');
      const withValidImages = [...withSupabaseStorage, ...withCloudinary];
      const withInvalidImages = analyzed.filter(a => !a.analysis.valid);
      
      console.log(`   - Valid Supabase storage: ${withSupabaseStorage.length}`);
      console.log(`   - Cloudinary: ${withCloudinary.length}`);
      console.log(`   - Invalid/missing: ${withInvalidImages.length}`);
      
      // Decision logic: Keep Supabase storage > Cloudinary > newest valid
      if (withSupabaseStorage.length > 0) {
        // Keep the first Supabase storage entry, delete the rest
        const keeper = withSupabaseStorage[0];
        toKeep.push(keeper.char);
        console.log(`   ✅ Keeping: ${keeper.char.id.substring(0, 8)}... (Supabase storage)`);
        
        // Delete all others
        analyzed.forEach(a => {
          if (a.char.id !== keeper.char.id) {
            toDelete.push({ 
              char: a.char, 
              reason: `Duplicate of ${name}, keeping Supabase storage version` 
            });
          }
        });
      } else if (withCloudinary.length > 0) {
        // Keep the newest Cloudinary entry
        const keeper = withCloudinary.sort((a, b) => 
          new Date(b.char.created_at) - new Date(a.char.created_at)
        )[0];
        toKeep.push(keeper.char);
        console.log(`   ✅ Keeping: ${keeper.char.id.substring(0, 8)}... (Cloudinary)`);
        
        analyzed.forEach(a => {
          if (a.char.id !== keeper.char.id) {
            toDelete.push({ 
              char: a.char, 
              reason: `Duplicate of ${name}, keeping Cloudinary version` 
            });
          }
        });
      } else {
        // No valid images, keep the newest and mark for manual review
        const keeper = analyzed.sort((a, b) => 
          new Date(b.char.created_at) - new Date(a.char.created_at)
        )[0];
        toKeep.push(keeper.char);
        console.log(`   ⚠️  Keeping newest: ${keeper.char.id.substring(0, 8)}... (no valid images)`);
        
        analyzed.forEach(a => {
          if (a.char.id !== keeper.char.id) {
            toDelete.push({ 
              char: a.char, 
              reason: `Duplicate of ${name}, no valid images` 
            });
          }
        });
      }
    }
    
    // Summary before deletion
    console.log('\n' + '='.repeat(70));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`Characters to keep: ${toKeep.length}`);
    console.log(`Characters to delete: ${toDelete.length}\n`);
    
    if (toDelete.length === 0) {
      console.log('✅ No characters to delete. Database is clean!\n');
      return;
    }
    
    // Show what will be deleted
    console.log('🗑️  Characters to be deleted:\n');
    toDelete.forEach(({ char, reason }, index) => {
      const imageUrl = char.image || char.image_url || 'none';
      const imageType = analyzeImageUrl(imageUrl).type;
      console.log(`${index + 1}. ${char.name} (${char.id.substring(0, 8)}...)`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Image: ${imageType} - ${imageUrl.substring(0, 60)}...`);
      console.log(`   Created: ${char.created_at}\n`);
    });
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: About to delete ' + toDelete.length + ' characters!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete characters
    console.log('🗑️  Deleting characters...\n');
    let deleteCount = 0;
    
    for (const { char, reason } of toDelete) {
      const success = await deleteCharacter(char.id, char.name, reason);
      if (success) deleteCount++;
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(70));
    console.log(`Deleted: ${deleteCount}/${toDelete.length} characters`);
    console.log(`Remaining: ${toKeep.length} characters\n`);
    
    // Show remaining characters with image types
    console.log('📋 Remaining characters by image type:\n');
    const remaining = toKeep.reduce((acc, char) => {
      const imageUrl = char.image || char.image_url || '';
      const type = analyzeImageUrl(imageUrl).type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(char.name);
      return acc;
    }, {});
    
    Object.entries(remaining).forEach(([type, names]) => {
      console.log(`${type}: ${names.length} characters`);
      names.slice(0, 5).forEach(name => console.log(`   - ${name}`));
      if (names.length > 5) console.log(`   ... and ${names.length - 5} more`);
      console.log('');
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
