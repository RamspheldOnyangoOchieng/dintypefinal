"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, AlertCircle, Webhook, Key, Mail, DollarSign, Receipt, ShieldCheck, Clock, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-context"

interface IntegrationConfig {
  stripe_secret_key: string
  stripe_publishable_key: string
  stripe_webhook_secret: string
  google_oauth_client_id: string
  google_oauth_client_secret: string
  discord_oauth_client_id: string
  discord_oauth_client_secret: string
  twitter_oauth_client_id: string
  twitter_oauth_client_secret: string
  email_provider: string
  email_api_key: string
  email_from_address: string
  email_from_name: string
}

export default function IntegrationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  
  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/admin/login?redirect=/admin/settings/integrations")
    }
  }, [user, authLoading, router])
  const [config, setConfig] = useState<IntegrationConfig>({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
    google_oauth_client_id: "",
    google_oauth_client_secret: "",
    discord_oauth_client_id: "",
    discord_oauth_client_secret: "",
    twitter_oauth_client_id: "",
    twitter_oauth_client_secret: "",
    email_provider: "resend",
    email_api_key: "",
    email_from_address: "",
    email_from_name: "",
  })

  const [connectionStatus, setConnectionStatus] = useState({
    stripe: false,
    google: false,
    discord: false,
    twitter: false,
    email: false,
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/integrations")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        
        // Check connection status
        setConnectionStatus({
          stripe: !!(data.stripe_secret_key && data.stripe_webhook_secret),
          google: !!(data.google_oauth_client_id && data.google_oauth_client_secret),
          discord: !!(data.discord_oauth_client_id && data.discord_oauth_client_secret),
          twitter: !!(data.twitter_oauth_client_id && data.twitter_oauth_client_secret),
          email: !!(data.email_api_key && data.email_from_address),
        })
      }
    } catch (error) {
      console.error("Error loading config:", error)
      toast({
        title: "Error",
        description: "Failed to load integration settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (section: string) => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${section} settings saved successfully`,
        })
        await loadConfig() // Reload to update connection status
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving config:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (service: string) => {
    try {
      const response = await fetch(`/api/admin/test-integration?service=${service}`)
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `${service} is properly configured`,
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Configuration is invalid",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not test connection",
        variant: "destructive",
      })
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      })
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Test Email Sent!",
          description: `Check ${testEmail} for the test message`,
        })
        setTestEmail("")
      } else {
        toast({
          title: "Send Failed",
          description: result.error || "Could not send test email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      })
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integration Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure external services and API connections
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Secure Storage</AlertTitle>
        <AlertDescription>
          All sensitive credentials (API keys, secrets) are encrypted in the database.
          Only enter valid credentials from the official service providers.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="stripe" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stripe">
            <Webhook className="h-4 w-4 mr-2" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="payment-settings">
            <DollarSign className="h-4 w-4 mr-2" />
            Payment Settings
          </TabsTrigger>
          <TabsTrigger value="oauth">
            <Key className="h-4 w-4 mr-2" />
            OAuth Providers
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email Service
          </TabsTrigger>
        </TabsList>

        {/* Stripe Tab */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stripe Configuration</CardTitle>
                  <CardDescription>
                    Configure your Stripe API keys and webhook secret for payment processing
                  </CardDescription>
                </div>
                {connectionStatus.stripe && (
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-1" />
                    Connected
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Keys Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">API Keys</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe_secret_key">Secret Key</Label>
                  <Input
                    id="stripe_secret_key"
                    type="password"
                    placeholder="sk_live_... or sk_test_..."
                    value={config.stripe_secret_key}
                    onChange={(e) => setConfig({ ...config, stripe_secret_key: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Get this from Stripe Dashboard → Developers → API keys
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
                  <Input
                    id="stripe_publishable_key"
                    type="text"
                    placeholder="pk_live_... or pk_test_..."
                    value={config.stripe_publishable_key}
                    onChange={(e) => setConfig({ ...config, stripe_publishable_key: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Public key used in client-side code
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Webhook Configuration</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe_webhook_secret">Webhook Signing Secret</Label>
                  <Input
                    id="stripe_webhook_secret"
                    type="password"
                    placeholder="whsec_..."
                    value={config.stripe_webhook_secret}
                    onChange={(e) => setConfig({ ...config, stripe_webhook_secret: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Get this from Stripe Dashboard → Developers → Webhooks
                  </p>
                </div>

                <Alert className="mt-4">
                  <AlertDescription>
                    <strong>Webhook URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"}/api/stripe-webhook
                    <br />
                    <strong>Events to select:</strong> checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, charge.refunded, charge.dispute.created
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave("Stripe")} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Configuration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testConnection("stripe")}
                  disabled={!config.stripe_webhook_secret}
                >
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OAuth Tab */}
        <TabsContent value="oauth">
          <div className="space-y-4">
            {/* Google OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Google OAuth</CardTitle>
                    <CardDescription>Enable "Sign in with Google"</CardDescription>
                  </div>
                  {connectionStatus.google && (
                    <div className="flex items-center text-green-600">
                      <Check className="h-5 w-5 mr-1" />
                      Connected
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google_oauth_client_id">Client ID</Label>
                  <Input
                    id="google_oauth_client_id"
                    placeholder="123456789-abc.apps.googleusercontent.com"
                    value={config.google_oauth_client_id}
                    onChange={(e) => setConfig({ ...config, google_oauth_client_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_oauth_client_secret">Client Secret</Label>
                  <Input
                    id="google_oauth_client_secret"
                    type="password"
                    placeholder="GOCSPX-..."
                    value={config.google_oauth_client_secret}
                    onChange={(e) => setConfig({ ...config, google_oauth_client_secret: e.target.value })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Get credentials from Google Cloud Console → APIs & Services → Credentials
                </p>
                
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Additional Setup Required</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>After saving, you must also enable Google in Supabase Dashboard:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Go to Supabase Dashboard → Authentication → Providers</li>
                      <li>Enable "Google" provider</li>
                      <li>Enter the same Client ID and Secret</li>
                      <li>Save changes</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={() => handleSave("Google OAuth")} disabled={saving}>
                    Save Configuration
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => testConnection("google")}
                    disabled={!config.google_oauth_client_id}
                  >
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Discord OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Discord OAuth</CardTitle>
                    <CardDescription>Enable "Sign in with Discord"</CardDescription>
                  </div>
                  {connectionStatus.discord && (
                    <div className="flex items-center text-green-600">
                      <Check className="h-5 w-5 mr-1" />
                      Connected
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="discord_oauth_client_id">Client ID</Label>
                  <Input
                    id="discord_oauth_client_id"
                    placeholder="123456789012345678"
                    value={config.discord_oauth_client_id}
                    onChange={(e) => setConfig({ ...config, discord_oauth_client_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord_oauth_client_secret">Client Secret</Label>
                  <Input
                    id="discord_oauth_client_secret"
                    type="password"
                    placeholder="..."
                    value={config.discord_oauth_client_secret}
                    onChange={(e) => setConfig({ ...config, discord_oauth_client_secret: e.target.value })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Get credentials from Discord Developer Portal → Applications
                </p>
                
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Additional Setup Required</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>After saving, enable Discord in Supabase Dashboard:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Supabase Dashboard → Authentication → Providers</li>
                      <li>Enable "Discord" and enter credentials</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <Button onClick={() => handleSave("Discord OAuth")} disabled={saving}>
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            {/* Twitter OAuth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Twitter/X OAuth</CardTitle>
                    <CardDescription>Enable "Sign in with Twitter"</CardDescription>
                  </div>
                  {connectionStatus.twitter && (
                    <div className="flex items-center text-green-600">
                      <Check className="h-5 w-5 mr-1" />
                      Connected
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter_oauth_client_id">Client ID</Label>
                  <Input
                    id="twitter_oauth_client_id"
                    placeholder="..."
                    value={config.twitter_oauth_client_id}
                    onChange={(e) => setConfig({ ...config, twitter_oauth_client_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_oauth_client_secret">Client Secret</Label>
                  <Input
                    id="twitter_oauth_client_secret"
                    type="password"
                    placeholder="..."
                    value={config.twitter_oauth_client_secret}
                    onChange={(e) => setConfig({ ...config, twitter_oauth_client_secret: e.target.value })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Get credentials from Twitter Developer Portal → Projects & Apps
                </p>
                
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Additional Setup Required</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>After saving, enable Twitter in Supabase Dashboard:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Supabase Dashboard → Authentication → Providers</li>
                      <li>Enable "Twitter" and enter credentials</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <Button onClick={() => handleSave("Twitter OAuth")} disabled={saving}>
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Service Configuration</CardTitle>
                  <CardDescription>
                    Configure email provider for sending transactional emails
                  </CardDescription>
                </div>
                {connectionStatus.email && (
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-1" />
                    Connected
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email_provider">Email Provider</Label>
                <Select
                  value={config.email_provider}
                  onValueChange={(value) => setConfig({ ...config, email_provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resend">Resend</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_api_key">API Key</Label>
                <Input
                  id="email_api_key"
                  type="password"
                  placeholder={config.email_provider === "resend" ? "re_..." : "SG..."}
                  value={config.email_api_key}
                  onChange={(e) => setConfig({ ...config, email_api_key: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_from_address">From Email Address</Label>
                <Input
                  id="email_from_address"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={config.email_from_address}
                  onChange={(e) => setConfig({ ...config, email_from_address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_from_name">From Name</Label>
                <Input
                  id="email_from_name"
                  placeholder="Your App Name"
                  value={config.email_from_name}
                  onChange={(e) => setConfig({ ...config, email_from_name: e.target.value })}
                />
              </div>

              <Alert>
                <AlertDescription>
                  Make sure to verify your domain with {config.email_provider === "resend" ? "Resend" : "SendGrid"} before sending emails.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={() => handleSave("Email")} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Configuration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testConnection("email")}
                  disabled={!config.email_api_key}
                >
                  Test Connection
                </Button>
              </div>

              {/* Send Test Email */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">Send Test Email</h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendTestEmail}
                    disabled={sendingTest || !config.email_api_key || !config.email_from_address}
                  >
                    {sendingTest ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sends a test welcome email to verify your configuration
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment-settings">
          <div className="space-y-6">
            {/* VAT/Tax Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  VAT & Tax Settings
                </CardTitle>
                <CardDescription>
                  Configure automatic tax calculation for payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Stripe Tax</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically calculate and collect taxes based on customer location
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Configure in Stripe Dashboard → Settings → Tax
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Stripe Tax must be enabled in your Stripe Dashboard. Once enabled, taxes are automatically calculated for all payments.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Grace Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Payment Grace Period
                </CardTitle>
                <CardDescription>
                  Allow access for a period after failed payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grace_period_days">Grace Period (Days)</Label>
                  <Input
                    id="grace_period_days"
                    type="number"
                    placeholder="3"
                    defaultValue="3"
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of days users can access premium features after payment failure
                  </p>
                </div>
                <Button onClick={() => handleSave("Grace Period")} disabled={saving}>
                  Save Grace Period
                </Button>
              </CardContent>
            </Card>

            {/* Subscription Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Subscription Types
                </CardTitle>
                <CardDescription>
                  Manage recurring subscriptions vs one-time token purchases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Premium Subscription</p>
                      <p className="text-sm text-muted-foreground">Recurring monthly subscription</p>
                    </div>
                    <div className="text-sm text-green-600">Active</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Token Bundles</p>
                      <p className="text-sm text-muted-foreground">One-time token purchases</p>
                    </div>
                    <div className="text-sm text-green-600">Active</div>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    Configure pricing and product details in Stripe Dashboard → Products
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Invoice & Receipt Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Invoice & Receipt Management
                </CardTitle>
                <CardDescription>
                  View and manage invoices sent to customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Invoices are automatically generated and sent via Stripe for all payments.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <a href="/admin/dashboard/payments" className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        View All Payments
                      </a>
                    </Button>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    Customize invoice templates in Stripe Dashboard → Settings → Emails
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Refund Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Refund Management
                </CardTitle>
                <CardDescription>
                  Process refunds for customer payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Process refunds directly from the payments dashboard with full or partial amounts.
                </p>
                <Button variant="outline" asChild>
                  <a href="/admin/dashboard/payments" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Manage Refunds
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Token Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Token Balance Verification
                </CardTitle>
                <CardDescription>
                  Check user token balances and transaction history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View detailed token balances and usage from the user management dashboard.
                </p>
                <Button variant="outline" asChild>
                  <a href="/admin/dashboard/users" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    User Management
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
