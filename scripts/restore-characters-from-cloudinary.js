const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read Cloudinary images data
const cloudinaryImages = JSON.parse(fs.readFileSync('cloudinary-images.json', 'utf8'));

// Filter only ai-characters folder images
const aiCharacterImages = cloudinaryImages.filter(img => 
  img.public_id.startsWith('ai-characters/')
);

console.log(`Found ${aiCharacterImages.length} AI character images in Cloudinary\n`);

// Initialize Supabase client
const supabase = createClient(
  'https://qfjptqdkthmejxpwbmvq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4'
);

async function checkDatabase() {
  try {
    console.log('Checking current characters in database...\n');
    
    const { data: characters, error } = await supabase
      .from('characters')
      .select('id, name, image, image_url, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching characters:', error);
      return;
    }
    
    console.log(`Total characters in database: ${characters.length}\n`);
    
    if (characters.length > 0) {
      console.log('Recent characters:');
      characters.slice(0, 10).forEach(char => {
        console.log(`  - ${char.name} (${char.created_at})`);
        console.log(`    Image URL: ${char.image_url || char.image}`);
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Find Cloudinary images that might be missing from DB
    const dbImageUrls = new Set(characters.map(c => c.image_url || c.image));
    const cloudinaryUrls = new Set(aiCharacterImages.map(img => img.secure_url));
    
    // Images in Cloudinary but not in DB
    const missingInDB = aiCharacterImages.filter(img => !dbImageUrls.has(img.secure_url));
    
    console.log(`\n📊 Analysis:`);
    console.log(`  - Images in Cloudinary (ai-characters): ${aiCharacterImages.length}`);
    console.log(`  - Characters in Database: ${characters.length}`);
    console.log(`  - Images in Cloudinary NOT in Database: ${missingInDB.length}\n`);
    
    if (missingInDB.length > 0) {
      console.log('⚠️  Missing images (in Cloudinary but not in DB):');
      missingInDB.forEach((img, idx) => {
        console.log(`\n${idx + 1}. Public ID: ${img.public_id}`);
        console.log(`   URL: ${img.secure_url}`);
        console.log(`   Created: ${img.created_at}`);
        console.log(`   Size: ${(img.bytes / 1024).toFixed(2)} KB`);
      });
      
      // Save missing images to a file for restoration
      fs.writeFileSync(
        'missing-character-images.json',
        JSON.stringify(missingInDB, null, 2)
      );
      console.log('\n✅ Saved missing images to missing-character-images.json');
      
      // Also create a CSV for easy viewing
      const csv = [
        'Public ID,URL,Created At,Size (KB),Width,Height',
        ...missingInDB.map(img => 
          `"${img.public_id}","${img.secure_url}","${img.created_at}",${(img.bytes / 1024).toFixed(2)},${img.width},${img.height}`
        )
      ].join('\n');
      
      fs.writeFileSync('missing-character-images.csv', csv);
      console.log('✅ Saved CSV to missing-character-images.csv');
    } else {
      console.log('✅ All Cloudinary images are in the database!');
    }
    
    // Also check for images in DB that are missing from Cloudinary
    const missingInCloudinary = characters.filter(char => {
      const url = char.image_url || char.image;
      return url && url.includes('cloudinary.com') && !cloudinaryUrls.has(url);
    });
    
    if (missingInCloudinary.length > 0) {
      console.log(`\n⚠️  ${missingInCloudinary.length} characters have Cloudinary URLs that don't exist in Cloudinary anymore:`);
      missingInCloudinary.slice(0, 10).forEach(char => {
        console.log(`  - ${char.name}: ${char.image_url || char.image}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
