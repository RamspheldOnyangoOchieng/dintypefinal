import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { userId, amount } = await req.json()

        if (!userId) {
            return new NextResponse(JSON.stringify({ error: 'User ID is required' }), { status: 400 })
        }

        // Default amount to 0 if not provided, basically a check
        const deductionAmount = typeof amount === 'number' ? amount : 0;

        if (deductionAmount < 0) {
            return new NextResponse(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
        }

        // Get user's current token balance
        const { data: userTokens, error: selectError } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', userId)
            .single()

        if (selectError) {
            // If row doesn't exist, create it with 0 start (or default)
            if (selectError.code === 'PGRST116') {
                // Warning: This implies user has 0 tokens if not found.
                // You might want to initialize them here if that logic exists elsewhere.
                return new NextResponse(JSON.stringify({
                    error: 'Insufficient tokens',
                    insufficientTokens: true,
                    currentBalance: 0,
                    requiredTokens: deductionAmount
                }), { status: 400 })
            }
            console.error('Error fetching user tokens:', selectError)
            return new NextResponse(JSON.stringify({ error: selectError.message }), { status: 500 })
        }

        const currentBalance = (userTokens as any)?.balance || 0;

        // Check if user has enough tokens
        if (currentBalance < deductionAmount) {
            return new NextResponse(JSON.stringify({
                error: 'Insufficient tokens',
                insufficientTokens: true, // Flag for frontend to show upgrade modal
                currentBalance: currentBalance,
                requiredTokens: deductionAmount
            }), { status: 400 }) // Using 400 as per frontend expectation in some checks, or 402 Payment Required
        }

        // Deduct tokens
        const newBalance = currentBalance - deductionAmount

        const { error: updateError } = await supabase
            .from('user_tokens')
            // @ts-ignore
            .update({ balance: newBalance })
            .eq('user_id', userId)

        if (updateError) {
            console.error('Error deducting token:', updateError)
            return new NextResponse(JSON.stringify({ error: updateError.message }), { status: 500 })
        }

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