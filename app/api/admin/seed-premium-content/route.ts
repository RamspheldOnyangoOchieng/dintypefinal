import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        // Check if user is admin
        const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (!adminCheck) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }
        
        // Clear existing content
        const { error: deleteError } = await supabase
            .from('premium_page_content')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError && deleteError.code !== 'PGRST116') {
            console.error('Error clearing premium content:', deleteError);
        }
        
        // Insert seed data
        const { data, error } = await supabase
            .from('premium_page_content')
            .insert(premiumContent)
            .select();
        
        if (error) {
            console.error('Error seeding premium content:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${data.length} premium content items`,
            data
        });
        
    } catch (error) {
        console.error('Error in seed-premium-content API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
