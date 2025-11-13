const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dhfg3suis',
  api_key: '321487164178956',
  api_secret: 'qD6PpaNK4TPjf1RIhxQQrhNX7Bo'
});

async function fetchAllImages() {
  try {
    console.log('Fetching all images from Cloudinary...\n');
    
    let allResources = [];
    let nextCursor = null;
    
    do {
      const options = {
        type: 'upload',
        max_results: 500,
        resource_type: 'image'
      };
      
      if (nextCursor) {
        options.next_cursor = nextCursor;
      }
      
      const result = await cloudinary.api.resources(options);
      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;
      
      console.log(`Fetched ${result.resources.length} images (total: ${allResources.length})`);
    } while (nextCursor);
    
    console.log(`\n=== TOTAL: ${allResources.length} images found ===\n`);
    
    // Group by folder
    const byFolder = {};
    allResources.forEach(resource => {
      const folder = resource.folder || 'root';
      if (!byFolder[folder]) {
        byFolder[folder] = [];
      }
      byFolder[folder].push(resource);
    });
    
    console.log('Images by folder:');
    for (const [folder, resources] of Object.entries(byFolder)) {
      console.log(`\n📁 ${folder}: ${resources.length} images`);
      resources.forEach(r => {
        console.log(`  - ${r.public_id}`);
        console.log(`    URL: ${r.secure_url}`);
        console.log(`    Created: ${r.created_at}`);
      });
    }
    
    // Save detailed JSON for restoration
    const fs = require('fs');
    const detailedData = allResources.map(r => ({
      public_id: r.public_id,
      secure_url: r.secure_url,
      url: r.url,
      format: r.format,
      width: r.width,
      height: r.height,
      created_at: r.created_at,
      folder: r.folder,
      bytes: r.bytes
    }));
    
    fs.writeFileSync(
      'cloudinary-images.json',
      JSON.stringify(detailedData, null, 2)
    );
    
    console.log('\n✅ Saved detailed data to cloudinary-images.json');
    
    // Also create a CSV for easy viewing
    const csv = [
      'Public ID,URL,Format,Width,Height,Created At,Folder',
      ...detailedData.map(r => 
        `"${r.public_id}","${r.secure_url}","${r.format}",${r.width},${r.height},"${r.created_at}","${r.folder || ''}"`
      )
    ].join('\n');
    
    fs.writeFileSync('cloudinary-images.csv', csv);
    console.log('✅ Saved CSV to cloudinary-images.csv');
    
  } catch (error) {
    console.error('Error fetching images:', error);
  }
}

fetchAllImages();
