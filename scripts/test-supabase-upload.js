#!/usr/bin/env node

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const crypto = require('crypto');

const SUPABASE_URL = 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';

async function testUpload() {
  try {
    // Use the most recent Novita AI image
    const testUrl = 'https://faas-output-image.s3.ap-southeast-1.amazonaws.com/prod/8384722c-ddb4-46ef-a8ba-fa1b7305aff2/1c8b81fcdd86487cad1653d29b80a0f4.jpeg';
    
    console.log('📥 Downloading from Novita AI...');
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      console.log('❌ Download failed:', response.status, response.statusText);
      return;
    }
    
    const imageBuffer = await response.arrayBuffer();
    console.log('✅ Downloaded:', Math.round(imageBuffer.byteLength / 1024), 'KB');
    
    const characterId = crypto.randomUUID();
    const fileName = `characters/${characterId}.jpeg`;
    
    console.log('📤 Uploading to Supabase Storage:', fileName);
    
    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.byteLength.toString()
      },
      body: Buffer.from(imageBuffer)
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.log('❌ Upload failed:', uploadResponse.status, error);
      return;
    }
    
    const permanentUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
    console.log('✅ Uploaded successfully!');
    console.log('🔗 Permanent URL:', permanentUrl);
    console.log('\n✅ Test successful! The upload method works.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUpload();
