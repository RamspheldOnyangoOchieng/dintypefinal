import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if user is admin
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
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Fetch all page meta
    const { data: pages, error } = await supabase
      .from('page_meta')
      .select('*')
      .order('page_path', { ascending: true })

    if (error) throw error

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Error fetching page meta:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page meta' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if user is admin
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
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()

    // Update or insert page meta
    const { data, error } = await supabase
      .from('page_meta')
      .upsert({
        id: body.id,
        page_path: body.page_path,
        meta_title: body.meta_title,
        meta_description: body.meta_description,
        meta_keywords: body.meta_keywords,
        og_title: body.og_title,
        og_description: body.og_description,
        og_image: body.og_image,
        og_type: body.og_type,
        twitter_card: body.twitter_card,
        canonical_url: body.canonical_url,
        robots: body.robots,
        language: body.language,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error saving page meta:', error)
    return NextResponse.json(
      { error: 'Failed to save page meta' },
      { status: 500 }
    )
  }
}
