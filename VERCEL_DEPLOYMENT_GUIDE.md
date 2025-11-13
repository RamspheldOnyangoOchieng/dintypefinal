# Vercel Deployment Guide for DINTYP

## Prerequisites

1. GitHub repository: https://github.com/RamspheldOnyangoOchieng/dintypefinal
2. Vercel account (sign up at https://vercel.com)
3. All environment variables ready

## Deployment Steps

### 1. Connect GitHub Repository to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `RamspheldOnyangoOchieng/dintypefinal`
4. Click "Import"

### 2. Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Build & Output Settings:**
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`
- Development Command: `npm run dev`

**Root Directory:** Leave as `.` (root)

### 3. Add Environment Variables

Go to **Project Settings → Environment Variables** and add the following:

#### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://yrhexcjqwycfkjrmgplp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_DB_URL=postgresql://postgres.yrhexcjqwycfkjrmgplp:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

**Get these from:** https://supabase.com/dashboard/project/yrhexcjqwycfkjrmgplp/settings/api

#### Stripe Variables
```
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

**Get these from:** https://dashboard.stripe.com/apikeys

#### Groq AI
```
GROQ_API_KEY=<your-groq-api-key>
```

**Get this from:** https://console.groq.com/keys

#### Cloudinary
```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
```

**Get these from:** https://console.cloudinary.com/console

#### Email Services
```
SENDGRID_API_KEY=<your-sendgrid-key>
RESEND_API_KEY=<your-resend-key>
```

**Get these from:**
- SendGrid: https://app.sendgrid.com/settings/api_keys
- Resend: https://resend.com/api-keys

#### Application URL
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Note:** Update `NEXT_PUBLIC_APP_URL` with your actual Vercel deployment URL after first deployment.

### 4. Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Copy your deployment URL (e.g., `https://dintypefinal.vercel.app`)
4. Update `NEXT_PUBLIC_APP_URL` environment variable with this URL
5. Redeploy to apply the updated URL

### 5. Post-Deployment Configuration

#### Update Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
7. Redeploy

#### Update Supabase Auth URLs

1. Go to https://supabase.com/dashboard/project/yrhexcjqwycfkjrmgplp/auth/url-configuration
2. Add your Vercel URL to:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** 
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/admin/login`
     - `https://your-app.vercel.app/login`

#### Configure CORS for Cloudinary (if needed)

1. Go to Cloudinary Console → Settings → Security
2. Add allowed domains: `your-app.vercel.app`

### 6. Verify Deployment

Test these features:

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works (info@dintyp.se)
- [ ] Character creation works
- [ ] Image generation works
- [ ] Stripe payment flow works
- [ ] Chat system works
- [ ] Token system works

### 7. Domain Configuration (Optional)

To use a custom domain:

1. Go to **Project Settings → Domains**
2. Click "Add Domain"
3. Enter your domain (e.g., `dintyp.se`)
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` to your custom domain
6. Update Supabase and Stripe webhook URLs

## Troubleshooting

### Build Failures

**Error: Missing environment variables**
- Solution: Add all required environment variables in Vercel dashboard

**Error: Database connection failed**
- Solution: Verify `SUPABASE_DB_URL` is correct and includes password

**Error: Module not found**
- Solution: Ensure `package.json` includes all dependencies
- Run `npm install` locally to verify

### Runtime Errors

**Error: Invalid API key (Supabase)**
- Solution: Verify anon key and service role key are correct
- Get fresh keys from Supabase dashboard

**Error: Stripe webhook signature verification failed**
- Solution: Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
- Ensure webhook endpoint URL matches deployment URL

**Error: CORS errors**
- Solution: Check `vercel.json` headers configuration
- Verify Supabase CORS settings allow your domain

### Performance Issues

**Slow API responses**
- Check Supabase connection pooling settings
- Verify database indexes are created (run migrations)
- Monitor Vercel function execution times

**Image loading slow**
- Ensure Cloudinary URLs are optimized
- Check Next.js Image component is used
- Verify CDN caching is working

## Monitoring & Maintenance

### Enable Vercel Analytics

1. Go to **Project Settings → Analytics**
2. Enable "Web Analytics"
3. Enable "Speed Insights"

### Set Up Error Tracking

Consider adding:
- Sentry: https://sentry.io
- LogRocket: https://logrocket.com

### Database Backups

Supabase automatically backs up your database daily. To create manual backups:

1. Go to https://supabase.com/dashboard/project/yrhexcjqwycfkjrmgplp/database/backups
2. Click "Create backup"

### Monitor Costs

- **Vercel:** https://vercel.com/dashboard/usage
- **Supabase:** https://supabase.com/dashboard/project/yrhexcjqwycfkjrmgplp/settings/billing
- **Stripe:** https://dashboard.stripe.com/balance
- **Groq:** https://console.groq.com/usage
- **Cloudinary:** https://console.cloudinary.com/console/usage

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Production:** Push to `main` branch
- **Preview:** Push to any other branch or create PR

To disable auto-deployment:
1. Go to **Project Settings → Git**
2. Configure deployment branches

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs

## Admin Credentials

**Email:** info@dintyp.se  
**Password:** jdAlx!02!A  
**User ID:** e3885385-f2ee-45c3-b92f-32bc4e3a9958  
**Token Balance:** 10,000  

**Important:** Change this password after first login in production!
