import { createAdminClient } from "./supabase-admin"

export type ActivityType =
    | 'token_purchase'
    | 'token_usage'
    | 'credit_grant'
    | 'credit_usage'
    | 'admin_adjustment'
    | 'subscription_upgrade'
    | 'image_generation'
    | 'video_generation'
    | 'chat_message'

export interface LogActivityParams {
    userId: string
    type: ActivityType
    tokens?: number
    credits?: number
    description: string
    metadata?: any
}

/**
 * Unified Activity Logger
 * Logs to token_transactions, credit_transactions, and cost_logs as appropriate
 */
export async function logActivity({
    userId,
    type,
    tokens,
    credits,
    description,
    metadata = {}
}: LogActivityParams) {
    try {
        const supabaseAdmin = await createAdminClient()
        if (!supabaseAdmin) throw new Error("Failed to initialize admin client")

        const promises = []

        // 1. Log Token Transaction if tokens were moved
        if (tokens !== undefined && tokens !== 0) {
            promises.push(
                supabaseAdmin.from("token_transactions").insert({
                    user_id: userId,
                    amount: tokens,
                    type: tokens > 0 ? (type === 'token_purchase' ? 'purchase' : 'bonus') : 'usage',
                    description,
                    metadata: { ...metadata, activity_type: type }
                })
            )

            // Also log to cost_logs for analytics if it's usage
            if (tokens < 0) {
                promises.push(
                    supabaseAdmin.from("cost_logs").insert({
                        user_id: userId,
                        action_type: type,
                        cost: Math.abs(tokens),
                        metadata: { ...metadata, description }
                    })
                )
            }
        }

        // 2. Log Credit Transaction if credits were moved
        if (credits !== undefined && credits !== 0) {
            // Map activity tips to credit_transaction types
            let creditTransType: 'subscription_grant' | 'token_purchase' | 'admin_adjustment' | 'refund' = 'admin_adjustment'

            if (type === 'credit_grant') creditTransType = 'subscription_grant'
            if (type === 'token_purchase') creditTransType = 'token_purchase'

            promises.push(
                supabaseAdmin.from("credit_transactions").insert({
                    user_id: userId,
                    amount: credits,
                    type: creditTransType,
                    description,
                    created_at: new Date().toISOString()
                })
            )
        }

        // 3. Log to a general recent_activity table if it exists (optional)
        // For now we'll stick to the specific transaction tables as they are the source of truth

        const results = await Promise.all(promises)
        const errors = results.filter(r => r.error).map(r => r.error)

        if (errors.length > 0) {
            console.error("Errors logging activity:", errors)
            return { success: false, errors }
        }

        return { success: true }
    } catch (error) {
        console.error("Critical error in logActivity:", error)
        return { success: false, error }
    }
}
