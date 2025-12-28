import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "./supabase-admin"

// Get user's token balance (Admin-powered for reliability)
export async function getUserTokenBalance(userId: string) {
  try {
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      console.warn("Failed to get admin client for balance check, falling back to standard client")
      const supabase = await createClient()
      const { data, error } = await supabase.from("user_tokens").select("balance").eq("user_id", userId).maybeSingle()
      return (data as any)?.balance || 0
    }

    const { data, error } = await supabaseAdmin.from("user_tokens").select("balance").eq("user_id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching token balance:", error)
      return 0
    }

    return (data as any)?.balance || 0
  } catch (error) {
    console.error("Error in getUserTokenBalance:", error)
    return 0
  }
}

// Check if user has enough tokens
export async function hasEnoughTokens(userId: string, requiredTokens: number) {
  const balance = await getUserTokenBalance(userId)
  return balance >= requiredTokens
}

// Deduct tokens from user's balance
export async function deductTokens(userId: string, amount: number, description: string, metadata: any = {}) {
  try {
    const supabaseAdmin = await createAdminClient()

    if (!supabaseAdmin) {
      throw new Error("Failed to initialize Supabase admin client")
    }

    // 1. Get current balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from("user_tokens")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (userError) throw userError
    
    // If no record exists, consider balance as 0
    const balance = userData?.balance || 0
    
    if (balance < amount) {
      console.warn(`⚠️ User ${userId.substring(0, 8)} has insufficient tokens (${balance} < ${amount})`)
      throw new Error("Insufficient tokens")
    }

    const originalBalance = balance
    const newBalance = originalBalance - amount

    // 2. Update balance
    const { error: updateError } = await supabaseAdmin
      .from("user_tokens")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (updateError) throw updateError

    // 3. Record transaction
    const { error: transactionError } = await supabaseAdmin.from("token_transactions").insert({
      user_id: userId,
      amount: -amount,
      type: "usage",
      description,
      metadata,
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.error("Failed to record transaction, REVERTING balance deduction:", transactionError)
      // REVERT balance update if transaction insert fails
      await supabaseAdmin.from("user_tokens").update({
        balance: originalBalance,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId)

      throw transactionError
    }

    // 4. Log to cost_logs (silent failure allowed here as it's for analytics only)
    try {
      await supabaseAdmin.from("cost_logs").insert({
        user_id: userId,
        action_type: metadata?.activity_type || 'token_usage',
        cost: amount,
        metadata: { ...metadata, description, source: 'deductTokens' }
      })
    } catch (e) {
      console.error("Non-critical: Failed to log to cost_logs:", e)
    }

    return true
  } catch (error) {
    console.error("Error in deductTokens:", error)
    return false
  }
}

// Add tokens to user's balance
export async function addTokens(
  userId: string,
  amount: number,
  type: "purchase" | "refund" | "bonus",
  description: string,
  metadata: any = {},
) {
  try {
    const supabaseAdmin = await createAdminClient()

    if (!supabaseAdmin) {
      throw new Error("Failed to initialize Supabase admin client")
    }

    // Check if user has a token balance record
    const { data: existingBalance, error: balanceError } = await supabaseAdmin
      .from("user_tokens")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (balanceError) {
      throw balanceError
    }

    if (existingBalance) {
      // Update existing balance
      const { error: updateError } = await supabaseAdmin
        .from("user_tokens")
        .update({
          balance: existingBalance.balance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        throw updateError
      }
    } else {
      // Create new balance record
      const { error: insertError } = await supabaseAdmin.from("user_tokens").insert({
        user_id: userId,
        balance: amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        throw insertError
      }
    }

    // Record transaction
    const { error: transactionError } = await supabaseAdmin.from("token_transactions").insert({
      user_id: userId,
      amount,
      type,
      description,
      metadata,
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      throw transactionError
    }

    return true
  } catch (error) {
    console.error("Error in addTokens:", error)
    return false
  }
}

// Get user's token transaction history
export async function getTokenTransactions(userId: string, limit = 50) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("token_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching token transactions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getTokenTransactions:", error)
    return []
  }
}

// Refund tokens to user's balance (for failed operations)
export async function refundTokens(userId: string, amount: number, description: string, metadata: any = {}) {
  try {
    console.log(`🔄 Refunding ${amount} tokens to user ${userId.substring(0, 8)}...`)

    const result = await addTokens(userId, amount, "refund", description, metadata)

    if (result) {
      console.log(`✅ Successfully refunded ${amount} tokens`)
    } else {
      console.error(`❌ Failed to refund ${amount} tokens`)
    }

    return result
  } catch (error) {
    console.error("Error in refundTokens:", error)
    return false
  }
}
