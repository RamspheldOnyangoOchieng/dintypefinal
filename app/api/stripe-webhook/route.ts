import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getStripeInstance } from "@/lib/stripe-utils"
import { createAdminClient } from "@/lib/supabase-admin"
import { getStripeWebhookSecret } from "@/lib/integration-config"
import { sendPaymentConfirmation, sendWelcomeEmail } from "@/lib/email/service"
import { fromStripeAmount, formatSEK } from "@/lib/currency"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const stripe = await getStripeInstance()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  // Get webhook secret from database (with env fallback)
  const webhookSecret = await getStripeWebhookSecret()

  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabaseAdmin = await createAdminClient()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabaseAdmin)
        break

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabaseAdmin)
        break

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabaseAdmin)
        break

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge, supabaseAdmin)
        break

      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute, supabaseAdmin)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  console.log("🎯 Processing checkout.session.completed:", session.id)

  const userId = session.metadata?.userId
  if (!userId) {
    console.error("No userId in session metadata")
    return
  }

  // Get user email for sending confirmation
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, username")
    .eq("id", userId)
    .single()

  // Update transaction record
  await supabase
    .from("payment_transactions")
    .update({
      status: "completed",
      stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      metadata: session.metadata,
    })
    .eq("stripe_session_id", session.id)

  // Handle token purchase
  const tokensToAdd = parseInt(session.metadata?.tokens || "0", 10)
  let purchaseType = "purchase"
  let itemName = "Unknown Item"
  let purchaseDetails = ""

  if (tokensToAdd > 0) {
    const { data: currentTokens } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    const newBalance = (currentTokens?.balance || 0) + tokensToAdd

    await supabase.from("user_tokens").upsert({ user_id: userId, balance: newBalance }, { onConflict: "user_id" })

    // Record transaction
    await supabase.from("token_transactions").insert({
      user_id: userId,
      amount: tokensToAdd,
      type: "purchase",
      description: `Purchased ${tokensToAdd} tokens`,
    })

    itemName = `${tokensToAdd} Tokens`
    purchaseDetails = `You now have ${newBalance} tokens in your account. Use them to create characters, send messages, and access premium features.`
    purchaseType = "tokens"

    console.log(`✅ Added ${tokensToAdd} tokens to user ${userId}`)
  }

  // Handle premium plan purchase
  if (session.metadata?.planId && session.metadata?.type !== "token_purchase") {
    const planDurationMonths = parseInt(session.metadata.planDuration, 10) || 1
    const now = new Date()
    const expiresAt = new Date(now.setMonth(now.getMonth() + planDurationMonths)).toISOString()

    await supabase
      .from("premium_profiles")
      .upsert(
        {
          user_id: userId,
          expires_at: expiresAt,
          plan_id: session.metadata.planId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    // Grant 100 free tokens for new premium subscribers
    const { data: currentTokens } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    const bonusTokens = 100
    const newTokenBalance = (currentTokens?.balance || 0) + bonusTokens

    await supabase.from("user_tokens").upsert({ user_id: userId, balance: newTokenBalance }, { onConflict: "user_id" })

    // Record token transaction
    await supabase.from("token_transactions").insert({
      user_id: userId,
      amount: bonusTokens,
      type: "bonus",
      description: `Premium subscription bonus: ${bonusTokens} tokens`,
    })

    console.log(`✅ Granted ${bonusTokens} bonus tokens to new premium user ${userId}. New balance: ${newTokenBalance}`)

    itemName = session.metadata.planName || "Premium Plan"
    purchaseDetails = `Your premium membership is now active until ${new Date(expiresAt).toLocaleDateString()}. You've received ${bonusTokens} bonus tokens! Enjoy unlimited character creation, advanced AI features, and priority support!`
    purchaseType = "premium"

    console.log(`✅ Created premium profile for user ${userId}, expires ${expiresAt}`)

    // Send welcome email for new premium users
    if (profile?.email && profile?.username) {
      try {
        await sendWelcomeEmail(profile.email, profile.username)
        console.log(`📧 Sent welcome email to ${profile.email}`)
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
      }
    }
  }

  // Record revenue
  const price = fromStripeAmount(session.amount_total || 0) // Convert öre to kr
  if (price > 0) {
    await supabase.from("revenue_transactions").insert({ amount: price })
  }

  // Send payment confirmation email
  if (profile?.email && profile?.username) {
    try {
      await sendPaymentConfirmation(profile.email, profile.username, {
        orderId: session.id,
        orderDate: new Date().toLocaleDateString(),
        itemName,
        amount: formatSEK(price), // Format as Swedish Krona
        purchaseDetails,
      })
      console.log(`📧 Sent payment confirmation email to ${profile.email}`)
    } catch (emailError) {
      console.error("Failed to send payment confirmation email:", emailError)
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log("💳 Payment succeeded:", paymentIntent.id)

  await supabase
    .from("payment_transactions")
    .update({
      status: "completed",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("stripe_payment_intent_id", paymentIntent.id)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log("❌ Payment failed:", paymentIntent.id)

  await supabase
    .from("payment_transactions")
    .update({
      status: "failed",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("stripe_payment_intent_id", paymentIntent.id)
}

async function handleChargeRefunded(charge: Stripe.Charge, supabase: any) {
  console.log("💸 Charge refunded:", charge.id)

  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id

  if (!paymentIntentId) return

  // Find the transaction
  const { data: transaction } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single()

  if (!transaction) return

  // Update transaction status
  await supabase
    .from("payment_transactions")
    .update({
      status: "refunded",
    })
    .eq("id", transaction.id)

  // If it was a token purchase, deduct the tokens
  const tokensToDeduct = parseInt(transaction.metadata?.tokens || "0", 10)
  if (tokensToDeduct > 0) {
    const { data: currentTokens } = await supabase
      .from("user_tokens")
      .select("balance")
      .eq("user_id", transaction.user_id)
      .maybeSingle()

    const newBalance = Math.max(0, (currentTokens?.balance || 0) - tokensToDeduct)

    await supabase
      .from("user_tokens")
      .upsert({ user_id: transaction.user_id, balance: newBalance }, { onConflict: "user_id" })

    // Record transaction
    await supabase.from("token_transactions").insert({
      user_id: transaction.user_id,
      amount: -tokensToDeduct,
      type: "refund",
      description: `Refund: ${tokensToDeduct} tokens deducted`,
    })

    console.log(`✅ Deducted ${tokensToDeduct} tokens from user ${transaction.user_id} due to refund`)
  }

  // If it was a premium plan, remove premium status
  if (transaction.metadata?.planId && transaction.metadata?.type !== "token_purchase") {
    await supabase.from("premium_profiles").delete().eq("user_id", transaction.user_id)

    console.log(`✅ Removed premium status for user ${transaction.user_id} due to refund`)
  }

  // Deduct from revenue
  const refundAmount = fromStripeAmount(charge.amount_refunded) // Convert öre to kr
  await supabase.from("revenue_transactions").insert({ amount: -refundAmount })
}

async function handleDisputeCreated(dispute: Stripe.Dispute, supabase: any) {
  console.log("⚠️ Dispute created:", dispute.id)

  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id

  // Log dispute for admin review
  await supabase.from("payment_disputes").insert({
    stripe_dispute_id: dispute.id,
    stripe_charge_id: chargeId,
    amount: fromStripeAmount(dispute.amount), // Convert öre to kr
    reason: dispute.reason,
    status: dispute.status,
    created_at: new Date(dispute.created * 1000).toISOString(),
  })
}
