"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-context"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("admin")
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

      // First, sign in directly with Supabase
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

      if (!data?.user) {
        setError("Failed to sign in")
        setIsLoading(false)
        return
      }

      setLoginStatus("Checking admin status...")

      try {
        // Use the Server Action to check admin status securely
        // We import this dynamically or rely on the fact that we can fetch an API route
        // But since we can't easily import 'isUserAdmin' if not already imported and it's a client component...
        // Let's use the API route /api/admin/check which uses the server-side logic
        
        const response = await fetch('/api/admin/check')
        
        if (!response.ok) {
           // If request failed (e.g. 401/403), try to see if it's because cookies aren't ready?
           // Actually, fetch from client might not send cookies by default unless credentials: 'include' is set?
           // But same-origin requests usually do.
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
        
        // Clean up any legacy local storage hacks
        localStorage.removeItem("currentUser") 
        localStorage.removeItem("isAdmin:" + data.user.id)

        // Redirect to dashboard
        router.refresh() // Refresh to ensure cookies are picked up
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 500)
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

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Default admin credentials: email: admin@example.com, password: admin</p>
          </div>
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-400">
              Need an admin account?{" "}
              <Link href="/admin/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
          <div className="mt-2 text-center text-sm">
            <p className="text-gray-400">
              Having trouble?{" "}
              <Link href="/admin/manual-setup" className="text-primary hover:underline">
                Manual Setup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
