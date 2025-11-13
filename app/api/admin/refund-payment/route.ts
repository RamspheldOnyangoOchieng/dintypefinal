import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { getStripeInstance } from "@/lib/stripe-utils"

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, amount, reason } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ success: false, error: "Payment Intent ID is required" }, { status: 400 })
    }

    // Verify admin access
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get Stripe instance
    const stripe = await getStripeInstance()
    if (!stripe) {
      return NextResponse.json({ success: false, error: "Stripe not configured" }, { status: 500 })
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
      reason: reason || "requested_by_customer",
    })

    // Update transaction in database
    await supabaseAdmin
      .from("payment_transactions")
      .update({ status: "refunded" })
      .eq("stripe_payment_intent_id", paymentIntentId)

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    })
  } catch (error: any) {
    console.error("Error processing refund:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
