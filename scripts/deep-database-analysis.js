#!/usr/bin/env node

/**
 * Deep database analysis and cleanup
 * Check for corrupted data, invalid fields, and duplicates
 */

require('dotenv').config();
const https = require('https');
const { URL } = require('url');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function deleteCharacter(id, name, reason) {
  console.log(`  🗑️  Deleting: ${name || 'Unknown'} (${id.substring(0, 8)}...) - ${reason}`);
  
  try {
    await makeRequest(`${SUPABASE_URL}/rest/v1/characters?id=eq.${id}`, { method: 'DELETE' });
    console.log(`  ✅ Deleted ${name || 'character'}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to delete: ${error.message}`);
    return false;
  }
}

async function analyzeCharacters() {
  console.log('\n🔍 DEEP DATABASE ANALYSIS\n');
  console.log('='.repeat(70) + '\n');
  
  const characters = await makeRequest(`${SUPABASE_URL}/rest/v1/characters?select=*&order=created_at.desc`);
  
  console.log(`📊 Total characters: ${characters.length}\n`);
  
  const issues = [];
  const toDelete = [];
  
  // Check each character for issues
  characters.forEach((char, index) => {
    const problems = [];
    
    // Check for missing name
    if (!char.name || char.name.trim() === '') {
      problems.push('missing name');
    }
    
    // Check for missing description
    if (!char.description || char.description.trim() === '') {
      problems.push('missing description');
    }
    
    // Check for missing/invalid age
    if (!char.age || char.age < 18 || char.age > 100) {
      problems.push(`invalid age (${char.age})`);
    }
    
    // Check for missing system_prompt
    if (!char.system_prompt || char.system_prompt.trim() === '') {
      problems.push('missing system_prompt');
    }
    
    // Check image URLs
    const imageUrl = char.image || char.image_url;
    if (!imageUrl) {
      problems.push('missing image URL');
    } else {
      // Check if it's a temporary Novita URL
      if (imageUrl.includes('faas-output-image.s3') || imageUrl.includes('novita')) {
        problems.push('temporary Novita URL');
      }
      // Check if it's a placeholder
      else if (imageUrl.includes('placeholder') || imageUrl.includes('unsplash')) {
        problems.push('placeholder image');
      }
      // Check if it's NOT a Supabase storage URL
      else if (!imageUrl.includes(SUPABASE_URL) || !imageUrl.includes('/storage/v1/object/public/images/')) {
        problems.push('non-Supabase image URL');
      }
      
      // Check if both image and image_url are set but different
      if (char.image && char.image_url && char.image !== char.image_url) {
        problems.push('conflicting image fields');
      }
    }
    
    if (problems.length > 0) {
      issues.push({
        char,
        problems,
        shouldDelete: problems.some(p => 
          p.includes('temporary') || 
          p.includes('placeholder') ||
          p.includes('missing image') ||
          p.includes('missing name')
        )
      });
    }
  });
  
  console.log('📋 Issues Found:\n');
  
  if (issues.length === 0) {
    console.log('✅ No issues found! Database is clean.\n');
    return;
  }
  
  // Group by severity
  const critical = issues.filter(i => i.shouldDelete);
  const warnings = issues.filter(i => !i.shouldDelete);
  
  console.log(`🚨 Critical (will be deleted): ${critical.length}`);
  console.log(`⚠️  Warnings (need review): ${warnings.length}\n`);
  
  // Show critical issues
  if (critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES (will be deleted):\n');
    critical.forEach((issue, index) => {
      const char = issue.char;
      console.log(`${index + 1}. ${char.name || 'NO NAME'} (${char.id.substring(0, 8)}...)`);
      console.log(`   Problems: ${issue.problems.join(', ')}`);
      console.log(`   Image: ${(char.image || char.image_url || 'none').substring(0, 60)}...`);
      console.log(`   Created: ${char.created_at}\n`);
      
      toDelete.push({
        char,
        reason: issue.problems.join(', ')
      });
    });
  }
  
  // Show warnings
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (need manual review):\n');
    warnings.forEach((issue, index) => {
      const char = issue.char;
      console.log(`${index + 1}. ${char.name} (${char.id.substring(0, 8)}...)`);
      console.log(`   Problems: ${issue.problems.join(', ')}`);
      console.log(`   Created: ${char.created_at}\n`);
    });
  }
  
  // Delete critical issues
  if (toDelete.length > 0) {
    console.log('\n⚠️  WARNING: About to delete ' + toDelete.length + ' corrupted characters!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🗑️  Deleting corrupted characters...\n');
    let deleteCount = 0;
    
    for (const { char, reason } of toDelete) {
      const success = await deleteCharacter(char.id, char.name, reason);
      if (success) deleteCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Deleted: ${deleteCount}/${toDelete.length} corrupted characters\n`);
  }
  
  // Final summary
  const remaining = await makeRequest(`${SUPABASE_URL}/rest/v1/characters?select=id,name,image,image_url&order=name.asc`);
  
  console.log('='.repeat(70));
  console.log('📊 FINAL STATUS');
  console.log('='.repeat(70));
  console.log(`Remaining characters: ${remaining.length}\n`);
  
  // Check for valid images
  const withValidImages = remaining.filter(c => {
    const img = c.image || c.image_url;
    return img && img.includes(SUPABASE_URL) && img.includes('/storage/v1/object/public/images/');
  });
  
  console.log(`✅ With valid Supabase images: ${withValidImages.length}`);
  console.log(`⚠️  Without valid images: ${remaining.length - withValidImages.length}\n`);
  
  if (withValidImages.length > 0) {
    console.log('Valid characters:');
    withValidImages.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
    });
  }
}

analyzeCharacters().catch(console.error);
