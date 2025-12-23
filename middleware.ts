import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const logs: string[] = []
  const traceId = (globalThis.crypto && 'randomUUID' in globalThis.crypto) 
    ? (globalThis.crypto as any).randomUUID() 
    : Math.random().toString(36).slice(2)
  const debugParam = url.searchParams.get('__mwdebug') === '1'
  const debugEnv = process.env.NEXT_PUBLIC_MW_DEBUG === '1'
  const debug = debugParam || debugEnv

  function log(msg: string) { 
    logs.push(msg)
    if (debug) console.log('[MW]', msg) 
  }
  
  res.headers.set('x-trace-id', traceId)
  if (debug) res.headers.set('x-mw-debug', '1')

  try {
    log('start')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      log('env-missing skip auth')
      if (debug) res.headers.set('x-mw-logs', encodeURIComponent(logs.join(';')))
      return res
    }

    // Create Supabase client with proper cookie handling for middleware
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    })

    log('middleware-configured')

    // Refresh the session - this is crucial for keeping sessions alive
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      log('user-error ' + userError.message)
    } else if (user) {
      log('user-found ' + user.id.substring(0, 8))
    } else {
      log('no-user')
    }

    // Admin route protection: restrict /admin paths to admin users only
    if (url.pathname.startsWith('/admin')) {
      if (!user) {
        log('admin-no-user')
        // Redirect to login for admin pages
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('redirect', url.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      try {
        // Check admin_users table
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (adminError) {
          log('admin-check-error ' + adminError.message)
        }

        // Fallback: check profiles.is_admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()
        
        const metaRole = user.user_metadata?.role
        const isAdminUser = !!adminUser || profile?.is_admin === true || metaRole === 'admin'
        
        if (!isAdminUser) {
          log('not-admin')
          // Redirect non-admins to home page
          return NextResponse.redirect(new URL('/', req.url))
        }
        
        log('admin-verified')
      } catch (e: any) {
        log('admin-check-failed ' + (e?.message || e))
        if (debug) {
          return new NextResponse(
            JSON.stringify({ code: 'ADMIN_CHECK_FAILED', traceId, error: e?.message, logs }), 
            { status: 500, headers: { 'content-type': 'application/json' } }
          )
        }
        return NextResponse.redirect(new URL('/', req.url))
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
