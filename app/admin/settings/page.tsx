"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-context"
import { createClient } from "@/utils/supabase/client"
import { useSite } from "@/components/site-context"
import { useTranslations } from "@/lib/use-translations"
import { AdminDebug } from "@/components/admin-debug"
import { Settings, Globe, CreditCard, Save, AlertCircle, Plug } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    // Add other settings as needed
  })
  const router = useRouter()
  const { user } = useAuth() // Use the same auth context as the sidebar
  const supabase = createClient()
  const { settings: siteSettings, updateSettings: updateSiteSettings } = useSite()
  const { t } = useTranslations()

  useEffect(() => {
    // Check if user is admin and load settings
    const checkAdminAndLoadSettings = async () => {
      try {
        setIsLoading(true)

        // If no user, we're not authenticated
        if (!user) {
          router.push("/admin/login?redirect=/admin/settings")
          return
        }

        // Load settings regardless of admin status for now
        const { data: adminSettings, error } = await supabase.from("admin_settings").select("*").single()

        if (error) {
          console.error("Error loading admin settings:", error)
        } else if (adminSettings) {
          setSettings(adminSettings)
        }
      } catch (error) {
        console.error("Error loading admin settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAndLoadSettings()
  }, [user?.id]) // Only depend on user ID

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)

      const { error } = await supabase.from("admin_settings").upsert({
        id: 1, // Assuming there's only one settings record
        ...settings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success(t("admin.settingsSaved"))
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error(t("admin.settingsError"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleLanguageChange = (value: "en" | "sv") => {
    updateSiteSettings({ language: value })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t ? t("admin.settings") : "Admin Settings"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Configure system settings and integrations</p>
        </div>
      </div>

      {/* Quick Links Card - MOVED TO TOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plug className="h-5 w-5 text-primary" />
              <span>🔌 External Integrations</span>
            </CardTitle>
            <CardDescription>
              Configure Stripe webhooks, OAuth providers, and email services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/admin/settings/integrations")}
              className="w-full"
              size="lg"
            >
              <Settings className="mr-2 h-5 w-5" />
              Manage Integrations
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              ✨ Set up Stripe, OAuth, and email services from a simple admin interface.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>📧 Email Templates</span>
            </CardTitle>
            <CardDescription>
              Customize welcome, payment, and notification emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/admin/settings/email-templates")}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Email Templates
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              ✨ Edit HTML & text templates with live preview - no code editing required!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <span>{t("admin.language")}</span>
          </CardTitle>
          <CardDescription>{t("admin.languageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t("admin.selectLanguage")}</Label>
              <Select
                value={siteSettings.language}
                onValueChange={(value) => handleLanguageChange(value as "en" | "sv")}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder={t("admin.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🇺🇸</span>
                      <span>{t("admin.english")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sv">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🇸🇪</span>
                      <span>{t("admin.swedish")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings Sections */}
      <div className="space-y-6">
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current system status and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-500">Environment</Label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {process.env.NODE_ENV || "development"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-500">Version</Label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">v1.0.0</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-500">Last Updated</Label>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
