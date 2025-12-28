require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEyes() {
    try {
        const { data, error } = await supabase
            .from('attribute_images')
            .select('*')
            .eq('category', 'eyeColor');

        if (error) {
            console.error('Database error:', error);
            return;
        }

        console.log('EYE_COLORS_DB:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Script error:', err);
    }
}

checkEyes();
