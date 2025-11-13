'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, TrendingUp, DollarSign, MessageSquare, Image, Users } from 'lucide-react'

interface BudgetStatus {
  allowed: boolean
  current: {
    messages: number
    images: number
    characters: number
    apiCost: number
    tokenRevenue: number
  }
  limits: {
    apiCost: number
    messages: number
    images: number
  }
  percentUsed: {
    cost: number
    messages: number
    images: number
  }
  message?: string
  warning?: boolean
}

interface DailyStats {
  date: string
  messages: number
  images: number
  apiCost: number
  tokenRevenue: number
}

interface Projection {
  projected: number
  daysElapsed: number
  daysRemaining: number
  currentCost: number
  onTrackToExceed: boolean
}

interface MonitorData {
  budget: BudgetStatus
  dailyStats: DailyStats[]
  projection: Projection
  timestamp: string
}

export default function CostMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/budget-status')
      if (!response.ok) throw new Error('Failed to fetch budget status')
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Real-Time Cost Monitor</h1>
          <p className="text-muted-foreground">Loading budget data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load data'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { budget, projection } = data
  const profit = budget.current.tokenRevenue - budget.current.apiCost
  const profitMargin = budget.current.tokenRevenue > 0 
    ? ((profit / budget.current.tokenRevenue) * 100).toFixed(1)
    : '0'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Real-Time Cost Monitor</h1>
        <p className="text-muted-foreground">
          Live API usage tracking and budget enforcement
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Alerts */}
      {!budget.allowed && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>SERVICE DISABLED</AlertTitle>
          <AlertDescription>{budget.message}</AlertDescription>
        </Alert>
      )}

      {budget.warning && budget.allowed && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{budget.message}</AlertDescription>
        </Alert>
      )}

      {projection.onTrackToExceed && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Budget Projection Warning</AlertTitle>
          <AlertDescription>
            At current usage rate, you'll spend ${projection.projected.toFixed(2)} this month
            (limit: ${budget.limits.apiCost}). Consider reducing usage or increasing budget.
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budget.current.apiCost.toFixed(2)} kr
            </div>
            <p className="text-xs text-muted-foreground">
              of {budget.limits.apiCost} kr limit
            </p>
            <Progress value={budget.percentUsed.cost} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {budget.percentUsed.cost.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {budget.current.tokenRevenue.toFixed(2)} kr
            </div>
            <p className="text-xs text-muted-foreground">
              Profit: {profit.toFixed(2)} kr ({profitMargin}%)
            </p>
            <Badge variant="outline" className="mt-2">
              {(budget.current.tokenRevenue / budget.current.apiCost).toFixed(1)}x ROI
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budget.current.messages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of {budget.limits.messages.toLocaleString()} limit
            </p>
            <Progress value={budget.percentUsed.messages} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {budget.percentUsed.messages.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budget.current.images.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of {budget.limits.images.toLocaleString()} limit
            </p>
            <Progress value={budget.percentUsed.images} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {budget.percentUsed.images.toFixed(1)}% used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Projection</CardTitle>
          <CardDescription>
            Based on current usage rate ({projection.daysElapsed} days elapsed, {projection.daysRemaining} remaining)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Spend:</span>
              <span className="text-xl font-bold">{projection.currentCost.toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Projected End of Month:</span>
              <span className={`text-xl font-bold ${projection.onTrackToExceed ? 'text-red-600' : 'text-green-600'}`}>
                {projection.projected.toFixed(2)} kr
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Daily Average:</span>
              <span className="text-sm text-muted-foreground">
                {(projection.currentCost / projection.daysElapsed).toFixed(2)} kr/day
              </span>
            </div>
            {projection.onTrackToExceed && (
              <Badge variant="destructive" className="w-full justify-center">
                On track to exceed budget by {(projection.projected - budget.limits.apiCost).toFixed(2)} kr
              </Badge>
            )}
            {!projection.onTrackToExceed && (
              <Badge variant="outline" className="w-full justify-center bg-green-50">
                Within budget - {(budget.limits.apiCost - projection.projected).toFixed(2)} kr buffer remaining
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown (This Month)</CardTitle>
          <CardDescription>Detailed usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Chat Messages</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{budget.current.messages.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  ~${(budget.current.messages * 0.000025).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="font-medium">Image Generations</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{budget.current.images.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  ~${(budget.current.images * 0.02).toFixed(2)} (avg)
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Characters Created</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{budget.current.characters.toLocaleString()}</div>
                <div className="text-xs text-green-600">FREE (Groq API)</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2">
              <span className="font-bold">Total API Cost</span>
              <span className="text-xl font-bold">{budget.current.apiCost.toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>USD equivalent:</span>
              <span>${budget.current.apiCostUSD?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Service Status:</span>
              <Badge variant={budget.allowed ? 'outline' : 'destructive'}>
                {budget.allowed ? 'OPERATIONAL' : 'DISABLED'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Budget Enforcement:</span>
              <Badge variant="outline">ENABLED</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Auto-Refresh:</span>
              <Badge variant="outline">10 seconds</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
