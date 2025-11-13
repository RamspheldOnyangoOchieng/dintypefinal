#!/usr/bin/env node

// Same SSL fix as main script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SUPABASE_URL = 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';

async function test() {
  console.log('Testing Supabase API connection...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/characters?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ SUCCESS! Connected to Supabase');
      console.log('Characters found:', data.length);
      if (data.length > 0) {
        console.log('Sample character:', data[0].name);
      }
    } else {
      console.log('❌ Error:', await response.text());
    }
  } catch (error) {
    console.error('❌ Fetch failed:', error.message);
    console.error('Error code:', error.code);
  }
}

test();
