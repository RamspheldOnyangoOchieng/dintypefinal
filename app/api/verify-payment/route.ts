import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { getStripeInstance } from "@/lib/stripe-utils"

async function fulfillOrder(session: any) {
  try {
    // Use admin client to avoid cookie issues
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      throw new Error("Failed to initialize Supabase admin client")
    }

    const userId = session.metadata.userId

    console.log(`🎯 Fulfilling order for user: ${userId}, session: ${session.id}`);
    console.log(`📦 Session metadata:`, session.metadata);

    // 1. Update/Record transaction record
    // This is now safe as an upsert because we added a UNIQUE constraint on stripe_session_id
    const { error: txError } = await supabaseAdmin
      .from("payment_transactions")
      .upsert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        amount: session.amount_total / 100,
        currency: (session.currency || 'sek').toUpperCase(),
        status: "completed",
        plan_id: session.metadata.planId,
        plan_name: session.metadata.planName,
        plan_duration: parseInt(session.metadata.planDuration || "1", 10),
        metadata: session.metadata,
        updated_at: new Date().toISOString()
      }, { onConflict: "stripe_session_id" })

    if (txError) {
      console.error("❌ Error recording payment transaction:", txError)
    }

    // 2. Add tokens if it was a token purchase
    const tokensToAdd = parseInt(session.metadata.tokens || "0", 10)
    if (tokensToAdd > 0) {
      const { data: currentTokens } = await supabaseAdmin
        .from("user_tokens")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle()

      const newBalance = (currentTokens?.balance || 0) + tokensToAdd

      await supabaseAdmin
        .from("user_tokens")
        .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() }, { onConflict: "user_id" })

      // Record token transaction
      await supabaseAdmin.from("token_transactions").insert({
        user_id: userId,
        amount: tokensToAdd,
        type: "purchase",
        description: `Purchased ${tokensToAdd} tokens (Stripe: ${session.id})`
      })
      
      const price = session.amount_total / 100
      if (price > 0) {
        await supabaseAdmin.from("revenue_transactions").insert({
          user_id: userId,
          transaction_type: "stripe_payment",
          amount: price,
          currency: (session.currency || 'sek').toUpperCase(),
          description: session.metadata?.planName || (tokensToAdd > 0 ? `${tokensToAdd} Tokens` : "Purchase"),
          metadata: {
            stripe_session_id: session.id,
            plan_id: session.metadata?.planId,
            type: session.metadata?.type
          }
        })
      }
    }

    // 3. Handle premium plan fulfillment
    if (session.metadata.planId && session.metadata.type !== "token_purchase") {
      const planDurationMonths = parseInt(session.metadata.planDuration, 10) || 1
      const now = new Date()
      const expiresAt = new Date(now.setMonth(now.getMonth() + planDurationMonths)).toISOString()

      console.log(`💎 Granting premium: userId=${userId}, expires=${expiresAt}`);

      // Update premium_profiles - This triggers the DB trigger to sync profiles.is_premium
      const { error: premiumError } = await supabaseAdmin
        .from("premium_profiles")
        .upsert({
          user_id: userId,
          expires_at: expiresAt,
          plan_id: session.metadata.planId,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (premiumError) {
        console.error("❌ Error updating premium_profiles:", premiumError);
      }

      // 4. Grant credits for premium (additive check)
      const creditAmount = 110
      try {
        const { data: currentCredits } = await supabaseAdmin
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle()
        
        const newCreditBalance = (currentCredits?.balance || 0) + creditAmount

        await supabaseAdmin.from("user_credits").upsert({ 
          user_id: userId, 
          balance: newCreditBalance,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" })

        await supabaseAdmin.from("credit_transactions").insert({
          user_id: userId,
          amount: creditAmount,
          type: "subscription_grant",
          description: `Premium subscription grant: ${creditAmount} credits`,
        })
        console.log(`✅ Granted ${creditAmount} credits to ${userId}`);
      } catch (creditError) {
        console.error("❌ Error granting credits:", creditError);
      }

      // Record revenue if not already recorded (avoid doubling if it was also tokens, but premium is separate)
      if (tokensToAdd <= 0) {
        const price = session.amount_total / 100
        if (price > 0) {
          await supabaseAdmin.from("revenue_transactions").insert({
            user_id: userId,
            transaction_type: "stripe_payment",
            amount: price,
            currency: (session.currency || 'sek').toUpperCase(),
            description: session.metadata?.planName || (tokensToAdd > 0 ? `${tokensToAdd} Tokens` : "Purchase"),
            metadata: {
              stripe_session_id: session.id,
              plan_id: session.metadata?.planId,
              type: session.metadata?.type
            }
          })
        }
      }
    }
  } catch (error) {
    console.error("Error fulfilling order:", error)
    // Handle error appropriately
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id")
    if (!sessionId) {
      return NextResponse.json({ error: "No session ID provided" }, { status: 400 })
    }

    const stripe = await getStripeInstance()
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      await fulfillOrder(session)
    }

    return NextResponse.json({ isPaid: session.payment_status === "paid" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: "No session ID provided" }, { status: 400 })
    }

    const stripe = await getStripeInstance()
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      await fulfillOrder(session)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Payment not successful" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}