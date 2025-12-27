import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Instead of throwing an error, return both data and error
  return { data, error }
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/admin/login`,
    },
  })

  // Instead of throwing an error, return both data and error
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Also update the getCurrentUser function to handle errors better
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user:", error)
      return null
    }

    return data.user
  } catch (error) {
    console.error("Exception getting user:", error)
    return null
  }
}

// Update getCurrentSession to be more robust
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return data.session
  } catch (error) {
    console.error("Exception getting session:", error)
    return null
  }
}

export async function isAdmin(userId: string) {
  try {
    console.log('[isAdmin] Checking admin status for user:', userId)

    // Method 1: Check admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()

    console.log('[isAdmin] admin_users query result:', { data: adminUser, error: adminError })

    if (adminUser) {
      console.log('[isAdmin] ✅ User found in admin_users table')
      cacheAdminStatus(userId, true)
      return true
    }

    // Method 2 (Legacy/Social): Check profiles.is_admin (fallback)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()

    console.log('[isAdmin] profiles query result:', { data: profile, error: profileError })

    if (profile?.is_admin) {
      console.log('[isAdmin] ✅ User has is_admin=true in profiles')
      cacheAdminStatus(userId, true)
      return true
    }

    // Method 4: Check user metadata (fallback)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.role === 'admin') {
        console.log('[isAdmin] ✅ User has admin role in metadata')
        cacheAdminStatus(userId, true)
        return true
      }
    } catch (e) {
      console.log('[isAdmin] Could not check user metadata')
    }

    console.log('[isAdmin] ❌ User is not an admin')
    cacheAdminStatus(userId, false)
    return false

  } catch (error) {
    console.error("[isAdmin] Exception checking admin status:", error)
    return false
  }
}

// Helper to cache admin status
function cacheAdminStatus(userId: string, isAdmin: boolean) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem("isAdmin:" + userId, isAdmin.toString())
  }
}

// For development/testing purposes - create a mock admin user
export async function createMockAdminUser() {
  // Check if we're in development mode
  if (process.env.NODE_ENV !== "development") return false

  // For demo purposes, create a mock admin user
  const email = "admin@example.com"
  const password = "admin"

  // Check if user exists
  const { data: existingUser } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (existingUser?.user) {
    // User exists, make sure they're an admin
    try {
      const { data: adminData, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", existingUser.user.id)
        .single()

      if (!adminData && !error) {
        // Add to admin_users table
        await supabase.from("admin_users").insert([{ user_id: existingUser.user.id }])
      }
    } catch (error) {
      console.error("Error checking/creating admin status:", error)
    }

    return true
  }

  // Create the user
  const { data: newUser, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError || !newUser.user) return false

  try {
    // Add to admin_users table
    await supabase.from("admin_users").insert([{ user_id: newUser.user.id }])
  } catch (error) {
    console.error("Error creating admin user:", error)
  }

  return true
}

// Add a function to refresh the session
export async function refreshAuthSession() {
  try {
    // First check if we have a session before trying to refresh
    const { data: sessionData } = await supabase.auth.getSession()

    // If no session exists at all, return false immediately without trying to refresh
    if (!sessionData?.session) {
      console.log("No session to refresh")
      return false
    }

    // Now try to refresh the existing session
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing session:", error)
      return false
    }

    // Verify we actually have a session after refresh
    if (!data.session) {
      console.warn("Session refresh succeeded but no session returned")
      return false
    }

    return true
  } catch (error) {
    console.error("Exception refreshing session:", error)
    return false
  }
}
