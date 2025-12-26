"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()
const hasSupabaseConfig = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
import { useTranslations } from "@/lib/use-translations"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import Link from "next/link"
import { Home, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const search = useSearchParams()
  const router = useRouter()
  const { t } = useTranslations()

  const presetEmail = search.get("email") || ""
  const isUpdate = search.get("update") === "true"

  const [email, setEmail] = useState(presetEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updated, setUpdated] = useState(false)

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!hasSupabaseConfig) {
      const errorMessage = t("reset.missingConfig")
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }
    if (!email) {
      const errorMessage = t("reset.emailRequired")
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }
    // basic email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const errorMessage = t("reset.invalidEmail")
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }
    setSending(true)
    try {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password?update=true')}`,
      })
      if (supaError) throw supaError
      setSent(true)
      toast.success(t("reset.linkSentTitle"))
    } catch (err: any) {
      console.error(err)
      const errorMessage = err?.message || t("reset.errorGeneric")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSending(false)
    }
  }

  // Check for session validity when in update mode
  useEffect(() => {
    if (isUpdate) {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError(t("reset.sessionExpired") || "Session expired or invalid. Please request a new password reset link.")
        }
      }
      checkSession()
    }
  }, [isUpdate, t])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!hasSupabaseConfig) {
      const errorMessage = t("reset.missingConfig")
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }
    if (!password || password.length < 6) {
      const errorMessage = t("signup.passwordMinLength")
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }
    setUpdating(true)
    try {
      // Check session before attempting update
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Session expired. Please try requesting a new reset link.")
      }

      // Update the password
      const { data, error: supaError } = await supabase.auth.updateUser({ password })
      if (supaError) throw supaError

      setUpdated(true)
      toast.success("Password updated successfully! Please login with your new password.")

      // Sign out the user to ensure they login with new credentials
      await supabase.auth.signOut()

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login?message=Password reset successful. Please login with your new password.")
      }, 1500)
    } catch (err: any) {
      console.error(err)
      const errorMessage = err?.message || t("reset.errorGeneric")
      // Handle the specific "Auth session missing!" error locally if it slips through
      if (errorMessage.includes("Auth session missing")) {
        setError("Your session has expired. Please request a new password reset link.")
      } else {
        setError(errorMessage)
      }
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="mx-auto max-w-md w-full px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <div className="p-1.5 rounded-full bg-muted group-hover:bg-muted-foreground/10 transition-colors">
          <Home className="h-4 w-4" />
        </div>
        <span>{t("navigation.home") || "Back to Home"}</span>
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("reset.title")}</h1>

      {!isUpdate ? (
        <form onSubmit={handleSendLink} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="reset-email" className="block text-sm text-muted-foreground">
              {t("reset.emailLabel")}
            </label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("reset.emailPlaceholder")}
              className="bg-card border-border"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          {sent && (
            <div className="text-sm text-emerald-500">
              <p className="font-medium">{t("reset.linkSentTitle")}</p>
              <p>{t("reset.linkSentDescription")}</p>
            </div>
          )}

          <Button type="submit" disabled={sending} className="w-full">
            {sending ? t("reset.sending") : t("reset.sendLink")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm text-muted-foreground">
              {t("reset.newPasswordLabel")}
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("reset.newPasswordPlaceholder")}
                className="bg-card border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          {updated && (
            <div className="text-sm text-emerald-500">
              <p className="font-medium">{t("reset.updatedTitle")}</p>
              <p>{t("reset.updatedDescription")}</p>
            </div>
          )}

          <Button type="submit" disabled={updating} className="w-full">
            {updating ? t("reset.updating") : t("reset.updatePassword")}
          </Button>
        </form>
      )}
    </div>
  )
}
