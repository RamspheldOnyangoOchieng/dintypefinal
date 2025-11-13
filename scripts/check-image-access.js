const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dhfg3suis',
  api_key: '321487164178956',
  api_secret: 'qD6PpaNK4TPjf1RIhxQQrhNX7Bo'
});

// Read the images list
const images = JSON.parse(fs.readFileSync('cloudinary-ai-characters-list.json', 'utf8'));

console.log(`\n${'='.repeat(80)}`);
console.log('CLOUDINARY IMAGE ACCESS CHECK');
console.log(`${'='.repeat(80)}\n`);

console.log(`Total images to check: ${images.length}\n`);
console.log('⚠️  The images are returning 401 (Unauthorized)');
console.log('This means they are set to PRIVATE in Cloudinary\n');

console.log('OPTIONS TO FIX THIS:\n');

console.log('1. LOGIN TO CLOUDINARY DASHBOARD:');
console.log('   - Go to: https://cloudinary.com/console');
console.log('   - Navigate to: Media Library > ai-characters folder');
console.log('   - Select all images');
console.log('   - Make them public\n');

console.log('2. USE THIS SCRIPT TO MAKE THEM PUBLIC:');
console.log('   Run: node scripts/make-images-public.js\n');

console.log('3. CHECK YOUR CLOUDINARY SETTINGS:');
console.log('   - Media Library > Settings');
console.log('   - Ensure "Delivery Type" is set to "Public"\n');

console.log(`${'='.repeat(80)}\n`);

// Ask if user wants to make images public
console.log('Would you like to make the first 10 images public as a test? (y/n)');
console.log('Note: This will use the Cloudinary API to update access settings\n');

// Function to make images public (commented out for safety)
async function makeImagesPublic(limit = 10) {
  console.log(`\nAttempting to make ${limit} images public...\n`);
  
  const testImages = images.slice(0, limit);
  
  for (let i = 0; i < testImages.length; i++) {
    const img = testImages[i];
    try {
      console.log(`${i+1}. Processing: ${img.public_id}`);
      
      const result = await cloudinary.api.update(img.public_id, {
        type: 'upload',
        resource_type: 'image',
        access_mode: 'public'
      });
      
      console.log(`   ✅ Success! Now accessible at: ${result.secure_url}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Test complete!');
  console.log('Try opening one of the URLs above in your browser to verify.\n');
}

// Uncomment the line below to run the function
// makeImagesPublic(10);

console.log('📝 RECOMMENDATION:');
console.log('The easiest solution is to login to Cloudinary dashboard and make the folder public.');
console.log(`Dashboard: https://cloudinary.com/console/c-f6bce6f4a47b1b1da5342ab6cd6df6/media_library/folders/home\n`);
