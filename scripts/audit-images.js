const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfjptqdkthmejxpwbmvq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmanB0cWRrdGhtZWp4cHdibXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NTIyMCwiZXhwIjoyMDY4NjcxMjIwfQ.wVBiVf-fmg3KAng-QN9ApxhjVkgKxj7L2aem7y1iPT4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const REQUIRED = {
    ethnicity: ['caucasian', 'latina', 'asian', 'african', 'indian'],
    eye_color: ['brown', 'blue', 'green', 'hazel', 'grey'],
    hair_style: ['straight', 'curly', 'bangs', 'short', 'long', 'bun', 'ponytail'],
    hair_color: ['black', 'brown', 'blonde', 'red', 'silver', 'blue'],
    body: ['petite', 'slim', 'athletic', 'voluptuous', 'curvy'],
    breast_size: ['small', 'medium', 'large', 'huge', 'flat'],
    butt_size: ['small', 'medium', 'large', 'athletic', 'skinny'],
    personality: ['caregiver', 'sage', 'innocent', 'jester', 'temptress', 'dominant', 'submissive', 'lover', 'nympho', 'mean', 'confidant', 'experimenter'],
    relationship: ['stranger', 'school-mate', 'colleague', 'mentor', 'girlfriend', 'sex-friend', 'wife', 'mistress', 'friend', 'best-friend', 'step-sister', 'step-mom'],
    eye_shape: ['almond', 'round', 'monolid', 'hooded', 'downturned', 'upturned'],
    outfit: ['bikini', 'dress', 'lingerie', 'casual', 'sporty', 'office', 'uniform', 'traditional']
};

async function check() {
    const { data: images, error } = await supabase
        .from('attribute_images')
        .select('category, value, style');

    if (error) {
        console.error('Error fetching images:', error);
        return;
    }

    console.log(`Found ${images.length} images in database.\n`);

    for (const style of ['realistic', 'anime']) {
        console.log(`\n--- STYLE: ${style.toUpperCase()} ---`);
        for (const [category, values] of Object.entries(REQUIRED)) {
            console.log(`\nCategory: ${category}`);
            for (const value of values) {
                const found = images.find(img =>
                    (img.category === category || (category === 'hair_color' && img.category === 'hair-color') || (category === 'eye_color' && img.category === 'eye-color') || (category === 'breast_size' && img.category === 'breast-size') || (category === 'butt_size' && img.category === 'butt-size')) &&
                    img.value.toLowerCase() === value.toLowerCase() &&
                    img.style === style
                );

                if (found) {
                    process.stdout.write(`  ✅ ${value.padEnd(15)}`);
                } else {
                    process.stdout.write(`  ❌ ${value.padEnd(15)} MISSING`);
                }
            }
            console.log();
        }
    }
}

check();
