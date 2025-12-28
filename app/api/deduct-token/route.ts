import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const body = await req.json()
        const { userId, amount } = body

        if (!userId) {
            return new NextResponse(JSON.stringify({ error: 'User ID is required' }), { status: 400 })
        }

        // Default amount to 0 if not provided, basically a check
        const deductionAmount = typeof amount === 'number' ? amount : 0;

        if (deductionAmount < 0) {
            return new NextResponse(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
        }

        const { deductTokens } = await import("@/lib/token-utils")
        const success = await deductTokens(
            userId,
            deductionAmount,
            body.description || `Token usage (${deductionAmount} tokens)`,
            body.metadata || {}
        )

        if (!success) {
            // Check balance again to give specific error if it was insufficient
            const { getUserTokenBalance } = await import("@/lib/token-utils")
            const currentBalance = await getUserTokenBalance(userId)

            if (currentBalance < deductionAmount) {
                return new NextResponse(JSON.stringify({
                    error: 'Insufficient tokens',
                    insufficientTokens: true,
                    currentBalance,
                    requiredTokens: deductionAmount
                }), { status: 402 })
            }

            return new NextResponse(JSON.stringify({ error: 'Failed to deduct tokens' }), { status: 500 })
        }

        const { getUserTokenBalance } = await import("@/lib/token-utils")
        const newBalance = await getUserTokenBalance(userId)

        return new NextResponse(JSON.stringify({
            success: true,
            message: 'Token deducted successfully',
            newBalance: newBalance
        }), { status: 200 })

    } catch (error: any) {
        console.error('Server error in deduct-token:', error)
        return new NextResponse(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
    }
}