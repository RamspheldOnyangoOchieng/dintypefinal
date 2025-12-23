/**
 * Admin utility functions for checking admin status across the application
 */

import { createClient } from '@/lib/supabase/client'

/**
 * List of admin email addresses that should have full privileges
 */
const ADMIN_EMAILS = [
  'admin@sinsync.co.uk'
]

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Check if the current user is an admin (client-side)
 * Checks both the admin_users table and the admin email list
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Get current user if userId not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      userId = user.id
      
      // Quick check for admin email
      if (user.email && isAdminEmail(user.email)) {
        return true
      }
    }
    
    // Check admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if user should bypass email verification
 * Admins always bypass verification
 */
export async function shouldBypassVerification(userId?: string, email?: string): Promise<boolean> {
  // Quick check for admin email
  if (email && isAdminEmail(email)) {
    return true
  }
  
  // Check if user is admin
  return await isAdmin(userId)
}

/**
 * Server-side admin check using Supabase client
 * Use this in API routes and server components
 */
export async function isAdminServer(supabase: any, userId: string): Promise<boolean> {
  try {
    // Check admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      // Fallback: check email
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      if (userData?.user?.email && isAdminEmail(userData.user.email)) {
        return true
      }
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error checking admin status (server):', error)
    return false
  }
}
