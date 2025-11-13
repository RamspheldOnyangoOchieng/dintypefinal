/**
 * Generate and store all attribute selection images
 * Run with: node scripts/generate-selection-images.js
 */
const fetch = require('node-fetch');

const NOVITA_API_KEY = 'sk_SaCwNYi5f8Q-zqa7YqSttPVMos2xxkDTcJ3rK0jiQfk';
const SUPABASE_URL = 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';

// Define all attributes to generate images for
const ATTRIBUTES = {
  age: {
    realistic: ['18-19', '20s', '30s', '40s', '50s', '60s', '70+'],
    anime: ['18-19', '20s', '30s', '40s', '50s', '60s', '70+']
  },
  body: {
    realistic: ['Muscular', 'Athletic', 'Slim', 'Chubby', 'Cub', 'Average', 'Curvy'],
    anime: ['Muscular', 'Athletic', 'Slim', 'Chubby', 'Cub', 'Average', 'Curvy']
  },
  ethnicity: {
    realistic: ['Caucasian', 'Asian', 'Arab', 'Indian', 'Latina', 'African', 'Mixed'],
    anime: ['Caucasian', 'Asian', 'Arab', 'Indian', 'Latina', 'African', 'Mixed']
  },
  hair_style: {
    realistic: ['Straight', 'Wavy', 'Curly', 'Coily', 'Braided', 'Bun', 'Ponytail', 'Bob'],
    anime: ['Straight', 'Wavy', 'Curly', 'Coily', 'Braided', 'Bun', 'Ponytail', 'Bob']
  },
  hair_length: {
    realistic: ['Bald', 'Buzz Cut', 'Short', 'Shoulder', 'Mid-Back', 'Waist', 'Hip', 'Floor'],
    anime: ['Bald', 'Buzz Cut', 'Short', 'Shoulder', 'Mid-Back', 'Waist', 'Hip', 'Floor']
  },
  hair_color: {
    realistic: ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Platinum', 'Red', 'Auburn', 'Gray', 'White'],
    anime: ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Platinum', 'Red', 'Auburn', 'Gray', 'White']
  },
  eye_color: {
    realistic: ['Brown', 'Dark Brown', 'Amber', 'Hazel', 'Green', 'Blue', 'Light Blue', 'Gray', 'Violet', 'Heterochromia'],
    anime: ['Brown', 'Dark Brown', 'Amber', 'Hazel', 'Green', 'Blue', 'Light Blue', 'Gray', 'Violet', 'Heterochromia']
  },
  eye_shape: {
    realistic: ['Almond', 'Round', 'Hooded', 'Monolid', 'Upturned', 'Downturned', 'Close-Set', 'Wide-Set', 'Deep-Set', 'Prominent'],
    anime: ['Almond', 'Round', 'Hooded', 'Monolid', 'Upturned', 'Downturned', 'Close-Set', 'Wide-Set', 'Deep-Set', 'Prominent']
  },
  lip_shape: {
    realistic: ['Full', 'Thin', 'Heart-Shaped', 'Bow-Shaped', 'Round', 'Wide', 'Heavy Bottom', 'Heavy Top', 'Downturned', 'Upturned'],
    anime: ['Full', 'Thin', 'Heart-Shaped', 'Bow-Shaped', 'Round', 'Wide', 'Heavy Bottom', 'Heavy Top', 'Downturned', 'Upturned']
  },
  personality: {
    realistic: ['Caregiver', 'Sage', 'Innocent', 'Jester', 'Temptress', 'Dominant', 'Submissive', 'Lover', 'Nympho', 'Mean', 'Confidant', 'Experimenter'],
    anime: ['Caregiver', 'Sage', 'Innocent', 'Jester', 'Temptress', 'Dominant', 'Submissive', 'Lover', 'Nympho', 'Mean', 'Confidant', 'Experimenter']
  },
  relationship: {
    realistic: ['Stranger', 'School-Mate', 'Colleague', 'Mentor', 'Girlfriend', 'Sex-Friend', 'Wife', 'Mistress', 'Friend', 'Best-Friend', 'Step-Sister', 'Step-Mom'],
    anime: ['Stranger', 'School-Mate', 'Colleague', 'Mentor', 'Girlfriend', 'Sex-Friend', 'Wife', 'Mistress', 'Friend', 'Best-Friend', 'Step-Sister', 'Step-Mom']
  },
  face_shape: {
    realistic: ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Triangle', 'Oblong', 'Rectangle', 'Pear', 'Long'],
    anime: ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Triangle', 'Oblong', 'Rectangle', 'Pear', 'Long']
  },
  hips: {
    realistic: ['Narrow', 'Moderate', 'Wide', 'Pear', 'Hip Dips', 'Round Hips'],
    anime: ['Narrow', 'Moderate', 'Wide', 'Pear', 'Hip Dips', 'Round Hips']
  },
  bust: {
    realistic: ['Petite', 'Small', 'Medium', 'Full', 'Large', 'Very Large'],
    anime: ['Petite', 'Small', 'Medium', 'Full', 'Large', 'Very Large']
  }
};

function buildPrompt(category, value, style) {
  // Base - ONE beautiful woman only
  const base = 'single beautiful woman, solo female, one person only, beautiful young lady';
  
  let specificPrompt = '';
  
  // Category-specific prompts - SHOW WHAT MATTERS
  if (category === 'age') {
    specificPrompt = `${value} year old woman, full body portrait, beautiful ${value} woman, elegant pose`;
  } 
  else if (category === 'body') {
    specificPrompt = `${value} body type, ${value} physique, full body shot, standing pose, showing body shape, beautiful ${value} woman`;
  }
  else if (category === 'ethnicity') {
    specificPrompt = `${value} woman, ${value} beauty, ${value} features, portrait`;
  }
  else if (category === 'hair_style') {
    specificPrompt = `${value} hairstyle, beautiful hair, focus on hair, clear ${value} hair styling`;
  }
  else if (category === 'hair_length') {
    specificPrompt = `${value} length hair, hair length visible, showing ${value} hair`;
  }
  else if (category === 'hair_color') {
    specificPrompt = `${value} hair color, vibrant ${value} hair, clear hair color`;
  }
  else if (category === 'eye_color') {
    specificPrompt = `${value} eyes, beautiful ${value} eye color, face close-up, expressive eyes`;
  }
  else if (category === 'eye_shape') {
    specificPrompt = `${value} eye shape, ${value} eyes, face portrait, beautiful eyes`;
  }
  else if (category === 'lip_shape') {
    specificPrompt = `${value} lips, ${value} lip shape, face close-up, beautiful lips`;
  }
  else if (category === 'face_shape') {
    specificPrompt = `${value} face shape, ${value} facial structure, portrait`;
  }
  else if (category === 'bust') {
    specificPrompt = `${value} bust, ${value} chest, upper body portrait, elegant pose`;
  }
  else if (category === 'hips') {
    specificPrompt = `${value} hips, ${value} hip shape, full body, standing pose`;
  }
  else if (category === 'personality' || category === 'relationship') {
    specificPrompt = `${value} personality, ${value} character, expressive portrait, beautiful woman`;
  }
  
  if (style === 'anime') {
    return `${base}, ${specificPrompt}, anime style, anime girl, beautiful anime character, high quality anime art, detailed, vibrant colors, professional anime illustration`;
  } else {
    return `${base}, ${specificPrompt}, photorealistic, professional photography, high quality, detailed, beautiful lighting, sharp focus, studio quality`;
  }
}

async function generateWithNovita(prompt, category, value, style) {
  console.log(`  🎨 Generating: ${prompt.substring(0, 80)}...`);
  
  // ABSOLUTE negative prompt - what we DON'T want
  const negativePrompt = [
    // NO MALES - ABSOLUTELY NOT
    'man', 'male', 'boy', 'men', 'masculine', 'beard', 'mustache', 'guy', 'dude',
    // NO MULTIPLE PEOPLE
    'multiple people', 'two people', 'group', 'crowd', 'couple', 'many people', 'several people',
    // NO NON-HUMANS
    'animal', 'creature', 'monster', 'robot', 'alien', 'fantasy creature',
    // NO BAD COMPOSITION
    'multiple images', 'collage', 'grid', 'split screen', 'multiple panels',
    // NO BAD QUALITY
    'blurry', 'low quality', 'distorted', 'deformed', 'ugly', 'bad anatomy',
    'watermark', 'text', 'signature', 'logo'
  ].join(', ');
  
  // Use the BEST model for realistic women
  const modelName = style === 'anime' 
    ? 'sd_xl_base_1.0.safetensors'
    : 'dreamshaper_8_93211.safetensors'; // Better for realistic women
  
  const res = await fetch('https://api.novita.ai/v3/async/txt2img', {
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
        image_num: 1,  // ONLY ONE IMAGE
        batch_size: 1,  // ONLY ONE BATCH
        sampler_name: 'DPM++ 2M Karras',
        guidance_scale: 7.5,
        steps: 30,
        seed: -1
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Novita API error: ${await res.text()}`);
  }

  const data = await res.json();
  const taskId = data.task_id;

  // Poll for completion
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 2000));
    
    const progress = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${NOVITA_API_KEY}` }
    });
    
    if (!progress.ok) {
      attempts++;
      continue;
    }
    
    const pd = await progress.json();
    
    if (pd.task?.status === 'TASK_STATUS_SUCCEED') {
      console.log(`  ✅ Generated successfully`);
      return pd.images[0].image_url;
    }
    
    if (pd.task?.status === 'TASK_STATUS_FAILED') {
      throw new Error('Image generation failed');
    }
    
    attempts++;
  }

  throw new Error('Image generation timeout');
}

async function uploadToSupabase(imageBuffer, fileName) {
  console.log('  📤 Uploading to Supabase storage...');
  console.log(`  📦 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`  📁 File path: attribute-images/${fileName}.jpg`);
  
  try {
    // Upload to Supabase storage using REST API
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/attributes/attribute-images/${fileName}.jpg`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    
    // Get public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/attributes/attribute-images/${fileName}.jpg`;
    console.log(`  ✅ Uploaded: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error(`  ❌ Upload error:`, error.message);
    throw error;
  }
}

async function saveToDatabase(category, value, style, imageUrl, prompt) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/attribute_images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      category,
      value,
      style,
      image_url: imageUrl,
      prompt,
      width: 512,
      height: 768
    })
  });

  if (!res.ok) {
    const error = await res.text();
    // Ignore duplicate errors
    if (!error.includes('duplicate') && !error.includes('unique')) {
      throw new Error(`Database save failed: ${error}`);
    }
  }
}

async function generateAndStoreImage(category, value, style) {
  const key = `${category}-${value}-${style}`;
  console.log(`\n📸 Processing: ${key}`);
  
  try {
    // Build prompt
    const prompt = buildPrompt(category, value, style);
    
    // Generate image with strict female-only parameters
    const novitaUrl = await generateWithNovita(prompt, category, value, style);
    
    // Download image from Novita
    const imageResponse = await fetch(novitaUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Upload to Supabase
    const fileName = `${category}-${value.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${style}`;
    const publicUrl = await uploadToSupabase(imageBuffer, fileName);
    
    // Save to database
    console.log(`  💾 Saving to database...`);
    await saveToDatabase(category, value, style, publicUrl, prompt);
    
    console.log(`  ✅ Complete: ${publicUrl}`);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting attribute image generation...\n');
  
  let total = 0;
  let success = 0;
  let failed = 0;
  
  // Count total images needed
  for (const [category, styles] of Object.entries(ATTRIBUTES)) {
    for (const [style, values] of Object.entries(styles)) {
      total += values.length;
    }
  }
  
  console.log(`📊 Total images to generate: ${total}\n`);
  console.log(`⏱️  Estimated time: ${Math.round(total * 25 / 60)} minutes\n`);
  
  const startTime = Date.now();
  
  // Generate all images
  for (const [category, styles] of Object.entries(ATTRIBUTES)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📂 Category: ${category.toUpperCase()}`);
    console.log('='.repeat(60));
    
    for (const [style, values] of Object.entries(styles)) {
      console.log(`\n🎨 Style: ${style}`);
      
      for (const value of values) {
        const result = await generateAndStoreImage(category, value, style);
        
        if (result.success) {
          success++;
        } else {
          failed++;
        }
        
        console.log(`\n📊 Progress: ${success + failed}/${total} (${success} ✅, ${failed} ❌)`);
        
        // Small delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 GENERATION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${success}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log('='.repeat(60));
}

main().catch(console.error);
