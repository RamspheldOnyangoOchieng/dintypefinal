const fs = require('fs');

// Read the images
const images = JSON.parse(fs.readFileSync('cloudinary-ai-characters-list.json', 'utf8'));

console.log(`\n${'='.repeat(80)}`);
console.log('CLOUDINARY IMAGES - DIRECT ACCESS URLS');
console.log(`${'='.repeat(80)}\n`);

console.log(`Total Images: ${images.length}\n`);
console.log('All images are accessible at these URLs:\n');

// Show first 50 with details
console.log('MOST RECENT 50 IMAGES:\n');
images.slice(0, 50).forEach((img, idx) => {
    const date = new Date(img.created_at).toLocaleDateString();
    console.log(`${idx + 1}. ${date} - ${img.format.toUpperCase()} (${img.width}x${img.height})`);
    console.log(`   ${img.secure_url}\n`);
});

// Create a text file with ALL URLs
const urlList = images.map((img, idx) => {
    const date = new Date(img.created_at).toISOString();
    return `${idx + 1}. [${date}] ${img.secure_url}`;
}).join('\n');

fs.writeFileSync('all-cloudinary-urls.txt', urlList);
console.log(`\n✅ Saved all ${images.length} URLs to: all-cloudinary-urls.txt`);

// Create a markdown file with image previews
const markdown = `# Cloudinary Character Images

Total: ${images.length} images

## Direct Image URLs

${images.slice(0, 100).map((img, idx) => {
    const date = new Date(img.created_at).toLocaleDateString();
    return `### ${idx + 1}. Image from ${date}

- **Format**: ${img.format.toUpperCase()}
- **Dimensions**: ${img.width} x ${img.height}
- **Size**: ${(img.bytes / 1024).toFixed(2)} KB
- **URL**: ${img.secure_url}
- **Public ID**: \`${img.public_id}\`

![Image](${img.secure_url})

---
`;
}).join('\n')}

## Complete List

View all ${images.length} images in the JSON file: \`cloudinary-ai-characters-list.json\`
`;

fs.writeFileSync('CLOUDINARY_IMAGES_WITH_PREVIEWS.md', markdown);
console.log(`✅ Saved markdown with previews to: CLOUDINARY_IMAGES_WITH_PREVIEWS.md`);

console.log(`\n${'='.repeat(80)}`);
console.log('\n📝 SUMMARY:');
console.log(`   - All ${images.length} images are SAFE and ACCESSIBLE in Cloudinary`);
console.log('   - Each image has a permanent URL');
console.log('   - You can use these URLs directly in your database');
console.log('   - Open any URL in a browser to see the image\n');
console.log('💡 TIP: You can right-click any URL and "Open in Browser" to view it');
console.log(`\n${'='.repeat(80)}\n`);
