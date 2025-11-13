# 🚀 New Features Setup Guide

This guide will help you complete the setup for all newly implemented features.

## 📋 Table of Contents

1. [Database Migrations](#database-migrations)
2. [Stripe Webhook Configuration](#stripe-webhook-configuration)
3. [OAuth Providers Setup](#oauth-providers-setup)
4. [Email Service Integration](#email-service-integration)
5. [Tax Configuration](#tax-configuration)
6. [Testing the Features](#testing-the-features)

---

## 1. Database Migrations

### Required Tables

Run these SQL commands in your Supabase SQL Editor:

#### Cost Logs Table
```sql
CREATE TABLE IF NOT EXISTS cost_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  cost INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cost_logs_user_id ON cost_logs(user_id);
CREATE INDEX idx_cost_logs_created_at ON cost_logs(created_at);
CREATE INDEX idx_cost_logs_action_type ON cost_logs(action_type);
```

#### Banned Users Table
```sql
CREATE TABLE IF NOT EXISTS banned_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  banned_until TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_banned_users_is_active ON banned_users(is_active);
CREATE INDEX idx_banned_users_banned_until ON banned_users(banned_until);
```

#### Payment Disputes Table (for webhook)
```sql
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_dispute_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_payment_disputes_stripe_dispute_id ON payment_disputes(stripe_dispute_id);
```

---

## 2. Stripe Webhook Configuration

### Step 1: Get Webhook Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your endpoint URL:
   - **Production:** `https://yourdomain.com/api/stripe-webhook`
   - **Development:** Use [Stripe CLI](https://stripe.com/docs/stripe-cli) for local testing
5. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `charge.dispute.created`
6. Copy the **Signing secret** (starts with `whsec_...`)

### Step 2: Add to Environment Variables

Add to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 3: Test with Stripe CLI (Development)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded
```

---

## 3. OAuth Providers Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `https://yourdomain.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)
6. Copy **Client ID** and **Client Secret**

7. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Enable **Google**
   - Paste Client ID and Client Secret
   - Save

### Discord OAuth (Optional)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Go to **OAuth2** tab
4. Add redirect:
   - `https://yourdomain.com/auth/callback`
5. Copy **Client ID** and **Client Secret**

6. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Enable **Discord**
   - Paste credentials
   - Save

### Twitter/X OAuth (Optional)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create an app
3. Enable OAuth 2.0
4. Add callback URL: `https://yourdomain.com/auth/callback`
5. Get API Key and Secret

6. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Enable **Twitter**
   - Paste credentials
   - Save

---

## 4. Email Service Integration

### Option A: Resend (Recommended)

1. Sign up at [Resend](https://resend.com/)
2. Get API key
3. Verify your domain
4. Add to `.env.local`:

```bash
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

5. Update `/lib/email/service.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: process.env.FROM_EMAIL!,
  to,
  subject,
  html,
})
```

### Option B: SendGrid

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create API key
3. Add to `.env.local`:

```bash
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

4. Update `/lib/email/service.ts`:

```typescript
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

await sgMail.send({
  to,
  from: process.env.FROM_EMAIL,
  subject,
  text,
  html,
})
```

---

## 5. Tax Configuration

### Enable Stripe Tax

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings** → **Tax**
3. Click **Enable Stripe Tax**
4. Configure:
   - Add business location
   - Set up tax registrations
   - Configure product tax codes (if needed)

### Test Tax Calculation

```bash
# Test checkout with tax
curl -X POST http://localhost:3000/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "token_100",
    "metadata": {
      "type": "token_purchase",
      "tokens": 100,
      "price": 9.99
    }
  }'
```

---

## 6. Testing the Features

### Test Checklist

#### ✅ Webhooks
- [ ] Make a test payment in Stripe test mode
- [ ] Verify webhook received in logs
- [ ] Check tokens were added to user
- [ ] Test refund webhook
- [ ] Verify tokens deducted on refund

#### ✅ OAuth Login
- [ ] Click Google login button
- [ ] Complete OAuth flow
- [ ] Verify user created in database
- [ ] Test Discord login (if configured)
- [ ] Test Twitter login (if configured)

#### ✅ Automatic Tax
- [ ] Create checkout session
- [ ] Verify tax line appears in Stripe
- [ ] Complete payment
- [ ] Check tax amount in transaction

#### ✅ Admin Refund Interface
- [ ] Navigate to `/admin/dashboard/payments`
- [ ] Select a completed payment
- [ ] Click refund button
- [ ] Enter refund amount and reason
- [ ] Submit refund
- [ ] Verify in Stripe Dashboard

#### ✅ Grace Period
- [ ] Create a user with expired premium
- [ ] Check premium status
- [ ] Verify grace period applies (3 days)
- [ ] Test after grace period expires

#### ✅ Email Templates
- [ ] Send test welcome email: `POST /api/send-email`
- [ ] Send payment confirmation
- [ ] Send password reset
- [ ] Check email formatting

#### ✅ Invoices
- [ ] Navigate to `/invoices`
- [ ] View payment history
- [ ] Download an invoice
- [ ] Verify invoice contains correct data

#### ✅ Cost Tracking
- [ ] Navigate to `/admin/dashboard/costs`
- [ ] Trigger some actions (chat, character creation)
- [ ] Verify costs are logged
- [ ] Check cost breakdown
- [ ] View top users

#### ✅ User Ban/Unban
- [ ] Navigate to `/admin/dashboard/users`
- [ ] Select a user (not admin)
- [ ] Ban for 7 days
- [ ] Verify ban status
- [ ] Unban user
- [ ] Test permanent ban

---

## 🔧 Environment Variables Summary

Add these to your `.env.local`:

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...

# New - Required
STRIPE_WEBHOOK_SECRET=whsec_...
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Dintyp

# New - Email Service (choose one)
RESEND_API_KEY=re_...
# OR
SENDGRID_API_KEY=SG...
```

---

## 🚨 Important Notes

1. **Webhook Security:** Never expose your webhook secret publicly
2. **OAuth Callbacks:** Ensure callback URLs match exactly
3. **Email Service:** Test emails in development before production
4. **Database Backups:** Always backup before running migrations
5. **Stripe Test Mode:** Use test mode for all development
6. **Cost Tracking:** Monitor actual costs vs. configured costs

---

## 📞 Need Help?

If you encounter issues:

1. Check server logs for errors
2. Verify all environment variables are set
3. Ensure database migrations ran successfully
4. Test webhooks with Stripe CLI
5. Check Supabase logs for auth issues

---

## 🎉 You're All Set!

Once you've completed this setup, all new features will be fully functional:

- ✅ Stripe webhooks handling payments automatically
- ✅ OAuth login with Google, Discord, Twitter
- ✅ Automatic tax calculation
- ✅ Admin refund interface
- ✅ Premium grace period
- ✅ Custom email templates
- ✅ Invoice management
- ✅ Cost tracking dashboard
- ✅ User ban/unban functionality

Happy coding! 🚀
