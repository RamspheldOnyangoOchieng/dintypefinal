import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] /api/admin/content - GET request started')
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[API] User from session:', user?.id, user?.email)

    if (!user) {
      console.log('[API] No user found - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin using admin_users table
    console.log('[API] Checking admin status for user:', user.id)
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    console.log('[API] Admin check result:', { adminCheck, adminError })

    if (!adminCheck) {
      console.log('[API] User is not admin - returning 403')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('[API] User is admin - fetching content blocks')
    const { data, error } = await supabase
      .from('content_blocks')
      .select('*')
      .order('page', { ascending: true })
      .order('block_key', { ascending: true })

    if (error) {
      console.log('[API] Error fetching blocks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API] Success - returning', data?.length, 'blocks')
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin using admin_users table
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, page, block_key, content_sv, content_en, content_type } = body

    if (!page || !block_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('content_blocks')
      .upsert(
        {
          id,
          page,
          block_key,
          content_sv: content_sv || '',
          content_en: content_en || '',
          content_type: content_type || 'text',
        },
        { onConflict: 'page,block_key' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
