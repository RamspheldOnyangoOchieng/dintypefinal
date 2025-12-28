"use server";

import { createAdminClient } from '@/lib/supabase-admin';

/**
 * Ensures user has a token balance record
 * If not, creates one with 50 free tokens
 */
export async function ensureUserTokens(userId: string): Promise<number> {
  const supabase = await createAdminClient();
  const initialTokens = 0;

  if (!supabase) {
    console.error('Failed to create admin client');
    return 0;
  }

  try {
    // Check if user already has tokens
    const { data: existing, error: fetchError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple rows (shouldn't happen but safe) or 0 rows

    if (existing) {
      return existing.balance;
    }

    // Create initial token balance (0 tokens for all users)
    // Removed created_at to avoid schema issues if column is missing
    const { error: insertError } = await supabase
      .from('user_tokens')
      .insert({
        user_id: userId,
        balance: initialTokens,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating token balance:', insertError);
      // Fallback: return initial tokens anyway so UI doesn't break, 
      // even if DB write failed
      return initialTokens;
    }

    // Welcome bonus removed as per user request
    /* 
    try {
      await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          amount: initialTokens,
          type: 'bonus',
          description: 'Welcome bonus - 50 free tokens',
          created_at: new Date().toISOString()
        });
    } catch (e) {
      // Ignore transaction log errors
    }
    */

    console.log(`✅ Created token balance record for user ${userId.substring(0, 8)}`);

    return initialTokens;
  } catch (error) {
    console.error('Error in ensureUserTokens:', error);
    // In strict testing mode, if DB fails, assume they have tokens 
    // to unblock the UI flow.
    return initialTokens;
  }
}

/**
 * Get user's current token balance
 * Creates token record if doesn't exist
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  return await ensureUserTokens(userId);
}
