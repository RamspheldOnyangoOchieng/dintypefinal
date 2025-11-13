import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    console.log('[TEST] All cookies:', allCookies)
    
    const supabaseCookies = allCookies.filter(c => c.name.includes('sb-'))
    
    return NextResponse.json({
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
      supabaseTokens: supabaseCookies.map(c => c.name)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
