"use server";


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
  if (!supabase) throw new Error("Could not initialize admin client");

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  // Determine plan type from subscription
  let planType = 'free';
  if (subscription) {
    if (subscription.plan_type) {
      planType = subscription.plan_type;
    } else if (subscription.product_name) {
      // If there is an active recurring subscription, it's premium
      planType = 'premium';
    } else {
      // Fallback if we have an active row but no explicit name
      planType = 'premium';
    }
  }

  // SECONDARY CHECK: Check public.premium_profiles which seems to be used for pro users
  if (planType === 'free') {
    const { data: premiumProfile } = await supabase
      .from('premium_profiles')
      .select('*')
      .eq('user_id', userId)
      .filter('expires_at', 'gt', 'now()')
      .maybeSingle();

    if (premiumProfile) {
      planType = 'premium';
    }
  }

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
    planType: planType as 'free' | 'premium',
    status: subscription?.status || 'active',
    currentPeriodEnd: subscription?.current_period_end,
    restrictions: restrictionsMap
  };
}

// Check if user can send a message
export async function checkMessageLimit(userId: string): Promise<UsageCheck> {
  console.log('🔍 Checking message limit for user:', userId);

  try {
    // 1. ADMIN BYPASS
    const adminPrivileges = await getAdminPrivileges(userId);
    if (adminPrivileges.isAdmin || adminPrivileges.canBypassMessageLimits) {
      return { allowed: true, currentUsage: 0, limit: null };
    }

    const supabase = await createAdminClient();
    if (!supabase) return { allowed: true, currentUsage: 0, limit: null };

    // 2. PREMIUM CHECK: Premium users have NO daily message limits (they pay per token or have a large quota)
    const planInfo = await getUserPlanInfo(userId);
    if (planInfo.planType === 'premium') {
      return { allowed: true, currentUsage: 0, limit: null };
    }

    let limit = planInfo?.restrictions?.daily_free_messages || planInfo?.restrictions?.daily_message_limit;

    // Default to 3 messages for free plan if not set
    if ((!limit || limit === 'null' || limit === undefined) && planInfo.planType === 'free') {
      limit = 3;
    }

    // Parse limit to number
    let limitNum = parseInt(String(limit), 10);

    // If invalid limit but free user, force 3
    if ((isNaN(limitNum) || limitNum <= 0) && planInfo.planType === 'free') {
      limitNum = 3;
    } else if (!limit || limit === null || limit === 'null' || limit === undefined || (limitNum <= 0 && planInfo.planType !== 'free')) {
      return { allowed: true, currentUsage: 0, limit: null };
    }

    // Get today's usage (using simple date string for message_usage_tracking)
    const today = new Date().toISOString().split('T')[0];

    const { data: usage, error: usageError } = await supabase
      .from('message_usage_tracking')
      .select('message_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const currentUsage = usage?.message_count || 0;
    const allowed = currentUsage < limitNum;

    return {
      allowed,
      currentUsage,
      limit: limitNum,
      message: allowed ? undefined : "Daily message limit reached. Upgrade to continue."
    };
  } catch (error) {
    console.error('❌ Error in checkMessageLimit:', error);
    return { allowed: true, currentUsage: 0, limit: null };
  }
}

export async function incrementMessageUsage(userId: string): Promise<void> {
  const supabase = await createAdminClient();
  if (!supabase) return;

  const today = new Date().toISOString().split('T')[0];

  // Use RPC or a simple upsert logic for message_usage_tracking
  const { error } = await supabase.rpc('increment_message_usage_simple', { p_user_id: userId });

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: existing } = await supabase
      .from('message_usage_tracking')
      .select('message_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('message_usage_tracking')
        .update({
          message_count: (existing.message_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabase
        .from('message_usage_tracking')
        .insert({
          user_id: userId,
          date: today,
          message_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
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
  if (!supabase) return { allowed: true, currentUsage: 0, limit: null };

  const planInfo = await getUserPlanInfo(userId);

  // Premium users check tokens
  if (planInfo.planType === 'premium') {
    const { data: tokenBalance } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

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

export async function incrementImageUsage(userId: string): Promise<void> {
  const supabase = await createAdminClient();
  if (!supabase) return;

  // Find current record regardless of date to handle the UNIQUE constraint
  const { data: existing } = await supabase
    .from('user_usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('usage_type', 'images')
    .maybeSingle();

  if (existing) {
    const isOldRecord = new Date(existing.reset_date) <= new Date();

    if (isOldRecord) {
      // Reset for new week
      await supabase
        .from('user_usage_tracking')
        .update({
          usage_count: 1,
          reset_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Increment for current week
      await supabase
        .from('user_usage_tracking')
        .update({
          usage_count: (existing.usage_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    }
  } else {
    // Brand new record
    await supabase
      .from('user_usage_tracking')
      .insert({
        user_id: userId,
        usage_type: 'images',
        usage_count: 1,
        reset_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }
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
  if (!supabase) return false;

  const { data: balance } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

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
  if (!supabase) return { allowed: true, currentUsage: 0, limit: null };

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

export async function getPlanFeatures() {
  const supabase = await createAdminClient();
  if (!supabase) return [];

  const { data: features } = await supabase
    .from('plan_features')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return features || [];
}

export async function getPlanRestrictions(planType: 'free' | 'premium') {
  const supabase = await createAdminClient();
  if (!supabase) return {};

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
  if (!supabase) return;

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

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
      .maybeSingle();

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
      .maybeSingle();

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

