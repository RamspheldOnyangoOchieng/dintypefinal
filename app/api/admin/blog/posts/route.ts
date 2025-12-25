import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isUserAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(supabase, user.id)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Get single post with tags
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select(
          `
          *,
          blog_categories(id, name_sv, name_en, slug),
          blog_post_tags(blog_tags(id, name_sv, name_en, slug))
        `
        )
        .eq('id', id)
        .single()

      if (postError) {
        return NextResponse.json({ error: postError.message }, { status: 500 })
      }

      return NextResponse.json(post)
    }

    // Get all posts with pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    let query = supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_categories(id, name_sv, name_en, slug)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: data, total: count, page, limit })
  } catch (error: any) {
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

    const isAdmin = await isUserAdmin(supabase, user.id)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title_sv, title_en, slug, content_sv, content_en, excerpt_sv, excerpt_en, category_id, tags, status, featured_image, meta_title, meta_description, scheduled_at } = body

    if (!title_sv || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const postData: any = {
      title_sv,
      title_en: title_en || title_sv,
      slug,
      content_sv: content_sv || '',
      content_en: content_en || '',
      excerpt_sv: excerpt_sv || '',
      excerpt_en: excerpt_en || '',
      category_id: category_id || null,
      status: status || 'draft',
      featured_image: featured_image || null,
      meta_title: meta_title || title_sv,
      meta_description: meta_description || excerpt_sv,
      author_id: user.id,
    }

    if (scheduled_at) {
      postData.scheduled_at = scheduled_at
    }

    if (status === 'published' && !id) {
      postData.published_at = new Date().toISOString()
    }

    let post
    if (id) {
      // Update existing post
      const { data, error } = await supabase.from('blog_posts').update(postData).eq('id', id).select().single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      post = data
    } else {
      // Create new post
      const { data, error } = await supabase.from('blog_posts').insert(postData).select().single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      post = data
    }

    // Update tags
    if (tags && Array.isArray(tags)) {
      // Delete existing tags
      await supabase.from('blog_post_tags').delete().eq('post_id', post.id)

      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map((tagId: string) => ({
          post_id: post.id,
          tag_id: tagId,
        }))
        await supabase.from('blog_post_tags').insert(tagInserts)
      }
    }

    return NextResponse.json(post)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(supabase, user.id)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing post ID' }, { status: 400 })
    }

    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
