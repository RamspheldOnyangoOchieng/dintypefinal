const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
    console.error('No service role key found!');
    process.exit(1);
}

console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_KEY.length);
console.log('Key start:', SUPABASE_KEY.substring(0, 10));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testInsert() {
    console.log('Attempting insert...');
    const { data, error } = await supabase
        .from('attribute_images')
        .upsert({
            category: 'test_category',
            value: 'test_value',
            style: 'test_style',
            image_url: 'https://example.com/test.jpg',
            prompt: 'test prompt',
            width: 512,
            height: 768,
        }, {
            onConflict: 'category,value,style'
        })
        .select();

    if (error) {
        console.error('Insert failed:', error);
    } else {
        console.log('Insert success:', data);

        // Clean up
        await supabase.from('attribute_images').delete().eq('category', 'test_category');
    }
}

testInsert();
