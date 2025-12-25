import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Robustly checks if a user is an admin by checking multiple sources:
 * 1. public.admin_users table (Primary source of truth)
 * 2. public.profiles table (is_admin flag or role='admin')
 * 3. auth.users metadata (role='admin')
 */
export async function isUserAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
    try {
        // 1. Check admin_users table (Primary)
        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (adminUser) return true

        // 2. Check profiles logic (Fallback)
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, role')
            .eq('id', userId)
            .maybeSingle()

        // Check bool flag (new standard) OR string role (legacy)
        if (profile?.is_admin === true) return true
        if (profile?.role === 'admin') return true

        // 3. User metadata (Last resort)
        // Note: Calling getUser() again might be redundant if we already have the user object
        // but safe to do here if needed. Ideally caller passes user object if they have it.
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id === userId && user?.user_metadata?.role === 'admin') return true

        return false
    } catch (error) {
        console.error('Error verifying admin status:', error)
        return false
    }
}
