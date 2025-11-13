const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yrhexcjqwycfkjrmgplp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const premiumContent = [
    { section: 'main_title', content: 'Buy Tokens' },
    { section: 'main_subtitle', content: '100% anonymous. You can cancel anytime.' },
    { section: 'token_system_title', content: 'Token System' },
    { section: 'pay_as_you_go_title', content: 'Pay As You Go' },
    { section: 'purchase_intro', content: 'Purchase tokens to generate images. <span class="text-[#FF8C00] font-semibold">5 tokens per image.</span>' },
    { section: 'how_tokens_work_title', content: 'How Tokens Work' },
    { section: 'how_tokens_work_item_1', content: 'Each image generation costs 5 tokens' },
    { section: 'how_tokens_work_item_2', content: 'Tokens never expire' },
    { section: 'how_tokens_work_item_3', content: 'Buy in bulk for better value' },
    { section: 'select_package_title', content: 'Select Token Package' },
    { section: 'value_comparison_title', content: 'Value Comparison' },
    { section: 'why_buy_tokens_title', content: 'Why Buy Tokens?' },
    { section: 'why_buy_tokens_item_1', content: 'No recurring payments' },
    { section: 'why_buy_tokens_item_2', content: 'Pay only for what you need' },
    { section: 'why_buy_tokens_item_3', content: 'Higher quality image generation' },
    { section: 'security_badge_1', content: 'Antivirus Secured' },
    { section: 'security_badge_2', content: 'Privacy in bank statement' },
];

async function seedPremiumContent() {
    console.log('🌱 Seeding premium_page_content table...\n');
    
    // Check if data already exists
    const { data: existing, error: checkError } = await supabase
        .from('premium_page_content')
        .select('*');
    
    if (checkError) {
        console.error('❌ Error checking existing data:', checkError.message);
        return;
    }
    
    if (existing && existing.length > 0) {
        console.log(`⚠️  Found ${existing.length} existing rows. Clearing table first...`);
        const { error: deleteError } = await supabase
            .from('premium_page_content')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) {
            console.error('❌ Error clearing table:', deleteError.message);
            return;
        }
        console.log('✅ Table cleared\n');
    }
    
    // Insert seed data
    const { data, error } = await supabase
        .from('premium_page_content')
        .insert(premiumContent)
        .select();
    
    if (error) {
        console.error('❌ Error seeding data:', error.message);
        return;
    }
    
    console.log(`✅ Successfully seeded ${data.length} rows:\n`);
    data.forEach(row => {
        console.log(`   ✓ ${row.section}: ${row.content.substring(0, 50)}...`);
    });
    
    console.log('\n🎉 Premium content seeding complete!');
}

seedPremiumContent().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
