"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { signIn, signUp, signOut, getCurrentUser, getCurrentSession, refreshAuthSession, isAdmin } from "@/lib/auth"

export type User = {
  id: string
  username: string
  email: string
  isAdmin: boolean
  isPremium: boolean
  isExpired: boolean
  wasPremium: boolean
  tokenBalance: number
  creditBalance: number
  createdAt: string
  avatar?: string
}

type AuthContextType = {
  user: User | null
  users: User[]
  login: (email: string, password: string) => Promise<boolean>
  signup: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  tokenBalance: number
  creditBalance: number
  refreshSession: () => Promise<boolean>
  refreshUser: () => Promise<void>
  isLoading: boolean
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string; needsMigration?: boolean }>
  checkDeleteUserFunction: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple debounce function to prevent too many requests
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ... (debounce)
const supabase = createClient()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const fetchingUsers = useRef(false)
  const lastFetchTime = useRef(0)

  // Check if user is logged in on mount
  useEffect(() => {
    async function loadUser() {
      setIsLoading(true)
      try {
        // First try to get the current session
        const session = await getCurrentSession()

        if (!session) {
          // If no session, try to refresh it, but don't throw an error if it fails
          const refreshed = await refreshAuthSession()
          if (!refreshed) {
            console.log("No active session found and refresh failed")
            setUser(null)
            setIsLoading(false)
            return
          }
        }

        // Now get the user
        let user = await getCurrentUser()

        // If check failed but we potentially had a session, try one more refresh to recover
        if (!user) {
          console.log("User check failed. Attempting recovery refresh.");
          const refreshed = await refreshAuthSession();
          if (refreshed) {
            user = await getCurrentUser();
          }
        }

        if (!user) {
          console.log("No user found after session check")
          setUser(null)
          setIsLoading(false)
          return
        }

        // Check if the user is an admin
        const adminStatus = await isAdmin(user.id)

        // Check premium status and balances from robust endpoint
        let isPremium = false
        let isExpired = false
        let wasPremium = false
        let tokenBalance = 0
        let creditBalance = 0
        try {
          const premiumResponse = await fetch(`/api/check-premium-status`)
          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json()
            isPremium = premiumData.isPremium
            isExpired = premiumData.isExpired
            wasPremium = premiumData.wasPremium
            tokenBalance = premiumData.tokenBalance || 0
            creditBalance = premiumData.creditBalance || 0
          }
        } catch (e) {
          console.error("Failed to check premium status during initial load")
        }

        setUser({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split("@")[0] || "User",
          email: user.email || "",
          isAdmin: adminStatus,
          isPremium: isPremium,
          isExpired: isExpired,
          wasPremium: wasPremium,
          tokenBalance: tokenBalance,
          creditBalance: creditBalance,
          createdAt: user.created_at || new Date().toISOString(),
          avatar: user.user_metadata?.avatar_url,
        })
      } catch (error) {
        console.error("Error loading user:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Load users from database when admin is logged in
  useEffect(() => {
    // Debounced fetch function to prevent too many requests
    const debouncedFetchUsers = debounce(async () => {
      if (!user?.isAdmin || fetchingUsers.current) return

      // Rate limiting - only fetch once every 10 seconds
      const now = Date.now()
      if (now - lastFetchTime.current < 10000) return

      fetchingUsers.current = true
      lastFetchTime.current = now

      try {
        // Fetch users from auth.users via Supabase functions or API
        const { data, error } = await supabase.from("users").select("*")

        if (error) {
          console.error("Error fetching users:", error)
          return
        }

        if (data) {
          // Transform the data to match our User type
          const formattedUsers = data.map((u: any) => ({
            id: u.id,
            username: u.username || u.email.split("@")[0],
            email: u.email,
            isAdmin: u.is_admin || false,
            isPremium: u.is_premium || false,
            tokenBalance: 0,
            creditBalance: 0,
            createdAt: u.created_at,
          }))

          setUsers(formattedUsers)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        fetchingUsers.current = false
      }
    }, 300)

    if (user?.isAdmin) {
      debouncedFetchUsers()
    }
  }, [user?.isAdmin, user?.id])


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Create client dynamically
      const supabase = createClient()

      // 1. Sign in with Cookie Client (Sets HttpOnly Cookie for Middleware)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error.message)
        return false
      }

      if (data?.user && data?.session) {
        // Check admin status directly with error handling
        let adminStatus = false
        try {
          adminStatus = await isAdmin(data.user.id)
          console.log("Admin status check result:", adminStatus)
        } catch (adminError) {
          console.error("Error checking admin status:", adminError)
          // Continue with login even if admin check fails
          adminStatus = false
        }

        // Check premium status and balances
        let isPremium = false
        let isExpired = false
        let wasPremium = false
        let tokenBalance = 0
        let creditBalance = 0
        try {
          const premiumResponse = await fetch(`/api/check-premium-status`)
          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json()
            isPremium = premiumData.isPremium
            isExpired = premiumData.isExpired
            wasPremium = premiumData.wasPremium
            tokenBalance = premiumData.tokenBalance || 0
            creditBalance = premiumData.creditBalance || 0
          }
        } catch (e) {
          console.error("Failed to check premium status during login")
        }

        setUser({
          id: data.user.id,
          username: data.user.user_metadata?.username || data.user.email?.split("@")[0] || "User",
          email: data.user.email || "",
          isAdmin: adminStatus,
          isPremium: isPremium,
          isExpired: isExpired,
          wasPremium: wasPremium,
          tokenBalance: tokenBalance,
          creditBalance: creditBalance,
          createdAt: data.user.created_at || new Date().toISOString(),
          avatar: data.user.user_metadata?.avatar_url,
        })

        // Store user in localStorage for persistence
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: data.user.id,
            username: data.user.user_metadata?.username || data.user.email?.split("@")[0] || "User",
            email: data.user.email || "",
            isAdmin: adminStatus,
            createdAt: data.user.created_at || new Date().toISOString(),
          }),
        )

        // Clear anonymous user ID on login to prevent mixing guest and user images
        try {
          const { clearAnonymousUserId } = await import("@/lib/anonymous-user")
          clearAnonymousUserId()
        } catch (e) {
          console.error("Failed to clear anonymous user ID on login", e)
        }

        // Check for post-login redirect
        const postLoginRedirect = sessionStorage.getItem('postLoginRedirect')
        if (postLoginRedirect) {
          sessionStorage.removeItem('postLoginRedirect')

          // Check if user is new (no characters)
          try {
            const charCountResponse = await fetch('/api/user-characters-count')
            const charData = await charCountResponse.json()

            if (charData.isNewUser && postLoginRedirect === '/my-ai') {
              // New user specifically trying to access My AI - redirect to create character
              window.location.href = '/create-character'
              return true
            } else {
              // Existing user OR new user accessing other pages (like collections) - go to intended destination
              window.location.href = postLoginRedirect
              return true
            }
          } catch (e) {
            console.error('Error checking user status:', e)
            // Fallback to intended path
            window.location.href = postLoginRedirect
            return true
          }
        }

        // No specific redirect - force reload to ensure session/user state is refreshed
        window.location.reload()
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const signup = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await signUp(email, password)

      if (error) {
        console.error("Signup error:", error.message)
        return false
      }

      if (data?.user) {
        // Update user metadata to include username
        await supabase.auth.updateUser({
          data: { username },
        })

        // Note: We don't set the user here because they need to confirm their email first
        // or log in after signup
        return true
      }

      return false
    } catch (error) {
      console.error("Signup error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const checkDeleteUserFunction = async (): Promise<boolean> => {
    try {
      // First try to check if the function exists in the database directly
      const { data, error: functionCheckError } = await (supabase as any).rpc("exec_sql", {
        sql: "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user')",
      })

      if (data && data[0] && data[0].exists) {
        return true
      }

      // Fallback: Try to call the function with a non-existent user ID
      // This will fail with a specific error if the function exists
      const { error } = await (supabase as any).rpc("delete_user", { user_id: "00000000-0000-0000-0000-000000000000" })

      // If we get an error about the user not existing or admin permissions, the function exists
      if (
        error &&
        (error.message.includes("User not found") ||
          error.message.includes("Cannot delete administrator accounts") ||
          error.message.includes("Only administrators can delete users"))
      ) {
        return true
      }

      // If we get an error about the function not existing, it doesn't exist
      if (error && error.message.includes("Could not find the function")) {
        return false
      }

      // Default to true if we're not sure - better to enable than disable
      return true
    } catch (error) {
      console.error("Error checking delete_user function:", error)
      // Default to true if there's an error - better to enable than disable
      return true
    }
  }

  const deleteUser = async (id: string) => {
    try {
      // First check if the user exists
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", id).single()

      if (userError || !userData) {
        console.error("Error finding user:", userError)
        return { success: false, error: "User not found" }
      }

      // Don't allow deleting admin users
      if (userData.is_admin) {
        return { success: false, error: "Cannot delete administrator accounts" }
      }

      // Delete the user from auth.users via admin API
      // Update the parameter name from user_id to target_user_id
      const { error } = await supabase.rpc("delete_user", { target_user_id: id })

      if (error) {
        console.error("Error deleting user:", error)

        // Check if this is a function not found error
        if (error.message.includes("Could not find the function")) {
          return {
            success: false,
            error: "The delete_user function does not exist. Please run the migration first.",
            needsMigration: true,
          }
        }

        return { success: false, error: error.message }
      }

      // Update local state
      setUsers(users.filter((u) => u.id !== id))
      return { success: true }
    } catch (error) {
      console.error("Error in deleteUser:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      // Check if this is a function not found error
      if (errorMessage.includes("Could not find the function")) {
        return {
          success: false,
          error: "The delete_user function does not exist. Please run the migration first.",
          needsMigration: true,
        }
      }

      return { success: false, error: errorMessage }
    }
  }

  const refreshUser = async () => {
    console.log("🔄 refreshUser called");
    try {
      const authUser = await getCurrentUser()
      console.log("👤 authUser from getCurrentUser:", authUser ? "Found" : "Not Found");

      if (authUser) {
        console.log("🔍 Checking admin status...");
        const adminStatus = await isAdmin(authUser.id)
        console.log("👑 adminStatus:", adminStatus);

        let isPremium = false
        let isExpired = false
        let wasPremium = false
        let tokenBalance = 0
        let creditBalance = 0
        try {
          console.log("💎 Checking premium status...");
          const premiumResponse = await fetch(`/api/check-premium-status`)
          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json()
            isPremium = premiumData.isPremium
            isExpired = premiumData.isExpired
            wasPremium = premiumData.wasPremium
            tokenBalance = premiumData.tokenBalance || 0
            creditBalance = premiumData.creditBalance || 0
            console.log("✅ Premium data fetched:", { isPremium, tokenBalance });
          }
        } catch (e) {
          console.error("❌ Failed to check premium status during refresh:", e)
        }

        console.log("💾 Updating user state...");
        setUser({
          id: authUser.id,
          username: authUser.user_metadata?.username || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          isAdmin: adminStatus,
          isPremium: isPremium,
          isExpired: isExpired,
          wasPremium: wasPremium,
          tokenBalance: tokenBalance,
          creditBalance: creditBalance,
          createdAt: authUser.created_at || new Date().toISOString(),
          avatar: authUser.user_metadata?.avatar_url,
        })
        console.log("✨ User state updated successfully");
      } else {
        console.log("⚠️ No authUser found, skipping update");
      }
    } catch (error) {
      console.error("❌ Error refreshing user:", error)
    }
  }

  // Add this function to the AuthProvider component
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Error refreshing session:", error)
        // If refresh fails, log the user out
        await logout()
        return false
      }
      return true
    } catch (error) {
      console.error("Error refreshing session:", error)
      return false
    }
  }

  // Add refreshSession to the context value
  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        signup,
        logout,
        tokenBalance: user?.tokenBalance || 0,
        creditBalance: user?.creditBalance || 0,
        refreshSession,
        refreshUser,
        isLoading,
        deleteUser,
        checkDeleteUserFunction,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
