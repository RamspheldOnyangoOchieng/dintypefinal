# Supabase Email Configuration Guide

## 🚨 Problem
Supabase is not sending password reset or confirmation emails.

## ✅ Solutions

### Option 1: Enable Supabase Built-in Email (Quick Setup)

**Step 1: Configure Email Settings in Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/templates
2. Navigate to: **Authentication** → **Email Templates**

**Step 2: Enable Confirmations**

1. Go to: **Authentication** → **Settings** 
2. Find **Email Confirmations** section
3. Set these values:
   - ✅ **Enable email confirmations**: ON
   - ✅ **Enable email change confirmations**: ON
   - **Site URL**: `https://dintypefinal-ten.vercel.app`
   - **Redirect URLs**: Add these:
     ```
     https://dintypefinal-ten.vercel.app/**
     http://localhost:3000/**
     ```

**Step 3: Configure Email Templates**

Go to **Authentication** → **Email Templates** and update:

#### A. Confirmation Email Template
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

**Confirmation URL**: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

#### B. Password Recovery Template
```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

**Reset Password URL**: `{{ .SiteURL }}/reset-password?update=true&token_hash={{ .TokenHash }}&type=recovery`

### Option 2: Custom SMTP (Production Recommended)

For production, use a custom SMTP provider (more reliable):

**Step 1: Choose an Email Provider**
- **Resend** (Recommended, 100 free emails/day): https://resend.com
- **SendGrid** (Free tier: 100 emails/day): https://sendgrid.com
- **Mailgun**: https://mailgun.com
- **AWS SES**: https://aws.amazon.com/ses

**Step 2: Get SMTP Credentials**

Example with **Resend**:
1. Sign up at https://resend.com
2. Go to **API Keys** → Create API Key
3. Get your SMTP credentials:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: `re_xxxxx` (your API key)

**Step 3: Configure in Supabase**

1. Go to: **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter:
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: YOUR_API_KEY
   Sender email: noreply@yourdomain.com
   Sender name: DinTyp
   ```

### Option 3: Using Your Own Domain Email

If you have email@dintypefinal.se:

**Gmail SMTP** (if using G Suite):
```
Host: smtp.gmail.com
Port: 587
Username: noreply@dintypefinal.se
Password: [App Password - not regular password]
```

**Office 365**:
```
Host: smtp.office365.com
Port: 587
Username: noreply@dintypefinal.se
Password: [account password]
```

---

## 🔧 Code Updates Required

### 1. Create Auth Callback Handler

**File**: `app/auth/confirm/route.ts`

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') || '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Redirect to app
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return error
  return NextResponse.redirect(new URL('/error', request.url))
}
```

### 2. Update Reset Password Page

Your current code looks good! Just ensure the redirect URL matches what's configured in Supabase.

**Current code (line 58-60)** is correct:
```typescript
const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password?update=true`,
})
```

### 3. Add Email Confirmation on Signup

Check your signup code and ensure it looks like this:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm?next=/profile`,
    data: {
      username: username,
    }
  }
})

if (!error) {
  toast.success('Check your email to confirm your account!')
}
```

---

## 🧪 Testing

### Test Password Reset:
1. Go to `/reset-password`
2. Enter your email
3. Check **spam folder** if email doesn't arrive
4. Click link in email
5. Should redirect to `/reset-password?update=true`
6. Enter new password

### Test Email Confirmation:
1. Sign up with new email
2. Check email (and spam)
3. Click confirmation link
4. Should redirect to app as logged in

### Debug Checklist:
- ✅ Check Supabase Dashboard → Logs → Auth logs
- ✅ Check spam/junk folder
- ✅ Verify Site URL matches your domain
- ✅ Verify Redirect URLs include your domain
- ✅ Test with different email provider (Gmail, Outlook)
- ✅ Wait 2-3 minutes (emails can be delayed)

---

## 🔍 Common Issues

### "Email not arriving"
**Solution**: 
1. Check Supabase Auth logs for errors
2. Verify email provider settings
3. Check spam folder
4. Try different email address

### "Invalid email confirmation link"
**Solution**:
1. Ensure callback route exists: `/app/auth/confirm/route.ts`
2. Check that token_hash format matches in template
3. Verify Site URL is correct

### "Rate limit exceeded"
**Solution**:
- Supabase free tier has rate limits
- Use custom SMTP for production
- Wait before retrying

---

## 📋 Quick Deployment Steps

1. **Create callback route**: `app/auth/confirm/route.ts` (see code above)
2. **Update Supabase Dashboard**:
   - Site URL: Your production URL
   - Redirect URLs: Add your domains
   - Email templates: Use templates above
3. **For Production**: Set up custom SMTP (Resend recommended)
4. **Test thoroughly** with real email addresses

---

## 🆘 Still Not Working?

If emails still don't work after following this guide:

1. **Check Supabase Logs**:
   - Go to Dashboard → Logs → Auth
   - Look for email send errors

2. **Verify Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

3. **Test with Supabase SQL**:
   ```sql
   -- Check auth settings
   SELECT * FROM auth.config;
   
   -- Check if emails are being sent
   SELECT * FROM auth.audit_log_entries 
   WHERE action = 'user_recovery_requested' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

4. **Contact Supabase Support**:
   - Check if your project has email restrictions
   - Verify your account is verified
