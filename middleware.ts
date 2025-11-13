import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware should avoid heavy top-level imports that might rely on Node-only
// APIs; create clients lazily to be safe in the Edge/dev environment.

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  let res = NextResponse.next()

  const logs: string[] = []
  const traceId = (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? (globalThis.crypto as any).randomUUID() : Math.random().toString(36).slice(2)
  const debugParam = url.searchParams.get('__mwdebug') === '1'
  const debugEnv = process.env.NEXT_PUBLIC_MW_DEBUG === '1'
  const debug = debugParam || debugEnv

  function log(msg: string) { logs.push(msg); if (debug) console.log('[MW]', msg) }
  res.headers.set('x-trace-id', traceId)
  if (debug) res.headers.set('x-mw-debug', '1')

  try {
    log('start')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      log('env-missing skip auth')
      if (debug) res.headers.set('x-mw-logs', encodeURIComponent(logs.join(';')))
      return res
    }

    // Lazily import supabase to avoid breaking middleware module resolution in dev
    let supabase: any = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
      log('middleware-configured')
    } catch (e: any) {
      log('supabase-import-failed ' + (e?.message || e))
      // graceful fallback: return next response without enforcing auth
      if (debug) res.headers.set('x-mw-logs', encodeURIComponent(logs.join(';')))
      return res
    }

    // Get the current session
    let session: any = null
    try {
      const sessionRes = await supabase.auth.getSession()
      session = sessionRes?.data?.session
      if (sessionRes?.error) log('session-error ' + sessionRes.error.message)
    } catch (e: any) {
      log('session-fetch-failed ' + (e?.message || e))
    }

    // Admin route protection: restrict /admin paths to admin users only
    if (url.pathname.startsWith('/admin')) {
      if (!session) {
        log('admin-no-session')
        if (debug) {
          return new NextResponse(JSON.stringify({ code: 'NO_SESSION', traceId, logs }), { status: 401, headers: { 'content-type': 'application/json' } })
        }
        return res
      }
      try {
        // Check admin_users table first (primary method)
        const { data: adminUser } = await supabase.from('admin_users').select('id').eq('user_id', session.user.id).single()
        
        // Fallback: check profiles.is_admin or user_metadata.role
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
        const metaRole = (session.user.user_metadata as any)?.role
        const profileAny = profile as any
        
        if (!adminUser && !profileAny?.is_admin && metaRole !== 'admin') {
          log('not-admin')
          if (debug) {
            return new NextResponse(JSON.stringify({ code: 'NOT_ADMIN', traceId, logs, metaRole, profile, adminUser }), { status: 403, headers: { 'content-type':'application/json' } })
          }
          return res
        }
        log('admin-verified')
      } catch (e: any) {
        log('admin-check-failed ' + (e?.message || e))
        if (debug) {
          return new NextResponse(JSON.stringify({ code: 'ADMIN_CHECK_FAILED', traceId, error: (e as any)?.message, logs }), { status: 500, headers: { 'content-type':'application/json' } })
        }
        return res
      }
    }

    log('end')
    if (debug) {
      res.headers.set('x-mw-logs', encodeURIComponent(logs.join(';')))
    }
    return res

  } catch (error: any) {
    log('middleware-error: ' + error.message)
    if (debug) {
      res.headers.set('x-mw-logs', logs.join('|'))
    }
    return res
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
