"use server";

import { createAdminClient } from '@/lib/supabase-admin';

/**
 * Ensures user has a token balance record
 * If not, creates one with 50 free tokens
 */
export async function ensureUserTokens(userId: string): Promise<number> {
  const supabase = await createAdminClient();
  
  // Check if user already has tokens
  const { data: existing } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .single();
  
  if (existing) {
    return existing.balance;
  }
  
  // Create initial token balance (50 free tokens for all users)
  const initialTokens = 50;
  
  await supabase
    .from('user_tokens')
    .insert({
      user_id: userId,
      balance: initialTokens,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  // Log the welcome bonus
  await supabase
    .from('token_transactions')
    .insert({
      user_id: userId,
      amount: initialTokens,
      type: 'bonus',
      description: 'Welcome bonus - 50 free tokens',
      created_at: new Date().toISOString()
    });
  
  console.log(`✅ Created token balance for user ${userId.substring(0, 8)}: ${initialTokens} tokens`);
  
  return initialTokens;
}

/**
 * Get user's current token balance
 * Creates token record if doesn't exist
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  return await ensureUserTokens(userId);
}
