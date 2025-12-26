import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ count: 0, authenticated: false })
        }

        // Count user's characters
        const { count, error } = await supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (error) {
            console.error('Error counting characters:', error)
            return NextResponse.json({ count: 0, authenticated: true, error: error.message })
        }

        return NextResponse.json({
            count: count || 0,
            authenticated: true,
            isNewUser: (count || 0) === 0
        })
    } catch (error) {
        console.error('Server error:', error)
        return NextResponse.json({
            count: 0,
            authenticated: false,
            error: 'Server error'
        }, { status: 500 })
    }
}
