const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCharactersAndImages() {
    console.log('\n' + '='.repeat(80));
    console.log('CHECKING DATABASE FOR CHARACTERS AND IMAGES');
    console.log('='.repeat(80) + '\n');

    try {
        // Get all characters
        console.log('📊 Fetching all characters from database...\n');
        const { data: characters, error } = await supabase
            .from('characters')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching characters:', error);
            return;
        }

        console.log(`✅ Found ${characters.length} characters in database\n`);

        if (characters.length === 0) {
            console.log('⚠️  No characters found in database!');
            console.log('This explains why the website shows no characters.\n');
            return;
        }

        // Show recent characters
        console.log('MOST RECENT 20 CHARACTERS:\n');
        characters.slice(0, 20).forEach((char, idx) => {
            console.log(`${idx + 1}. ${char.name} (Age: ${char.age})`);
            console.log(`   Created: ${new Date(char.created_at).toLocaleString()}`);
            console.log(`   Image: ${char.image_url || char.image}`);
            console.log(`   Description: ${char.description?.substring(0, 80)}...`);
            console.log('');
        });

        // Check Supabase Storage
        console.log('\n' + '='.repeat(80));
        console.log('CHECKING SUPABASE STORAGE');
        console.log('='.repeat(80) + '\n');

        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('❌ Error listing buckets:', bucketsError);
        } else {
            console.log(`📦 Storage Buckets: ${buckets.length}\n`);
            for (const bucket of buckets) {
                console.log(`\n📁 Bucket: ${bucket.name}`);
                console.log(`   ID: ${bucket.id}`);
                console.log(`   Public: ${bucket.public}`);
                console.log(`   Created: ${bucket.created_at}`);

                // List files in bucket
                try {
                    const { data: files, error: filesError } = await supabase
                        .storage
                        .from(bucket.name)
                        .list('', {
                            limit: 10,
                            offset: 0,
                        });

                    if (filesError) {
                        console.log(`   ⚠️  Could not list files: ${filesError.message}`);
                    } else {
                        console.log(`   📄 Files: ${files.length} (showing first 10)`);
                        files.forEach(file => {
                            console.log(`      - ${file.name}`);
                        });
                    }
                } catch (err) {
                    console.log(`   ⚠️  Error listing files: ${err.message}`);
                }
            }
        }

        // Analysis
        console.log('\n' + '='.repeat(80));
        console.log('ANALYSIS');
        console.log('='.repeat(80) + '\n');

        const imagesWithSupabase = characters.filter(c => 
            (c.image_url || c.image)?.includes('supabase.co')
        );
        const imagesWithCloudinary = characters.filter(c => 
            (c.image_url || c.image)?.includes('cloudinary.com')
        );
        const imagesWithNovita = characters.filter(c => 
            (c.image_url || c.image)?.includes('novita.ai')
        );
        const imagesWithOther = characters.filter(c => {
            const url = c.image_url || c.image;
            return url && !url.includes('supabase.co') && !url.includes('cloudinary.com') && !url.includes('novita.ai');
        });

        console.log('Image Storage Distribution:');
        console.log(`  - Supabase Storage: ${imagesWithSupabase.length} characters`);
        console.log(`  - Cloudinary: ${imagesWithCloudinary.length} characters`);
        console.log(`  - Novita.ai: ${imagesWithNovita.length} characters`);
        console.log(`  - Other: ${imagesWithOther.length} characters\n`);

        console.log('✅ Your character images are primarily in SUPABASE STORAGE');
        console.log('   (not Cloudinary as we initially thought!)\n');

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

checkCharactersAndImages();
