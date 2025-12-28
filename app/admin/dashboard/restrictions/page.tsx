"use client"

import { useState, useEffect } from "react"
import { AdminOnlyPage } from "@/components/admin-only-page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, RefreshCw, Plus, Trash2 } from "lucide-react"

interface PlanRestriction {
  id: string
  plan_type: 'free' | 'premium'
  restriction_key: string
  restriction_value: string
  description: string | null
  updated_at: string
}

export default function RestrictionsPage() {
  const [freeRestrictions, setFreeRestrictions] = useState<PlanRestriction[]>([])
  const [premiumRestrictions, setPremiumRestrictions] = useState<PlanRestriction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Load restrictions
  const loadRestrictions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/get-restrictions')
      const data = await response.json()
      
      if (data.success) {
        setFreeRestrictions(data.free || [])
        setPremiumRestrictions(data.premium || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load restrictions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading restrictions:", error)
      toast({
        title: "Error",
        description: "Failed to load restrictions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestrictions()
  }, [])

  // Update restriction value
  const updateRestrictionValue = (
    planType: 'free' | 'premium',
    restrictionKey: string,
    newValue: string
  ) => {
    if (planType === 'free') {
      setFreeRestrictions(prev =>
        prev.map(r =>
          r.restriction_key === restrictionKey
            ? { ...r, restriction_value: newValue }
            : r
        )
      )
    } else {
      setPremiumRestrictions(prev =>
        prev.map(r =>
          r.restriction_key === restrictionKey
            ? { ...r, restriction_value: newValue }
            : r
        )
      )
    }
  }

  // Add new restriction locally
  const addRestriction = (planType: 'free' | 'premium') => {
    const newKey = prompt("Enter restriction key (e.g. max_tokens_per_message):")
    if (!newKey) return

    const newRestriction: PlanRestriction = {
      id: Math.random().toString(36).substring(7),
      plan_type: planType,
      restriction_key: newKey,
      restriction_value: 'true',
      description: 'Newly added restriction',
      updated_at: new Date().toISOString()
    }

    if (planType === 'free') {
      setFreeRestrictions(prev => [...prev, newRestriction])
    } else {
      setPremiumRestrictions(prev => [...prev, newRestriction])
    }
  }

  // Remove restriction locally
  const removeRestriction = (planType: 'free' | 'premium', key: string) => {
    if (!confirm(`Remove ${key} from ${planType} plan locally? (Must save to apply)`)) return
    
    if (planType === 'free') {
      setFreeRestrictions(prev => prev.filter(r => r.restriction_key !== key))
    } else {
      setPremiumRestrictions(prev => prev.filter(r => r.restriction_key !== key))
    }
  }

  // Save all changes
  const saveChanges = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/update-restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          free: freeRestrictions,
          premium: premiumRestrictions
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Restrictions updated successfully. Changes are live!",
        })
        await loadRestrictions() // Reload to confirm
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update restrictions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving restrictions:", error)
      toast({
        title: "Error",
        description: "Failed to save restrictions",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Render restriction input based on type
  const renderRestrictionInput = (
    restriction: PlanRestriction,
    planType: 'free' | 'premium'
  ) => {
    const { restriction_key, restriction_value, description } = restriction

    // Boolean values (true/false)
    if (restriction_value === 'true' || restriction_value === 'false') {
      return (
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1">
            <Label htmlFor={restriction_key}>{restriction_key.replace(/_/g, ' ').toUpperCase()}</Label>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <Switch
            id={restriction_key}
            checked={restriction_value === 'true'}
            onCheckedChange={(checked) =>
              updateRestrictionValue(planType, restriction_key, checked ? 'true' : 'false')
            }
          />
        </div>
      )
    }

    // Null values (unlimited)
    if (restriction_value === 'null') {
      return (
        <div className="space-y-2">
          <Label htmlFor={restriction_key}>{restriction_key.replace(/_/g, ' ').toUpperCase()}</Label>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <div className="flex items-center space-x-2">
            <Input
              id={restriction_key}
              type="text"
              value="Unlimited"
              disabled
              className="bg-muted"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateRestrictionValue(planType, restriction_key, '0')}
            >
              Set Limit
            </Button>
          </div>
        </div>
      )
    }

    // Numeric or string values
    return (
      <div className="space-y-2">
        <Label htmlFor={restriction_key}>{restriction_key.replace(/_/g, ' ').toUpperCase()}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="flex items-center space-x-2">
          <Input
            id={restriction_key}
            type={/^\d+$/.test(restriction_value) ? 'number' : 'text'}
            value={restriction_value}
            onChange={(e) => updateRestrictionValue(planType, restriction_key, e.target.value)}
          />
          {/^\d+$/.test(restriction_value) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateRestrictionValue(planType, restriction_key, 'null')}
            >
              Unlimited
            </Button>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 mt-2"
          onClick={() => removeRestriction(planType, restriction_key)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Remove
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <AdminOnlyPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminOnlyPage>
    )
  }

  return (
    <AdminOnlyPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plan Restrictions Management</h1>
            <p className="text-muted-foreground mt-2">
              Control limits and features for Free and Premium plans. Changes take effect immediately.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadRestrictions} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={saveChanges} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="free" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="free">Free Plan</TabsTrigger>
            <TabsTrigger value="premium">Premium Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="free" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Free Plan Restrictions</CardTitle>
                <CardDescription>
                  Configure limits and features for free tier users (0 SEK / 0 EUR)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {freeRestrictions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No restrictions found for free plan.
                  </div>
                ) : (
                  freeRestrictions.map((restriction) => (
                    <div key={restriction.restriction_key} className="border-b pb-4 last:border-0">
                      {renderRestrictionInput(restriction, 'free')}
                    </div>
                  ))
                )}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => addRestriction('free')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Free Restriction
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="premium" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Premium Plan Restrictions</CardTitle>
                <CardDescription>
                  Configure limits and features for premium users (119 SEK/mo or €11/mo)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {premiumRestrictions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No restrictions found for premium plan.
                  </div>
                ) : (
                  premiumRestrictions.map((restriction) => (
                    <div key={restriction.restriction_key} className="border-b pb-4 last:border-0">
                      {renderRestrictionInput(restriction, 'premium')}
                    </div>
                  ))
                )}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => addRestriction('premium')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Premium Restriction
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminOnlyPage>
  )
}
