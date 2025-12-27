"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

type PremiumUser = {
  id: string
  email?: string
  name?: string
  full_name?: string
  subscription_status?: string
  is_premium?: boolean
  subscription_start?: string
  created_at?: string
  updated_at?: string
  last_payment_date?: string
  last_payment_amount?: number
  token_balance?: number
  credit_balance?: number
}

export function PremiumUsersList() {
  const [users, setUsers] = useState<PremiumUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPremiumUsers() {
      try {
        setLoading(true)

        // Get profiles first
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, full_name, is_premium, updated_at, created_at")
          .eq("is_premium", true)
          .order("updated_at", { ascending: false })

        if (profilesError) throw profilesError

        // For each premium profile, fetch token and credit balances
        const userIds = profilesData.map(p => p.id)

        const { data: tokensData } = await supabase
          .from("user_tokens")
          .select("user_id, balance")
          .in("user_id", userIds)

        const { data: creditsData } = await supabase
          .from("user_credits")
          .select("user_id, balance")
          .in("user_id", userIds)

        const processedData: PremiumUser[] = profilesData.map(profile => {
          const tokenRecord = tokensData?.find(t => t.user_id === profile.id)
          const creditRecord = creditsData?.find(c => c.user_id === profile.id)

          return {
            ...profile,
            subscription_status: profile.is_premium ? "active" : "inactive",
            subscription_start: profile.created_at,
            token_balance: tokenRecord?.balance || 0,
            credit_balance: creditRecord?.balance || 0
          }
        })

        setUsers(processedData)
      } catch (err) {
        console.error("Error fetching premium users:", err)
        setError("Failed to load premium users")
      } finally {
        setLoading(false)
      }
    }

    fetchPremiumUsers()
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return "Invalid date"
    }
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A"
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  }

  const getUserName = (user: PremiumUser) => {
    if (user.full_name) return user.full_name
    if (user.name) return user.name
    return user.id.substring(0, 8) + "..."
  }

  const getUserEmail = (user: PremiumUser) => {
    return user.email || "No email available"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Members & Usage</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No premium users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{getUserName(user)}</TableCell>
                      <TableCell>{getUserEmail(user)}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500">
                          Premium
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {user.credit_balance}
                      </TableCell>
                      <TableCell className="text-right font-bold text-yellow-600">
                        {user.token_balance}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
