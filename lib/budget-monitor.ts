import { createAdminClient } from './supabase-admin'

// Default monthly limits to prevent surprise bills
const DEFAULT_MONTHLY_LIMITS = {
  apiCost: 1000, // ~1000 SEK (~100 USD) max spend per month
  messages: 4_000_000, // 4M messages = ~100 USD at Novita pricing
  images: 2500, // Flux-Pro equivalent (conservative)
}

// Exchange rate USD to SEK (approximate, update as needed)
const USD_TO_SEK = 10.5

/**
 * Get current budget limits from settings table or return defaults
 */
export async function getBudgetLimits(): Promise<typeof DEFAULT_MONTHLY_LIMITS> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'budget_limits')
      .maybeSingle()

    if (data?.value) {
      return { ...DEFAULT_MONTHLY_LIMITS, ...(data.value as any) }
    }
  } catch (e) {
    console.error('Failed to fetch budget limits:', e)
  }
  return DEFAULT_MONTHLY_LIMITS
}

export interface MonthlyUsage {
  messages: number
  images: number
  characters: number
  apiCost: number // in SEK
  apiCostUSD: number // in USD (actual API cost)
  tokenRevenue: number // in SEK
}

export interface BudgetStatus {
  allowed: boolean
  current: MonthlyUsage
  limits: typeof MONTHLY_LIMITS
  percentUsed: {
    cost: number
    messages: number
    images: number
  }
  message?: string
  warning?: boolean
}

/**
 * Check if current month's usage is within budget limits
 * Returns whether operations should be allowed to proceed
 */
export async function checkMonthlyBudget(): Promise<BudgetStatus> {
  const supabase = await createAdminClient()
  
  // Get start of current month
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // Query cost logs for current month
  const { data: logs } = await supabase
    .from('cost_logs')
    .select('action, tokens_used, api_cost, created_at')
    .gte('created_at', monthStart.toISOString())

  const limits = await getBudgetLimits()

  if (!logs) {
    return {
      allowed: true,
      current: {
        messages: 0,
        images: 0,
        characters: 0,
        apiCost: 0,
        apiCostUSD: 0,
        tokenRevenue: 0,
      },
      limits: limits,
      percentUsed: { cost: 0, messages: 0, images: 0 },
    }
  }

  // Calculate current usage
  const apiCostUSD = logs.reduce((sum, l) => sum + (l.api_cost || 0), 0)
  const apiCostSEK = apiCostUSD * USD_TO_SEK
  const tokenRevenueSEK = logs.reduce((sum, l) => sum + (l.tokens_used || 0), 0) * 0.5 // 1 token ≈ 0.5 SEK (99 SEK / 200 tokens)
  
  const usage: MonthlyUsage = {
    messages: logs.filter((l) => l.action.toLowerCase().includes('message')).length,
    images: logs.filter((l) => l.action.toLowerCase().includes('image')).length,
    characters: logs.filter((l) => l.action.toLowerCase().includes('character')).length,
    apiCost: apiCostSEK,
    apiCostUSD: apiCostUSD,
    tokenRevenue: tokenRevenueSEK,
  }

  // Calculate percentage used
  const percentUsed = {
    cost: (usage.apiCost / limits.apiCost) * 100,
    messages: (usage.messages / limits.messages) * 100,
    images: (usage.images / limits.images) * 100,
  }

  // Check if any limit exceeded
  if (usage.apiCost >= limits.apiCost) {
    return {
      allowed: false,
      current: usage,
      limits: limits,
      percentUsed,
      message: `Monthly budget limit reached (${limits.apiCost} SEK). Service temporarily disabled. Contact admin.`,
    }
  }

  if (usage.messages >= limits.messages) {
    return {
      allowed: false,
      current: usage,
      limits: limits,
      percentUsed,
      message: `Monthly message limit reached (${limits.messages.toLocaleString()}). Service temporarily disabled.`,
    }
  }

  if (usage.images >= limits.images) {
    return {
      allowed: false,
      current: usage,
      limits: limits,
      percentUsed,
      message: `Monthly image limit reached (${limits.images}). Service temporarily disabled.`,
    }
  }

  // Warning at 80% threshold
  const warning =
    percentUsed.cost >= 80 || percentUsed.messages >= 80 || percentUsed.images >= 80

  if (warning) {
    return {
      allowed: true,
      current: usage,
      limits: limits,
      percentUsed,
      warning: true,
      message: `Warning: Approaching monthly budget limit (${Math.max(
        percentUsed.cost,
        percentUsed.messages,
        percentUsed.images
      ).toFixed(1)}% used)`,
    }
  }

  return {
    allowed: true,
    current: usage,
    limits: limits,
    percentUsed,
  }
}

/**
 * Log API cost for tracking
 */
export async function logApiCost(
  action: string,
  tokensUsed: number,
  apiCost: number,
  userId?: string
) {
  const supabase = await createAdminClient()

  await supabase.from('cost_logs').insert({
    action,
    tokens_used: tokensUsed,
    api_cost: apiCost,
    user_id: userId,
    created_at: new Date().toISOString(),
  })
}

/**
 * Get daily usage stats for graphs
 */
export async function getDailyUsageStats(days = 30): Promise<
  Array<{
    date: string
    messages: number
    images: number
    apiCost: number // SEK
    tokenRevenue: number // SEK
  }>
> {
  const supabase = await createAdminClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: logs } = await supabase
    .from('cost_logs')
    .select('action, tokens_used, api_cost, created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (!logs) return []

  // Group by date
  const dailyStats = new Map<
    string,
    { messages: number; images: number; apiCost: number; tokenRevenue: number }
  >()

  logs.forEach((log) => {
    const date = log.created_at.split('T')[0]
    const current = dailyStats.get(date) || { messages: 0, images: 0, apiCost: 0, tokenRevenue: 0 }

    if (log.action.toLowerCase().includes('message')) current.messages++
    if (log.action.toLowerCase().includes('image')) current.images++
    current.apiCost += (log.api_cost || 0) * USD_TO_SEK // Convert USD to SEK
    current.tokenRevenue += (log.tokens_used || 0) * 0.5 // 1 token ≈ 0.5 SEK

    dailyStats.set(date, current)
  })

  return Array.from(dailyStats.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Project monthly cost based on current usage rate
 */
export async function projectMonthlyCost(): Promise<{
  projected: number // SEK
  daysElapsed: number
  daysRemaining: number
  currentCost: number // SEK
  onTrackToExceed: boolean
}> {
  const supabase = await createAdminClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const daysElapsed = Math.floor((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.floor((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const totalDaysInMonth = daysElapsed + daysRemaining

  const { data: logs } = await supabase
    .from('cost_logs')
    .select('api_cost')
    .gte('created_at', monthStart.toISOString())

  const currentCostUSD = logs?.reduce((sum, l) => sum + (l.api_cost || 0), 0) || 0
  const currentCost = currentCostUSD * USD_TO_SEK // Convert to SEK
  const dailyAverage = daysElapsed > 0 ? currentCost / daysElapsed : 0
  const projected = dailyAverage * totalDaysInMonth

  const limits = await getBudgetLimits()

  return {
    projected,
    daysElapsed,
    daysRemaining,
    currentCost,
    onTrackToExceed: projected > limits.apiCost,
  }
}
