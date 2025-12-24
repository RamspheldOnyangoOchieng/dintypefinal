import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get user from session cookies
        const cookieStore = await cookies();
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: {
                headers: {
                    cookie: cookieStore.toString()
                }
            }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('❌ Authentication failed:', authError?.message || 'No user');
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const characterId = params.id;
        console.log('🗑️  Deleting character:', characterId, 'for user:', user.id.substring(0, 8));

        // First, verify the character belongs to this user
        const { data: character, error: fetchError } = await supabase
            .from('characters')
            .select('id, user_id, name')
            .eq('id', characterId)
            .single();

        if (fetchError || !character) {
            console.log('❌ Character not found:', fetchError?.message);
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 404 }
            );
        }

        if (character.user_id !== user.id) {
            console.log('❌ Unauthorized: Character belongs to different user');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Delete the character
        const { error: deleteError } = await supabase
            .from('characters')
            .delete()
            .eq('id', characterId)
            .eq('user_id', user.id); // Extra safety check

        if (deleteError) {
            console.error('❌ Error deleting character:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete character' },
                { status: 500 }
            );
        }

        console.log('✅ Character deleted successfully:', character.name);

        return NextResponse.json({
            success: true,
            message: 'Character deleted successfully'
        });

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
