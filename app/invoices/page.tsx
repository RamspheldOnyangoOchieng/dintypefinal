"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, RefreshCw } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Invoice {
  id: string
  stripe_session_id: string
  plan_name: string
  amount: number
  status: string
  created_at: string
  metadata: any
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadInvoices()
    }
  }, [user])

  const loadInvoices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/invoices?userId=${user?.id}`)
      const data = await response.json()

      if (data.success) {
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error("Failed to load invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadInvoice = (invoice: Invoice) => {
    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(invoice)
    
    // Create blob and download
    const blob = new Blob([invoiceHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${invoice.id}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateInvoiceHTML = (invoice: Invoice) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${invoice.id}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-details { margin: 30px 0; }
    .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; }
    .total { font-size: 24px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Invoice #${invoice.id}</p>
    <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
  </div>

  <div class="invoice-details">
    <h2>Bill To:</h2>
    <p>User ID: ${user?.id}</p>
    <p>Email: ${user?.email}</p>
  </div>

  <table width="100%" style="border-collapse: collapse; margin-top: 30px;">
    <thead>
      <tr style="border-bottom: 2px solid #333;">
        <th style="text-align: left; padding: 10px;">Description</th>
        <th style="text-align: right; padding: 10px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px;">${invoice.plan_name || "Token Purchase"}</td>
        <td style="text-align: right; padding: 10px;">$${invoice.amount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="total" style="text-align: right; border-top: 2px solid #333; padding-top: 20px;">
    Total: $${invoice.amount.toFixed(2)}
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Transaction ID: ${invoice.stripe_session_id}</p>
  </div>
</body>
</html>
    `
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FileText className="mr-3 h-8 w-8" />
            Invoices & Receipts
          </h1>
          <p className="text-muted-foreground mt-2">View and download your payment receipts</p>
        </div>
        <Button onClick={loadInvoices} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All your payment transactions and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{invoice.plan_name || "Token Purchase"}</TableCell>
                    <TableCell className="font-semibold">
                      ${invoice.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          invoice.status === "completed" || invoice.status === "paid"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }
                      >
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadInvoice(invoice)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
