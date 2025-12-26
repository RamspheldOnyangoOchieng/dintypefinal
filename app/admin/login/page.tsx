"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-context"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import legacySupabase from "@/lib/supabase"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginStatus, setLoginStatus] = useState("")
  const router = useRouter()
  const { login, user } = useAuth()

  // Create Supabase client that uses cookies
  const supabase = createClient()

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (user?.isAdmin) {
      router.push("/admin/dashboard")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoginStatus("")
    setIsLoading(true)

    try {
      setLoginStatus("Authenticating...")

      // First, sign in directly with Supabase (Cookie Client)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("Sign in error:", signInError)
        setError(signInError.message || "Invalid email or password")
        setIsLoading(false)
        return
      }

      if (!data?.user || !data?.session) {
        setError("Failed to sign in")
        setIsLoading(false)
        return
      }

      setLoginStatus("Checking admin status...")

      try {
        const response = await fetch('/api/admin/check')

        if (!response.ok) {
          throw new Error("Admin check failed")
        }

        const checkData = await response.json()

        if (!checkData.isAdmin) {
          setError("You don't have admin privileges")
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        setLoginStatus("Login successful! Redirecting...")

        // SYNC FIX: Set the session on the legacy client that AuthProvider uses (LocalStorage)
        // This ensures the client-side AuthProvider and AdminGuard see the user immediately
        const { error: syncError } = await legacySupabase.auth.setSession(data.session)
        if (syncError) console.error("Session sync error:", syncError)

        // Hard redirect to dashboard to ensure Middleware sees the new Cookies
        window.location.href = "/admin/dashboard"

      } catch (adminCheckError) {
        console.error("Admin check error:", adminCheckError)
        setError("Error validating admin privileges.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(`An error occurred during login: ${err instanceof Error ? err.message : "Unknown error"}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A1A] rounded-xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-400">Enter your credentials to access the admin panel</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {loginStatus && !error && (
            <div className="bg-blue-900/20 border border-blue-800 text-blue-300 px-4 py-3 rounded-lg mb-6 flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>{loginStatus}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#252525] border-[#333] text-white"
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#252525] border-[#333] text-white"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm space-y-4">
            <div>
              <Link href="/reset-password" className="text-muted-foreground hover:text-white transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div>
              <Link href="/" className="text-muted-foreground hover:text-white transition-colors inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
