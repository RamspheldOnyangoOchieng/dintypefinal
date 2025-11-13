const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkImages() {
  console.log('📊 Checking images in database...\n');
  
  const { data, error, count } = await supabase
    .from('attribute_images')
    .select('category, value, style, image_url', { count: 'exact' });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Total images in database: ${count}\n`);
  
  // Group by category
  const categories = {};
  data.forEach(img => {
    if (!categories[img.category]) {
      categories[img.category] = { realistic: [], anime: [] };
    }
    if (img.style === 'realistic') {
      categories[img.category].realistic.push(img.value);
    } else {
      categories[img.category].anime.push(img.value);
    }
  });
  
  // Display results
  Object.keys(categories).sort().forEach(category => {
    const cat = categories[category];
    console.log(`📁 ${category}:`);
    console.log(`   Realistic: ${cat.realistic.length} images [${cat.realistic.join(', ')}]`);
    console.log(`   Anime: ${cat.anime.length} images [${cat.anime.join(', ')}]`);
    console.log('');
  });
  
  // Show sample URLs
  console.log('📸 Sample image URLs:');
  data.slice(0, 5).forEach(img => {
    console.log(`   ${img.category}-${img.value}-${img.style}:`);
    console.log(`   ${img.image_url}`);
  });
}

checkImages();
