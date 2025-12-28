import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
    try {
        // Get user from standardized server client
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('❌ Authentication failed:', authError?.message || 'No user');
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.log('✅ Fetching characters for user:', user.id.substring(0, 8));

        // Fetch user's characters ordered by most recent first
        const { data: characters, error } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching characters:', error);
            return NextResponse.json(
                { error: 'Failed to fetch characters' },
                { status: 500 }
            );
        }

        console.log(`✅ Found ${characters?.length || 0} characters`);

        // 4. Implement Lockdown logic
        const { getUserPlanInfo } = await import('@/lib/subscription-limits');
        const planInfo = await getUserPlanInfo(user.id);
        const isCurrentlyPremium = planInfo.planType === 'premium';
        const { data: adminUser } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
        const isAdmin = !!adminUser;

        const processedCharacters = (characters || []).map(char => {
            const charMetadata = (char.metadata as any) || {};
            const wasPremiumCreated = charMetadata.created_during_subscription === true;

            // Lock if it was created during premium but user is no longer premium (and not admin)
            const isLocked = wasPremiumCreated && !isCurrentlyPremium && !isAdmin;

            return {
                ...char,
                is_locked: isLocked
            };
        });

        return NextResponse.json({
            success: true,
            characters: processedCharacters
        });

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
