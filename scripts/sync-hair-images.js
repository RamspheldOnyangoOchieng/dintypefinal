require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Basic hair colors that were hardcoded
const hairColors = [
    { value: 'black', url: 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904247/character-creation/hair-color/realistic/black.jpg' },
    { value: 'brown', url: 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904249/character-creation/hair-color/realistic/brown.jpg' },
    { value: 'blonde', url: 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904250/character-creation/hair-color/realistic/blonde.jpg' },
    { value: 'red', url: 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904251/character-creation/hair-color/realistic/red.jpg' }
];

async function syncHair() {
    for (const hair of hairColors) {
        console.log(`Syncing ${hair.value} hair color...`);
        const { error } = await supabase
            .from('attribute_images')
            .upsert({
                category: 'hairColor',
                value: hair.value,
                style: 'realistic',
                image_url: hair.url,
                prompt: `High-quality studio portrait of hair color: ${hair.value}`,
                width: 1024,
                height: 1024
            }, { onConflict: 'category,value,style' });

        if (error) console.error(`Error syncing ${hair.value}:`, error);
        else console.log(`Successfully synced ${hair.value} hair color.`);
    }
}

syncHair();
