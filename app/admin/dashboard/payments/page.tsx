"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Transaction {
  id: string
  user_id: string
  stripe_session_id: string
  stripe_payment_intent_id: string
  plan_id: string
  plan_name: string
  amount: number
  status: string
  created_at: string
  metadata: any
}

export default function AdminPaymentsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [isRefunding, setIsRefunding] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/payment-transactions")
      const data = await response.json()

      if (data.transactions) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Failed to load transactions:", error)
      toast.error("Failed to load payment transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefundClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setRefundAmount(transaction.amount.toString())
    setRefundReason("")
    setShowRefundDialog(true)
  }

  const handleRefund = async () => {
    if (!selectedTransaction) return

    try {
      setIsRefunding(true)

      const response = await fetch("/api/admin/refund-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: selectedTransaction.stripe_payment_intent_id,
          amount: parseFloat(refundAmount),
          reason: refundReason || "requested_by_customer",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Refund processed successfully")
        setShowRefundDialog(false)
        loadTransactions()
      } else {
        toast.error(data.error || "Failed to process refund")
      }
    } catch (error) {
      console.error("Refund error:", error)
      toast.error("Failed to process refund")
    } finally {
      setIsRefunding(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-500",
      paid: "bg-green-500",
      pending: "bg-yellow-500",
      failed: "bg-red-500",
      refunded: "bg-gray-500",
    }

    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Transactions</h1>
          <p className="text-muted-foreground">Manage and refund customer payments</p>
        </div>
        <Button onClick={loadTransactions} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            All Transactions
          </CardTitle>
          <CardDescription>
            View and manage all payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Plan/Item</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Intent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {transaction.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{transaction.plan_name || "Token Purchase"}</TableCell>
                    <TableCell className="font-semibold">
                      ${transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {transaction.stripe_payment_intent_id?.slice(0, 15)}...
                    </TableCell>
                    <TableCell>
                      {transaction.status === "completed" || transaction.status === "paid" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRefundClick(transaction)}
                        >
                          Refund
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund payment for {selectedTransaction?.plan_name || "Token Purchase"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter amount to refund"
              />
              <p className="text-sm text-muted-foreground">
                Original amount: ${selectedTransaction?.amount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason (Optional)</Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund..."
                rows={3}
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Warning</p>
                  <p>
                    This will refund the payment in Stripe and update the transaction status.
                    Tokens will be deducted and premium status removed if applicable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={isRefunding}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isRefunding || !refundAmount}
            >
              {isRefunding ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
