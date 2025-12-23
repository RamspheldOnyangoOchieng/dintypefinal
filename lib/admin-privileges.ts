"use server"

import { createClient } from "@/lib/supabase-server"

export interface AdminPrivileges {
  isAdmin: boolean
  canBypassTokenLimits: boolean
  canBypassMessageLimits: boolean
  canBypassImageLimits: boolean
  unlimitedTokens: boolean
  maxTokens: number
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Check admin_users table
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (adminUser) return true
    
    // Check app_admins table
    const { data: appAdmin } = await supabase
      .from('app_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (appAdmin) return true
    
    // Check admins table
    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    
    return !!admin
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get full admin privileges for a user
 */
export async function getAdminPrivileges(userId: string): Promise<AdminPrivileges> {
  const defaultPrivileges: AdminPrivileges = {
    isAdmin: false,
    canBypassTokenLimits: false,
    canBypassMessageLimits: false,
    canBypassImageLimits: false,
    unlimitedTokens: false,
    maxTokens: 0
  }
  
  try {
    const isAdmin = await isUserAdmin(userId)
    
    if (!isAdmin) {
      return defaultPrivileges
    }
    
    // Admin gets all privileges by default
    const adminPrivileges: AdminPrivileges = {
      isAdmin: true,
      canBypassTokenLimits: true,
      canBypassMessageLimits: true,
      canBypassImageLimits: true,
      unlimitedTokens: true,
      maxTokens: 999999999
    }
    
    // Try to get custom privileges from database
    const supabase = await createClient()
    const { data: privileges } = await supabase
      .from('admin_privileges')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (privileges) {
      return {
        isAdmin: true,
        canBypassTokenLimits: privileges.can_bypass_token_limits ?? true,
        canBypassMessageLimits: privileges.can_bypass_message_limits ?? true,
        canBypassImageLimits: privileges.can_bypass_image_limits ?? true,
        unlimitedTokens: privileges.unlimited_tokens ?? true,
        maxTokens: privileges.max_tokens ?? 999999999
      }
    }
    
    return adminPrivileges
  } catch (error) {
    console.error('Error getting admin privileges:', error)
    return defaultPrivileges
  }
}

/**
 * Check if user can bypass token limits (admins always can)
 */
export async function canBypassTokenLimits(userId: string): Promise<boolean> {
  const privileges = await getAdminPrivileges(userId)
  return privileges.canBypassTokenLimits
}

/**
 * Check if user can bypass message limits (admins always can)
 */
export async function canBypassMessageLimits(userId: string): Promise<boolean> {
  const privileges = await getAdminPrivileges(userId)
  return privileges.canBypassMessageLimits
}

/**
 * Check if user can bypass image generation limits (admins always can)
 */
export async function canBypassImageLimits(userId: string): Promise<boolean> {
  const privileges = await getAdminPrivileges(userId)
  return privileges.canBypassImageLimits
}

/**
 * Get effective token balance for user (admins get unlimited)
 */
export async function getEffectiveTokenBalance(userId: string): Promise<number> {
  const privileges = await getAdminPrivileges(userId)
  
  if (privileges.unlimitedTokens) {
    return 999999999 // Return very high number for admins
  }
  
  // Get actual balance from database
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_tokens')
    .select('tokens')
    .eq('user_id', userId)
    .maybeSingle()
  
  return data?.tokens ?? 0
}
