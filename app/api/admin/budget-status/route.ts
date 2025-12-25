import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import {
  checkMonthlyBudget,
  getDailyUsageStats,
  projectMonthlyCost,
} from '@/lib/budget-monitor'

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

    import { isUserAdmin } from '@/lib/admin-auth'

    const isAdmin = await isUserAdmin(supabase, user.id)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get all monitoring data
    const [budgetStatus, dailyStats, projection] = await Promise.all([
      checkMonthlyBudget(),
      getDailyUsageStats(30),
      projectMonthlyCost(),
    ])

    return NextResponse.json({
      budget: budgetStatus,
      dailyStats,
      projection,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching budget status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget status' },
      { status: 500 }
    )
  }
}
