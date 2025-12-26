import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { getStripeInstance } from "@/lib/stripe-utils"
import { toStripeAmount } from "@/lib/currency"

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, email, successUrl, cancelUrl, metadata } = await request.json()

    if (!planId) {
      return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 })
    }

    // Get authenticated user if userId not provided
    let authenticatedUserId = userId
    let userEmail = email


    if (!authenticatedUserId) {
      const cookieStore = await cookies();
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return NextResponse.json({ success: false, error: "not_authenticated" }, { status: 401 });
      }

      authenticatedUserId = session.user.id;
      userEmail = session.user.email;
    }

    const supabase = await createClient()

    // Check if this is a token purchase
    const isTokenPurchase = planId.startsWith("token_") || (metadata && metadata.type === "token_purchase") || planId.startsWith("pack_")

    let productName, productDescription, priceAmount, productMetadata

    if (isTokenPurchase) {
      // Handle token purchase
      // Support both planId formats (token_X or pack_X) or metadata
      let tokenAmount = metadata?.tokens
      if (!tokenAmount) {
        if (planId.startsWith("token_")) tokenAmount = Number.parseInt(planId.split("_")[1])
        else if (planId.startsWith("pack_")) {
          // We need to look up the pack details if we only have ID, or rely on metadata passed from client
          // For resilience, let's trust metadata if present, or defaults.
          // The client sends the correct tokens in metadata now.
        }
      }
      tokenAmount = tokenAmount || 0

      const price = metadata?.price || 0

      if (tokenAmount <= 0 || price <= 0) {
        return NextResponse.json({ success: false, error: "Invalid token package" }, { status: 400 })
      }

      productName = `${tokenAmount} Tokens`
      productDescription = `Purchase of ${tokenAmount} tokens`
      priceAmount = price
      productMetadata = {
        type: "token_purchase",
        tokens: tokenAmount.toString(),
        userId: authenticatedUserId,
        price: price.toString(),
      }
    } else {
      // Handle subscription plan
      // We first try to fetch from DB. If not found, we might fallback if it's the known premium plan.
      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single()

      if (planError || !plan) {
        // Fallback for 'premium_monthly' if DB fetch fails but ID matches (Fail-safe)
        if (planId === 'premium_monthly') {
          priceAmount = 110
          productName = 'Premium Membership'
          productDescription = 'Unlimited access for 1 month'
          productMetadata = {
            type: "premium_purchase",
            userId: authenticatedUserId,
            planId: planId,
            planName: productName,
            planDuration: "1",
            price: priceAmount.toString(),
          }
        } else {
          return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 })
        }
      } else {
        // Calculate the price to use (discounted_price if available, otherwise original_price)
        priceAmount = (plan as any).discounted_price !== null ? (plan as any).discounted_price : (plan as any).original_price
        productName = (plan as any).name
        productDescription = (plan as any).description || `${(plan as any).duration} month subscription`
        productMetadata = {
          type: "premium_purchase",
          userId: authenticatedUserId,
          planId: planId,
          planName: (plan as any).name,
          planDuration: (plan as any).duration ? (plan as any).duration.toString() : "1",
          price: priceAmount.toString(),
        }
      }
    }

    // Validate that we have a valid price
    if (typeof priceAmount !== "number" || isNaN(priceAmount)) {
      console.error("Invalid price value:", priceAmount)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid price configuration",
        },
        { status: 400 },
      )
    }

    const stripe = await getStripeInstance()
    if (!stripe) {
      return NextResponse.json({ success: false, error: "Stripe is not configured" }, { status: 500 })
    }

    // Create checkout session with validated price
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sek", // Swedish Krona
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: toStripeAmount(priceAmount), // Convert SEK to öre (1 kr = 100 öre)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${request.nextUrl.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}&user_id=${authenticatedUserId}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/premium?canceled=true`,
      customer_email: userEmail,
      automatic_tax: {
        enabled: false, // Disabled to prevent address requirements in test mode
      },
      metadata: {
        ...productMetadata,
        ...(metadata || {}),
      },
    })

    return NextResponse.json({ success: true, sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
