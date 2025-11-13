#!/usr/bin/env node

/**
 * Regenerate only the failed characters
 */

// Fix for Node.js fetch SSL issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const NOVITA_API_KEY = 'sk_SaCwNYi5f8Q-zqa7YqSttPVMos2xxkDTcJ3rK0jiQfk';
const SUPABASE_URL = 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';

// Only the failed characters
const FAILED_CHARACTERS = [
  {
    name: 'Ginah',
    age: 25,
    ethnicity: 'Caucasian',
    hairColor: 'blonde',
    eyeColor: 'blue',
    bodyType: 'slim',
    personality: 'friendly, outgoing, confident',
    occupation: 'Model',
    style: 'animated',
    description: 'Ginah shines with a radiant aura. Her 25 years of age and Colombian beauty exude confidence and grace. As a successful model, she brings elegance and poise to every interaction, with a warm personality that makes everyone feel at ease.'
  },
  {
    name: 'Agnes',
    age: 19,
    ethnicity: 'Caucasian',
    hairColor: 'brown',
    eyeColor: 'hazel',
    bodyType: 'curvy',
    personality: 'whimsical, creative',
    occupation: 'University Student',
    style: 'animated',
    description: 'Agnes is a whimsical university student whose bright, inquisitive spirit and playful nature bring joy to everyone around her. At 19, she approaches life with boundless curiosity and creative energy, always ready for the next adventure.'
  },
  {
    name: 'Leah',
    age: 22,
    ethnicity: 'African',
    hairColor: 'black',
    eyeColor: 'brown',
    bodyType: 'curvy',
    personality: 'striking, confident',
    occupation: 'Fashion Blogger',
    style: 'realistic',
    description: 'Leah stands as a striking figure in the fashion world. At 22, her confident presence and impeccable sense of style have made her a rising star as a fashion blogger. Her piercing gaze and authentic personality resonate with thousands of followers.'
  }
];

function buildImagePrompt(character) {
  if (character.style === 'animated') {
    return `3d animation style, ${character.age} year old ${character.ethnicity} woman, ${character.hairColor} hair, ${character.eyeColor} eyes, ${character.bodyType} body, beautiful animated character, smooth 3d rendering, pixar style, disney style, high quality 3d art, professional animation, expressive face, detailed features`;
  }
  return `natural photograph, real ${character.age} year old ${character.ethnicity} woman, ${character.hairColor} hair, ${character.eyeColor} eyes, ${character.bodyType} body type, natural beauty, candid photo, soft natural lighting, genuine smile, authentic, real person, professional photography, high resolution, natural skin texture, realistic, NOT ai generated looking`;
}

function buildSystemPrompt(character) {
  return `You are ${character.name}, a ${character.age}-year-old ${character.occupation}.

${character.description}

Personality: ${character.personality}

Speak naturally and stay in character. Be engaging, warm, and authentic in your responses.`;
}

async function generateImage(prompt, style) {
  console.log(`  🎨 Generating ${style} image...`);
  
  const negativePrompt = style === 'animated' 
    ? 'man, male, boy, men, masculine, multiple people, group, blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, realistic, photorealistic'
    : 'man, male, boy, men, masculine, multiple people, group, blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, cartoon, anime, artificial, fake looking, overly smooth skin, plastic skin, unrealistic, too perfect, instagram filter, heavy makeup, airbrushed';
  
  const modelName = style === 'animated'
    ? 'sd_xl_base_1.0.safetensors'
    : 'dreamshaper_8_93211.safetensors';
  
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
        model_name: modelName,
        prompt: prompt,
        negative_prompt: negativePrompt,
        width: 512,
        height: 768,
        image_num: 1,
        batch_size: 1,
        sampler_name: 'DPM++ 2M Karras',
        guidance_scale: style === 'animated' ? 7.5 : 6.5,
        steps: 35,
        seed: -1
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Novita API error: ${await response.text()}`);
  }

  const data = await response.json();
  const taskId = data.task_id;
  console.log(`  ⏳ Task ID: ${taskId}, waiting...`);

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
      console.log(`  ✅ Image generated successfully`);
      return pd.images[0].image_url;
    }
    
    if (pd.task?.status === 'TASK_STATUS_FAILED') {
      throw new Error('Image generation failed');
    }
    
    attempts++;
  }

  throw new Error('Image generation timeout');
}

async function saveCharacter(character, imageUrl) {
  console.log(`  💾 Saving ${character.name} to database...`);
  
  const systemPrompt = buildSystemPrompt(character);
  
  const payload = {
    name: character.name,
    age: character.age,
    image_url: imageUrl,
    description: character.description,
    personality: character.personality,
    occupation: character.occupation,
    body: character.bodyType,
    ethnicity: character.ethnicity,
    system_prompt: systemPrompt,
    is_public: true,
    is_new: true
  };
  
  // Retry up to 5 times with exponential backoff
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
        const error = await response.text();
        throw new Error(`Database save failed: ${error}`);
      }

      const data = await response.json();
      console.log(`  ✅ Saved to database with ID: ${data[0]?.id}`);
      return data[0];
      
    } catch (error) {
      if (attempt < 5) {
        const waitTime = attempt * 3000; // 3s, 6s, 9s, 12s
        console.log(`  ⚠️  Attempt ${attempt} failed, retrying in ${waitTime/1000}s...`);
        await new Promise(r => setTimeout(r, waitTime));
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  console.log('\n🔄 Regenerating failed characters...\n');
  console.log(`📊 Characters to generate: ${FAILED_CHARACTERS.length}\n`);
  console.log('='.repeat(70) + '\n');
  
  const results = { success: [], failed: [] };
  
  for (let i = 0; i < FAILED_CHARACTERS.length; i++) {
    const character = FAILED_CHARACTERS[i];
    console.log(`\n[${i + 1}/${FAILED_CHARACTERS.length}] ${character.name}`);
    console.log('─'.repeat(70));
    
    try {
      const prompt = buildImagePrompt(character);
      const imageUrl = await generateImage(prompt, character.style);
      const saved = await saveCharacter(character, imageUrl);
      
      results.success.push({
        name: character.name,
        id: saved.id,
        image_url: saved.image_url,
        style: character.style
      });
      
      console.log(`  ✅ ${character.name} (${character.style}) complete!\n`);
      
      if (i < FAILED_CHARACTERS.length - 1) {
        console.log('  ⏸️  Waiting 3 seconds...\n');
        await new Promise(r => setTimeout(r, 3000));
      }
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      results.failed.push({ name: character.name, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ COMPLETE!');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${results.success.length}/${FAILED_CHARACTERS.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${FAILED_CHARACTERS.length}\n`);
  
  if (results.success.length > 0) {
    console.log('✨ Successfully generated:');
    results.success.forEach(char => {
      console.log(`   - ${char.name} (${char.style}) - ID: ${char.id}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n⚠️  Still failed:');
    results.failed.forEach(char => {
      console.log(`   - ${char.name}: ${char.error}`);
    });
  }
  
  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
