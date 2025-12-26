import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') || '/'

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
        })

        if (!error) {
            // Redirect to next page (successful confirmation)
            return NextResponse.redirect(new URL(next, request.url))
        }

        // If there's an error, log it
        console.error('Email confirmation error:', error)
    }

    // Redirect to error page if token invalid or missing
    return NextResponse.redirect(new URL('/auth/error?message=Invalid+confirmation+link', request.url))
}
