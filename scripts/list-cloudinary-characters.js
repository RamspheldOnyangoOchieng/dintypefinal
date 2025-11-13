const fs = require('fs');

// Read Cloudinary images data
const cloudinaryImages = JSON.parse(fs.readFileSync('cloudinary-images.json', 'utf8'));

// Filter only ai-characters folder images
const aiCharacterImages = cloudinaryImages
  .filter(img => img.public_id.startsWith('ai-characters/'))
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

console.log(`\n${'='.repeat(80)}`);
console.log(`Found ${aiCharacterImages.length} AI Character Images in Cloudinary`);
console.log(`${'='.repeat(80)}\n`);

// Group by month for better overview
const byMonth = {};
aiCharacterImages.forEach(img => {
  const date = new Date(img.created_at);
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (!byMonth[monthKey]) {
    byMonth[monthKey] = [];
  }
  byMonth[monthKey].push(img);
});

console.log('Images by Month:');
Object.keys(byMonth).sort().reverse().forEach(month => {
  console.log(`\n📅 ${month}: ${byMonth[month].length} images`);
});

console.log(`\n${'='.repeat(80)}\n`);

// Show recent images
console.log('Most Recent 20 AI Character Images:\n');
aiCharacterImages.slice(0, 20).forEach((img, idx) => {
  console.log(`${idx + 1}. Created: ${img.created_at}`);
  console.log(`   Public ID: ${img.public_id}`);
  console.log(`   URL: ${img.secure_url}`);
  console.log(`   Dimensions: ${img.width}x${img.height}, Size: ${(img.bytes / 1024).toFixed(2)} KB`);
  console.log('');
});

console.log(`\n${'='.repeat(80)}\n`);

// Create a comprehensive report
const report = {
  total_images: aiCharacterImages.length,
  date_range: {
    oldest: aiCharacterImages[aiCharacterImages.length - 1]?.created_at,
    newest: aiCharacterImages[0]?.created_at
  },
  by_month: Object.fromEntries(
    Object.entries(byMonth).map(([month, imgs]) => [month, imgs.length])
  ),
  by_format: {},
  total_size_mb: 0
};

aiCharacterImages.forEach(img => {
  report.by_format[img.format] = (report.by_format[img.format] || 0) + 1;
  report.total_size_mb += img.bytes / (1024 * 1024);
});

console.log('📊 Summary Report:');
console.log(JSON.stringify(report, null, 2));

// Save detailed list
fs.writeFileSync(
  'cloudinary-ai-characters-list.json',
  JSON.stringify(aiCharacterImages, null, 2)
);

console.log('\n✅ Saved detailed list to: cloudinary-ai-characters-list.json');

// Create a simple CSV for easy viewing
const csv = [
  'Created At,Public ID,URL,Format,Width,Height,Size (KB)',
  ...aiCharacterImages.map(img => 
    `"${img.created_at}","${img.public_id}","${img.secure_url}","${img.format}",${img.width},${img.height},${(img.bytes / 1024).toFixed(2)}`
  )
].join('\n');

fs.writeFileSync('cloudinary-ai-characters-list.csv', csv);
console.log('✅ Saved CSV to: cloudinary-ai-characters-list.csv');

console.log(`\n${'='.repeat(80)}`);
console.log('\n💡 Next Steps:');
console.log('1. Check the CSV file to see all your character images');
console.log('2. These images are safely stored in Cloudinary');
console.log('3. You can restore them to your database using the image URLs');
console.log('\nAll image URLs are in the format:');
console.log('https://res.cloudinary.com/dhfg3suis/image/upload/v[version]/ai-characters/[id].[format]\n');
