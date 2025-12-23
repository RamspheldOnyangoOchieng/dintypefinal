"use server";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createAdminClient } from '@/lib/supabase-admin';
import { isUserAdmin, getAdminPrivileges } from '@/lib/admin-privileges';

export interface UserPlanInfo {
  planType: 'free' | 'premium';
  status: string;
  currentPeriodEnd?: string;
  restrictions: Record<string, any>;
}

export interface UsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number | null;
  message?: string;
}

// Get user's current plan info
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const supabase = await createAdminClient();

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  const planType = subscription?.plan_type || 'free';

  // Get all restrictions for this plan
  const { data: restrictions } = await supabase
    .from('plan_restrictions')
    .select('*')
    .eq('plan_type', planType);

  const restrictionsMap: Record<string, any> = {};
  restrictions?.forEach(r => {
    restrictionsMap[r.restriction_key] = r.restriction_value;
  });

  return {
    planType,
    status: subscription?.status || 'active',
    currentPeriodEnd: subscription?.current_period_end,
    restrictions: restrictionsMap
  };
}

// Check if user can send a message
export async function checkMessageLimit(userId: string): Promise<UsageCheck> {
  console.log('🔍 Checking message limit for user:', userId);

  try {
    // ADMIN BYPASS: Admins have unlimited messages
    const adminPrivileges = await getAdminPrivileges(userId);
    console.log('🔓 Admin privileges check result:', adminPrivileges);

    if (adminPrivileges.isAdmin || adminPrivileges.canBypassMessageLimits) {
      console.log('🔓 Admin bypass: Unlimited messages for admin user');
      return { allowed: true, currentUsage: 0, limit: null };
    }

    const supabase = await createAdminClient();

    const planInfo = await getUserPlanInfo(userId);
    console.log('📋 User plan info:', planInfo);

    const limit = planInfo?.restrictions?.daily_message_limit;

    // If null/undefined/unlimited, allow
    if (!limit || limit === null || limit === 'null' || limit === undefined) {
      console.log('✅ No message limit set, allowing message');
      return { allowed: true, currentUsage: 0, limit: null };
    }

    // Parse limit to number
    const limitNum = parseInt(String(limit), 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      console.log('✅ Invalid limit value, allowing message');
      return { allowed: true, currentUsage: 0, limit: null };
    }

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: usage, error: usageError } = await supabase
      .from('user_usage_tracking')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('usage_type', 'messages')
      .gte('reset_date', today.toISOString())
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error fetching usage:', usageError);
    }

    const currentUsage = usage?.usage_count || 0;
    const allowed = currentUsage < limitNum;

    console.log(`📊 Message limit check: ${currentUsage}/${limitNum} - ${allowed ? 'ALLOWED' : 'BLOCKED'}`);

    return {
      allowed,
      currentUsage,
      limit: limitNum,
      message: allowed ? undefined : `Daily message limit reached (${limitNum} messages/day). Upgrade to Premium for unlimited messages.`
    };
  } catch (error) {
    console.error('❌ Error in checkMessageLimit:', error);
    // On error, allow the message to not block users
    return { allowed: true, currentUsage: 0, limit: null };
  }
}

// Increment message usage
export async function incrementMessageUsage(userId: string): Promise<void> {
  const supabase = await createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: existing } = await supabase
    .from('user_usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('usage_type', 'messages')
    .gte('reset_date', today.toISOString())
    .single();

  if (existing) {
    await supabase
      .from('user_usage_tracking')
      .update({ usage_count: existing.usage_count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('user_usage_tracking')
      .insert({
        user_id: userId,
        usage_type: 'messages',
        usage_count: 1,
        reset_date: tomorrow.toISOString()
      });
  }
}

// Check if user can generate an image
export async function checkImageGenerationLimit(userId: string): Promise<UsageCheck> {
  // ADMIN BYPASS: Admins have unlimited image generation
  const adminPrivileges = await getAdminPrivileges(userId);
  if (adminPrivileges.canBypassImageLimits) {
    console.log('🔓 Admin bypass: Unlimited image generation for admin user');
    return { allowed: true, currentUsage: 0, limit: null };
  }

  const supabase = await createAdminClient();

  const planInfo = await getUserPlanInfo(userId);

  // Premium users check tokens
  if (planInfo.planType === 'premium') {
    const { data: tokenBalance } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const balance = tokenBalance?.balance || 0;
    const tokensPerImage = parseInt(planInfo.restrictions.tokens_per_image || 5);

    return {
      allowed: balance >= tokensPerImage,
      currentUsage: balance,
      limit: null,
      message: balance >= tokensPerImage ? undefined : `Insufficient tokens. Need ${tokensPerImage} tokens, have ${balance}. Purchase more tokens to continue.`
    };
  }

  // Free users check weekly limit
  const weeklyLimit = parseInt(planInfo.restrictions.weekly_image_generation || 2);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count } = await supabase
    .from('user_usage_tracking')
    .select('usage_count', { count: 'exact' })
    .eq('user_id', userId)
    .eq('usage_type', 'images')
    .gte('created_at', weekAgo.toISOString());

  const currentUsage = count || 0;
  const allowed = currentUsage < weeklyLimit;

  return {
    allowed,
    currentUsage,
    limit: weeklyLimit,
    message: allowed ? undefined : `Weekly image limit reached (${weeklyLimit} images/week). Upgrade to Premium for token-based generation.`
  };
}

// Increment image usage (for free users)
export async function incrementImageUsage(userId: string): Promise<void> {
  const supabase = await createAdminClient();

  await supabase
    .from('user_usage_tracking')
    .insert({
      user_id: userId,
      usage_type: 'images',
      usage_count: 1,
      reset_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
}

// Deduct tokens (for all users)
export async function deductTokens(userId: string, amount: number, description?: string): Promise<boolean> {
  // ADMIN BYPASS: Admins don't have tokens deducted
  const adminPrivileges = await getAdminPrivileges(userId);
  if (adminPrivileges.canBypassTokenLimits) {
    console.log('🔓 Admin bypass: No token deduction for admin user');
    return true; // Pretend deduction succeeded without actually deducting
  }

  const supabase = await createAdminClient();

  const { data: balance } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (!balance || balance.balance < amount) {
    return false;
  }

  await supabase
    .from('user_tokens')
    .update({
      balance: balance.balance - amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Log the token usage to token_transactions
  try {
    await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'usage',
        description: description || 'Token deduction',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging token transaction:', error);
  }

  return true;
}

// Check active girlfriends limit
export async function checkActiveGirlfriendsLimit(userId: string): Promise<UsageCheck> {
  // ADMIN BYPASS: Admins have unlimited active companions
  const adminPrivileges = await getAdminPrivileges(userId);
  if (adminPrivileges.isAdmin) {
    console.log('🔓 Admin bypass: Unlimited active companions for admin user');
    return { allowed: true, currentUsage: 0, limit: null };
  }

  const supabase = await createAdminClient();

  const planInfo = await getUserPlanInfo(userId);
  const limit = parseInt(planInfo.restrictions.active_girlfriends_limit || planInfo.restrictions.active_girlfriends || '1');

  const { count } = await supabase
    .from('characters')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_archived', false);

  const currentUsage = count || 0;
  const allowed = currentUsage < limit;

  // Plan-aware error message
  const errorMessage = planInfo.planType === 'free'
    ? `Active AI companion limit reached (${limit}). Archive existing companions or upgrade to Premium for up to 3 active companions.`
    : `You've reached your active limit (${limit}). Deactivate one to add more.`;

  return {
    allowed,
    currentUsage,
    limit,
    message: allowed ? undefined : errorMessage
  };
}

// Check archived girlfriends limit (for premium users)
export async function checkArchivedGirlfriendsLimit(userId: string): Promise<UsageCheck> {
  const supabase = await createAdminClient();
  if (!supabase) throw new Error('Database connection failed');

  const planInfo = await getUserPlanInfo(userId);
  const limit = parseInt(planInfo.restrictions.inactive_girlfriends_limit || '999');

  // Only enforce for premium users
  if (planInfo.planType !== 'premium') {
    return { allowed: true, currentUsage: 0, limit: null };
  }

  const { count } = await supabase
    .from('characters')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_archived', true);

  const currentUsage = count || 0;
  const allowed = currentUsage < limit;

  return {
    allowed,
    currentUsage,
    limit,
    message: allowed ? undefined : `Archived companion limit reached (${limit}). Delete old companions to archive more.`
  };
}

// Get all plan features for display
export async function getPlanFeatures() {
  const supabase = await createAdminClient();

  const { data: features } = await supabase
    .from('plan_features')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return features || [];
}

// Get plan restrictions
export async function getPlanRestrictions(planType: 'free' | 'premium') {
  const supabase = await createAdminClient();

  const { data: restrictions } = await supabase
    .from('plan_restrictions')
    .select('*')
    .eq('plan_type', planType);

  const restrictionsMap: Record<string, any> = {};
  restrictions?.forEach(r => {
    restrictionsMap[r.restriction_key] = r.restriction_value;
  });

  return restrictionsMap;
}

// Create or update user subscription
export async function updateUserSubscription(
  userId: string,
  planType: 'free' | 'premium',
  stripeSubscriptionId?: string,
  stripeCustomerId?: string,
  periodEnd?: Date
) {
  const supabase = await createAdminClient();

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single();

  const subscriptionData = {
    user_id: userId,
    plan_type: planType,
    status: 'active',
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd?.toISOString(),
  };

  if (existing) {
    await supabase
      .from('user_subscriptions')
      .update(subscriptionData)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('user_subscriptions')
      .insert(subscriptionData);
  }

  // If upgrading to premium, add initial tokens
  if (planType === 'premium') {
    const restrictions = await getPlanRestrictions('premium');
    const monthlyTokens = parseInt(restrictions.monthly_tokens || 100);

    const { data: tokenBalance } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (tokenBalance) {
      await supabase
        .from('user_tokens')
        .update({
          balance: tokenBalance.balance + monthlyTokens,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_tokens')
        .insert({
          user_id: userId,
          balance: monthlyTokens,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // Log the token credit
    await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: monthlyTokens,
        type: 'bonus',
        description: 'Premium subscription activation bonus',
        created_at: new Date().toISOString()
      });
  }
}

// Credit monthly tokens for premium users (called by cron job or webhook)
export async function creditMonthlyTokens(userId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  if (!supabase) return false;

  try {
    const planInfo = await getUserPlanInfo(userId);

    // Only credit for premium users
    if (planInfo.planType !== 'premium') {
      return false;
    }

    const monthlyTokens = parseInt(planInfo.restrictions.monthly_tokens || '100');

    const { data: tokenBalance } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (tokenBalance) {
      await supabase
        .from('user_tokens')
        .update({
          balance: tokenBalance.balance + monthlyTokens,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_tokens')
        .insert({
          user_id: userId,
          balance: monthlyTokens,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // Log the monthly credit
    await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: monthlyTokens,
        type: 'bonus',
        description: 'Monthly premium token credit',
        created_at: new Date().toISOString()
      });

    console.log(`✅ Credited ${monthlyTokens} tokens to premium user ${userId.substring(0, 8)}`);
    return true;
  } catch (error) {
    console.error('Error crediting monthly tokens:', error);
    return false;
  }
}

