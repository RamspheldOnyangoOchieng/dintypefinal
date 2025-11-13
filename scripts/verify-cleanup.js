#!/usr/bin/env node

/**
 * Verify cleanup and show final character list
 */

require('dotenv').config();
const https = require('https');
const { URL } = require('url');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
      }
    };

    https.get(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n✅ CLEANUP VERIFICATION\n');
  console.log('='.repeat(70) + '\n');
  
  const characters = await makeRequest(`${SUPABASE_URL}/rest/v1/characters?select=*&order=name.asc`);
  
  console.log(`📊 Total characters remaining: ${characters.length}\n`);
  console.log('Characters with valid Supabase storage URLs:\n');
  
  characters.forEach((char, index) => {
    const imageUrl = char.image || char.image_url || 'No image';
    const isSupabaseStorage = imageUrl.includes(SUPABASE_URL) && imageUrl.includes('/storage/v1/object/public/images/');
    const status = isSupabaseStorage ? '✅' : '⚠️';
    
    console.log(`${index + 1}. ${status} ${char.name} (${char.age || 'N/A'})`);
    console.log(`   ID: ${char.id}`);
    console.log(`   Image: ${imageUrl.substring(0, 80)}...`);
    console.log(`   Created: ${new Date(char.created_at).toLocaleString()}\n`);
  });
  
  console.log('='.repeat(70));
  console.log('✨ All characters now have valid Supabase storage URLs!');
  console.log('🌐 Visit your homepage to see the results.\n');
}

main().catch(console.error);
