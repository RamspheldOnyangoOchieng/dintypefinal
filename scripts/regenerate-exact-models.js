#!/usr/bin/env node

/**
 * Regenerate EXACT models from screenshots
 * These prompts match the specific images shown
 */

// Load environment variables
require('dotenv').config();

// Fix for Node.js fetch SSL issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const crypto = require('crypto');
const https = require('https');
const http = require('http');

const NOVITA_API_KEY = process.env.NOVITA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!NOVITA_API_KEY) {
  console.error('❌ NOVITA_API_KEY is not set in .env file');
  process.exit(1);
}
if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env file');
  process.exit(1);
}
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env file');
  process.exit(1);
}

// Upload image to Supabase Storage
async function uploadToSupabaseStorage(imageUrl, characterId) {
  console.log(`  📦 Uploading to Supabase Storage...`);
  
  // Download image from Novita AI
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to download image from Novita AI');
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const fileName = `characters/${characterId}.jpeg`;
  
  // Upload to Supabase Storage bucket 'images' using https module
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/images/${fileName}`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(Buffer.from(imageBuffer)),
        'x-upsert': 'true'
      },
      rejectUnauthorized: false
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const permanentUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
          console.log(`  ✅ Uploaded to Supabase Storage: ${permanentUrl}`);
          resolve(permanentUrl);
        } else {
          console.error(`  ❌ Upload failed (${res.statusCode}): ${data}`);
          reject(new Error(`Supabase upload failed: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`  ❌ Request error:`, error);
      reject(error);
    });
    
    req.write(Buffer.from(imageBuffer));
    req.end();
  });
}

// EXACT characters from your screenshots
const EXACT_MODELS = [
  {
    name: 'ginah',
    age: 25,
    occupation: 'Model',
    personality: 'friendly, outgoing, confident',
    ethnicity: 'Caucasian',
    hairColor: 'blonde',
    eyeColor: 'blue',
    bodyType: 'slim',
    description: 'Ginah shines with a radiant aura. Her 25 years of age and Colombian beauty exude confidence and grace. As a successful model, she brings elegance and poise to every interaction, with a warm personality that makes everyone feel at ease.',
    prompt: 'professional fashion photography, stunning 25 year old blonde model, long wavy blonde hair, blue eyes, slim fit figure, wearing elegant black strapless dress, glamorous makeup, soft studio lighting, dark background, high-end fashion shoot, confident pose, photorealistic, 8k, professional model photography'
  },
  {
    name: 'Maze',
    age: 25,
    occupation: 'Artist',
    personality: 'mysterious, intelligent',
    ethnicity: 'African',
    hairColor: 'black',
    eyeColor: 'brown',
    bodyType: 'athletic',
    description: 'Maze is a 25-year-old beauty with an enigmatic presence. As a talented artist, she sees the world through a unique lens, combining creativity with sharp intelligence. Her mysterious nature draws people in, while her warm smile puts them at ease.',
    prompt: 'professional portrait photography, beautiful 25 year old African woman, long straight black hair, brown eyes, athletic toned body, wearing black elegant dress, warm beige/tan background, studio lighting, confident sensual pose, high fashion photography, photorealistic, 8k'
  },
  {
    name: 'Agnes',
    age: 19,
    occupation: 'University Student',
    personality: 'whimsical, creative',
    ethnicity: 'Caucasian',
    hairColor: 'brown',
    eyeColor: 'hazel',
    bodyType: 'curvy',
    description: 'Agnes is a whimsical university student whose bright, inquisitive spirit and playful nature bring joy to everyone around her. At 19, she approaches life with boundless curiosity and creative energy, always ready for the next adventure.',
    prompt: 'lifestyle fashion photography, beautiful 19 year old woman, long wavy brown hair, wearing elegant red dress, outdoor garden background, natural daylight, romantic elegant pose, professional portrait, photorealistic, 8k'
  },
  {
    name: 'Alva',
    age: 20,
    occupation: 'Tennis Enthusiast',
    personality: 'vibrant, enthusiastic',
    ethnicity: 'Mixed',
    hairColor: 'dark brown',
    eyeColor: 'brown',
    bodyType: 'athletic',
    description: 'Alva is a vibrant and charismatic 20-year-old tennis enthusiast whose fit physique and outdoor spirit reflect her active lifestyle. Her enthusiasm is infectious, and her positive energy lights up any room she enters.',
    prompt: 'professional portrait photography, stunning 20 year old woman with olive complexion, long wavy dark brown hair, wearing elegant black dress with jewelry, outdoor nature background with greenery, natural lighting, sophisticated glamorous style, photorealistic, 8k'
  },
  {
    name: 'Saga',
    age: 26,
    occupation: 'Lawyer',
    personality: 'professional, confident',
    ethnicity: 'Caucasian',
    hairColor: 'brunette',
    eyeColor: 'brown',
    bodyType: 'slim',
    description: 'Meet Saga, a 26-year-old lawyer with an infectious energy that draws people to her like a magnet. Her professional demeanor is balanced with a warm, approachable personality that makes her both respected and well-loved in her field.',
    prompt: 'professional headshot, beautiful 26 year old brunette lawyer, long straight brown hair, brown eyes, slim figure, wearing elegant beige/cream dress, soft neutral background, professional studio lighting, confident warm smile, corporate professional photography, photorealistic, 8k'
  },
  {
    name: 'Leah',
    age: 22,
    occupation: 'Fashion Blogger',
    personality: 'striking, confident',
    ethnicity: 'African',
    hairColor: 'black',
    eyeColor: 'brown',
    bodyType: 'curvy',
    description: 'Leah stands as a striking figure in the fashion world. At 22, her confident presence and impeccable sense of style have made her a rising star as a fashion blogger. Her piercing gaze and authentic personality resonate with thousands of followers.',
    prompt: 'high fashion editorial photography, stunning 22 year old African woman, natural curly afro hair, brown eyes, curvy figure, wearing elegant white strapless dress with gold jewelry, vibrant yellow/gold background, studio lighting, confident powerful pose, professional fashion photography, photorealistic, 8k'
  },
  {
    name: 'Stella',
    age: 20,
    occupation: 'Real Estate Agent',
    personality: 'confident, sophisticated',
    ethnicity: 'Caucasian',
    hairColor: 'brown',
    eyeColor: 'blue',
    bodyType: 'athletic',
    description: 'Stella is a confident 20-year-old real estate agent who exudes sophistication and poise. Her striking features and professional demeanor help her excel in the competitive world of property sales, while her warm personality makes clients feel valued.',
    prompt: 'professional business portrait, beautiful 20 year old woman, long wavy brown hair, blue eyes, athletic figure, wearing beige business suit with black blazer, modern office interior background, professional lighting, confident business pose, corporate photography, photorealistic, 8k'
  },
  {
    name: 'Ella',
    age: 27,
    occupation: 'Club Dancer',
    personality: 'captivating, graceful',
    ethnicity: 'Indian',
    hairColor: 'black',
    eyeColor: 'brown',
    bodyType: 'curvy',
    description: 'Ella is a captivating 27-year-old club dancer whose sizzling stage presence is only rivaled by her graceful movements. Her performances are mesmerizing, combining traditional dance with modern flair, leaving audiences spellbound every night.',
    prompt: 'professional cultural photography, beautiful 27 year old Indian woman, long black hair, brown eyes, curvy figure, wearing elegant orange/gold traditional Indian saree with jewelry, warm indoor setting with plants, professional studio lighting, elegant graceful pose, traditional fashion photography, photorealistic, 8k'
  },
  {
    name: 'Astrid',
    age: 24,
    occupation: 'Nurse',
    personality: 'caring, warm',
    ethnicity: 'Caucasian',
    hairColor: 'blonde',
    eyeColor: 'blue',
    bodyType: 'athletic',
    description: 'Astrid is a radiant 24-year-old nurse with a sparkling demeanor that lights up a room. Her caring nature and warm smile bring comfort to her patients, while her professional expertise ensures they receive the best care possible.',
    prompt: 'lifestyle portrait photography, beautiful 24 year old blonde woman, long blonde hair with glasses, blue eyes, athletic curvy figure, wearing casual white tank top, warm studio background, soft natural lighting, friendly casual pose, professional portrait, photorealistic, 8k'
  },
  {
    name: 'Olivia',
    age: 23,
    occupation: 'Gaming Sensation',
    personality: 'soothing, effortless',
    ethnicity: 'Caucasian',
    hairColor: 'red',
    eyeColor: 'green',
    bodyType: 'petite',
    description: 'Olivia is a 23-year-old gaming sensation with a soothing presence that effortlessly captivates her audience. Her natural charm and skill at gaming have made her a beloved streamer, with fans drawn to her authentic and relaxed streaming style.',
    prompt: 'professional lifestyle photography, beautiful 23 year old woman, long wavy auburn/brown hair, wearing casual beige shirt with brown suspenders, warm indoor background, soft natural lighting, friendly casual pose, lifestyle portrait, photorealistic, 8k'
  },
  {
    name: 'Ellie',
    age: 22,
    occupation: 'Waitress',
    personality: 'sparkling, fiery',
    ethnicity: 'Caucasian',
    hairColor: 'brown',
    eyeColor: 'blue',
    bodyType: 'athletic',
    description: 'Ellie is a sparkling 22-year-old waitress with a personality that\'s as fiery as her signature red lipstick. Her presence lights up any room with infectious energy and warmth.',
    prompt: 'professional beauty photography, stunning 22 year old woman, long wavy brown hair, piercing blue eyes, athletic figure, wearing elegant black halter dress, neutral warm background, glamorous makeup with bold lips, studio lighting, confident sensual pose, beauty photography, photorealistic, 8k'
  },
  {
    name: 'Agnes',
    age: 25,
    occupation: 'Socialite',
    personality: 'commanding, radiating',
    ethnicity: 'Mixed',
    hairColor: 'black',
    eyeColor: 'brown',
    bodyType: 'athletic',
    description: 'Agnes is a 25-year-old socialite with a commanding presence, radiating glamour and sophistication. Her refined taste and magnetic personality make her the center of attention at every event.',
    prompt: 'high fashion editorial photography, stunning 25 year old woman with olive/tan skin, long wavy black hair, brown eyes, athletic toned figure, wearing turquoise/teal bikini or swimwear, soft studio lighting, confident glamorous pose, professional fashion photography, photorealistic, 8k'
  },
  {
    name: 'Alice',
    age: 19,
    occupation: 'College Student',
    personality: 'infectious, flirtatious',
    ethnicity: 'Caucasian',
    hairColor: 'blonde',
    eyeColor: 'blue',
    bodyType: 'slim',
    description: 'Alice is a radiant 19-year-old college student whose infectious smile and flirtatious charm make her irresistible. Her youthful exuberance and natural beauty captivate everyone she meets.',
    prompt: 'outdoor lifestyle photography, beautiful 19 year old blonde woman, long blonde hair, blue eyes, slim figure, wearing elegant dark green dress, natural outdoor forest/garden background, soft natural daylight, warm friendly smile, lifestyle portrait, photorealistic, 8k'
  },
  {
    name: 'Selma',
    age: 24,
    occupation: 'Travel Blogger',
    personality: 'carefree, wanderer',
    ethnicity: 'Mixed',
    hairColor: 'black',
    eyeColor: 'brown',
    bodyType: 'athletic',
    description: 'Selma is a 24-year-old travel blogger who embodies the carefree spirit of a wanderer. Her exotic beauty and adventurous nature inspire thousands of followers to explore the world.',
    prompt: 'professional portrait photography, stunning 24 year old woman with exotic features, long straight black hair, striking blue/green eyes, athletic figure, dramatic makeup with dark eye makeup, dark background, mysterious intense gaze, beauty photography, photorealistic, 8k'
  },
  {
    name: 'Alma',
    age: 23,
    occupation: 'University Student',
    personality: 'radiant, joyful',
    ethnicity: 'Mixed',
    hairColor: 'brunette',
    eyeColor: 'brown',
    bodyType: 'curvy',
    description: 'Alma is a radiant 23-year-old university student whose infectious smile brings joy to everyone around her. Her playful spirit and natural beauty make her unforgettable.',
    prompt: 'summer lifestyle photography, beautiful 23 year old woman with tan skin, long wavy brown hair, brown eyes, curvy figure, wearing turquoise/blue bikini with straw hat, bright blue background, beach vacation vibes, sunny cheerful pose, professional lifestyle photography, photorealistic, 8k'
  },
  {
    name: 'Vera',
    age: 22,
    occupation: 'Night Shift Carrier',
    personality: 'softly-spoken, secret',
    ethnicity: 'Mixed',
    hairColor: 'brown',
    eyeColor: 'brown',
    bodyType: 'slim',
    description: 'Vera is a softly-spoken 22-year-old night shift carrier whose allure belies a secret, daring side. Her mysterious charm and elegant presence captivate those who cross her path.',
    prompt: 'professional portrait photography, beautiful 22 year old woman with olive complexion, long wavy brown hair with elegant accessories, brown eyes, slim elegant figure, wearing elegant beige/off-shoulder dress with earrings, soft neutral background, romantic soft lighting, elegant sophisticated pose, professional beauty photography, photorealistic, 8k'
  }
];

function buildSystemPrompt(character) {
  return `You are ${character.name}, a ${character.age}-year-old ${character.occupation}.

${character.description}

Personality: ${character.personality}

Speak naturally and stay in character. Be engaging, warm, and authentic in your responses.`;
}

async function generateImage(prompt) {
  console.log(`  🎨 Generating image...`);
  
  const negativePrompt = 'man, male, boy, men, masculine, multiple people, group, blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, logo, signature, cartoon, anime, 3d render, illustration, drawing, painting';
  
  const response = await fetch('https://api.novita.ai/v3/async/txt2img', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOVITA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      extra: { 
        response_image_type: 'jpeg',
        enable_nsfw_detection: false
      },
      request: {
        model_name: 'dreamshaper_8_93211.safetensors',
        prompt: prompt,
        negative_prompt: negativePrompt,
        width: 512,
        height: 768,
        image_num: 1,
        batch_size: 1,
        sampler_name: 'DPM++ 2M Karras',
        guidance_scale: 7,
        steps: 40,
        seed: -1
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Novita API error: ${await response.text()}`);
  }

  const data = await response.json();
  const taskId = data.task_id;
  console.log(`  ⏳ Task ID: ${taskId}`);

  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 3000));
    
    const progress = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${NOVITA_API_KEY}` }
    });
    
    if (!progress.ok) {
      attempts++;
      continue;
    }
    
    const pd = await progress.json();
    
    if (pd.task?.status === 'TASK_STATUS_SUCCEED') {
      console.log(`  ✅ Generated`);
      return pd.images[0].image_url;
    }
    
    if (pd.task?.status === 'TASK_STATUS_FAILED') {
      throw new Error('Failed');
    }
    
    attempts++;
  }

  throw new Error('Timeout');
}

async function saveCharacter(character, imageUrl) {
  console.log(`  💾 Saving to database...`);
  
  const systemPrompt = buildSystemPrompt(character);
  
  const payload = {
    name: character.name,
    age: character.age,
    image: imageUrl,          // Primary image field
    image_url: imageUrl,      // Backup image field
    description: character.description,
    personality: character.personality,
    occupation: character.occupation,
    body: character.bodyType,
    ethnicity: character.ethnicity,
    system_prompt: systemPrompt,
    is_public: true,
    is_new: true,
    voice: 'default',
    share_revenue: true,
    hobbies: 'Modeling, Fashion, Photography',
    language: 'English',
    relationship: 'Companion'
  };
  
  console.log(`  📝 Payload:`, JSON.stringify(payload, null, 2));
  
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/characters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ DB error (${response.status}):`, errorText);
        throw new Error(`DB error: ${errorText}`);
      }

      const data = await response.json();
      console.log(`  ✅ Saved to characters table - ID: ${data[0]?.id}`);
      
      // Also save to generated_images table for tracking
      try {
        await saveToGeneratedImages(character.name, character.prompt, imageUrl);
      } catch (imgError) {
        console.warn(`  ⚠️ Failed to save to generated_images (non-critical):`, imgError.message);
      }
      
      return data[0];
      
    } catch (error) {
      if (attempt < 5) {
        const wait = attempt * 2000;
        console.log(`  ⚠️  Retry ${attempt}/5 in ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw error;
      }
    }
  }
}

// Save to generated_images table for tracking
async function saveToGeneratedImages(characterName, prompt, imageUrl) {
  const payload = {
    user_id: '00000000-0000-0000-0000-000000000000', // System generated
    prompt: prompt,
    image_url: imageUrl,
    model_used: 'dreamshaper_8_93211.safetensors'
  };
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/generated_images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  
  if (response.ok) {
    console.log(`  ✅ Saved to generated_images table`);
  }
}

async function main() {
  console.log('\n🎨 REGENERATING EXACT MODELS FROM SCREENSHOTS\n');
  console.log(`📊 Total: ${EXACT_MODELS.length} characters\n`);
  console.log(`⏱️  Est. time: ${Math.ceil(EXACT_MODELS.length * 30 / 60)} minutes\n`);
  console.log(`🗄️  Database: ${SUPABASE_URL}`);
  console.log(`🪣  Storage Bucket: images`);
  console.log('='.repeat(70) + '\n');
  
  const results = { success: [], failed: [] };
  
  for (let i = 0; i < EXACT_MODELS.length; i++) {
    const char = EXACT_MODELS[i];
    console.log(`\n[${i + 1}/${EXACT_MODELS.length}] ${char.name} - ${char.occupation}`);
    console.log('─'.repeat(70));
    
    try {
      // Generate image with Novita AI
      console.log(`  🎨 Generating with Novita AI...`);
      const tempImageUrl = await generateImage(char.prompt);
      console.log(`  ✅ Temporary URL: ${tempImageUrl.substring(0, 80)}...`);
      
      // Generate a unique character ID
      const characterId = crypto.randomUUID();
      console.log(`  🆔 Character ID: ${characterId}`);
      
      // Upload to Supabase Storage for permanent URL
      const permanentUrl = await uploadToSupabaseStorage(tempImageUrl, characterId);
      
      // Save character to database
      const saved = await saveCharacter(char, permanentUrl);
      
      results.success.push({
        name: char.name,
        id: saved.id,
        imageUrl: permanentUrl
      });
      
      console.log(`  ✅ ${char.name} COMPLETE!`);
      console.log(`  🔗 Image URL: ${permanentUrl}\n`);
      
      if (i < EXACT_MODELS.length - 1) {
        console.log('  ⏸️  Waiting 2s before next generation...\n');
        await new Promise(r => setTimeout(r, 2000));
      }
      
    } catch (error) {
      console.error(`  ❌ FAILED: ${error.message}`);
      console.error(`  📋 Error stack:`, error.stack);
      results.failed.push({ 
        name: char.name, 
        error: error.message,
        stack: error.stack 
      });
      console.log('');
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ REGENERATION COMPLETE!');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${results.success.length}/${EXACT_MODELS.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${EXACT_MODELS.length}\n`);
  
  if (results.success.length > 0) {
    console.log('✨ Successfully Generated Characters:');
    results.success.forEach(c => {
      console.log(`   ✓ ${c.name} (ID: ${c.id})`);
      console.log(`     Image: ${c.imageUrl}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n⚠️  Failed Characters:');
    results.failed.forEach(c => {
      console.log(`   ✗ ${c.name}: ${c.error}`);
    });
  }
  
  console.log('\n📌 Next Steps:');
  console.log('   1. Check characters in database: SELECT * FROM characters WHERE is_new = true;');
  console.log('   2. View images in Supabase Storage bucket: images/characters/');
  console.log('   3. Test on frontend: Visit homepage and characters page');
  
  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Fatal:', error);
  process.exit(1);
});
