"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, Activity, BarChart3 } from "lucide-react"
import { ACTION_COSTS } from "@/lib/cost-tracking"

export default function AdminCostsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [totalCost, setTotalCost] = useState(0)
  const [costLogs, setCostLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadCostData()
  }, [])

  const loadCostData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/track-cost")
      const data = await response.json()

      if (data.success) {
        setCostLogs(data.logs || [])
        setTotalCost(data.totalCost || 0)
      }
    } catch (error) {
      console.error("Failed to load cost data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCostsByAction = () => {
    const costsByAction: Record<string, number> = {}
    
    costLogs.forEach((log) => {
      if (!costsByAction[log.action_type]) {
        costsByAction[log.action_type] = 0
      }
      costsByAction[log.action_type] += log.cost
    })

    return Object.entries(costsByAction).map(([action, cost]) => ({
      action,
      cost,
    }))
  }

  const getCostsByUser = () => {
    const costsByUser: Record<string, number> = {}
    
    costLogs.forEach((log) => {
      if (!costsByUser[log.user_id]) {
        costsByUser[log.user_id] = 0
      }
      costsByUser[log.user_id] += log.cost
    })

    return Object.entries(costsByUser)
      .map(([userId, cost]) => ({
        userId,
        cost,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading cost data...</p>
        </div>
      </div>
    )
  }

  const costsByAction = getCostsByAction()
  const costsByUser = getCostsByUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cost Tracking Dashboard</h1>
        <p className="text-muted-foreground">Monitor token usage and costs across the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens Used</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All-time usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costLogs.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tracked actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost per Action</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costLogs.length > 0 ? (totalCost / costLogs.length).toFixed(1) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Tokens per action</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions">Costs by Action</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
          <TabsTrigger value="config">Cost Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Costs Breakdown by Action Type</CardTitle>
              <CardDescription>Total tokens consumed per action category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costsByAction.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No cost data available</p>
                ) : (
                  costsByAction.map((item) => (
                    <div key={item.action} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">
                          Cost per use: {ACTION_COSTS[item.action as keyof typeof ACTION_COSTS] || "N/A"} tokens
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.cost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">total tokens</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Token Consumers</CardTitle>
              <CardDescription>Users with highest token usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costsByUser.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No user data available</p>
                ) : (
                  costsByUser.map((item, index) => (
                    <div key={item.userId} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-mono text-sm">{item.userId.slice(0, 16)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.cost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Action Cost Configuration</CardTitle>
              <CardDescription>Token costs for each action type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(ACTION_COSTS).map(([action, cost]) => (
                  <div key={action} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{action}</span>
                    <span className="font-mono text-sm">{cost} tokens</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
