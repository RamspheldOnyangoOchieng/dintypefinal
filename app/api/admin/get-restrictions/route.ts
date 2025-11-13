import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Get all plan restrictions
    const { data: restrictions, error } = await supabase
      .from('plan_restrictions')
      .select('*')
      .order('plan_type')
      .order('restriction_key')

    if (error) {
      console.error('Error fetching restrictions:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch restrictions'
      }, { status: 500 })
    }

    // Group by plan type
    const free = restrictions?.filter(r => r.plan_type === 'free') || []
    const premium = restrictions?.filter(r => r.plan_type === 'premium') || []

    return NextResponse.json({
      success: true,
      free,
      premium,
      total: restrictions?.length || 0
    })

  } catch (error) {
    console.error('Error in get-restrictions:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
