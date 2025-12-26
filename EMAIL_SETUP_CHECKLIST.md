# ✅ Supabase Email Setup - Quick Checklist

## Immediate Actions Required in Supabase Dashboard

### 1️⃣ Enable Email Confirmations (5 minutes)

**Go to**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration

✅ **Site URL**: 
```
https://dintypefinal-ten.vercel.app
```

✅ **Redirect URLs** (Add both):
```
https://dintypefinal-ten.vercel.app/**
http://localhost:3000/**
```

### 2️⃣ Configure Email Auth Settings

**Go to**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers

Under **Email** provider:
- ✅ Enable email provider: **ON**
- ✅ Confirm email: **ON** 
- ✅ Secure email change: **ON**

### 3️⃣ Update Email Templates

**Go to**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/templates

#### Template 1: Confirm Signup
**Subject**: `Confirm your email`

**Body**:
```html
<h2>Welcome to DinTyp!</h2>
<p>Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

**Confirmation URL**:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

#### Template 2: Reset Password  
**Subject**: `Reset your password`

**Body**:
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, please ignore.</p>
```

**Confirmation URL**:
```
{{ .SiteURL }}/reset-password?update=true&token_hash={{ .TokenHash }}&type=recovery
```

---

## 🧪 Test It Now

### Test 1: Password Reset
1. Go to: https://dintypefinal-ten.vercel.app/reset-password
2. Enter your email
3. Submit
4. **Check email** (also spam folder!)
5. Click link → Should redirect to password update page

### Test 2: Email Confirmation (on new signup)
1. Sign up with new email
2. **Check email** (also spam folder!)
3. Click confirmation link
4. Should redirect to app logged in

---

## ⚠️ Common Issues & Solutions

### Issue: "Email not received"

**Cause**: Supabase free tier uses their SMTP, which can be slow

**Solutions**:
1. ✅ Check **spam/junk** folder
2. ✅ Wait 2-3 minutes (can be delayed)
3. ✅ Try different email (Gmail vs Outlook)
4. ✅ Check Supabase logs: Dashboard → Logs → Auth

### Issue: "Invalid confirmation link"

**Cause**: URL mismatch between template and code

**Solution**:
1. ✅ Verify template URLs match exactly
2. ✅ Ensure `/app/auth/confirm/route.ts` exists (I created this)
3. ✅ Check Site URL is production URL

### Issue: "Rate limit exceeded"

**Cause**: Too many requests in short time

**Solution**:
- Wait 5 minutes before retrying
- Contact Supabase support to increase limits

---

## 🚀 For Production (Recommended)

After testing with Supabase's built-in email, upgrade to **custom SMTP** for reliability:

### Option 1: Resend (Easiest, FREE 100/day)

1. Sign up: https://resend.com/signup
2. Get API Key
3. In Supabase: **Settings** → **Auth** → **SMTP**
4. Configure:
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: [YOUR_RESEND_API_KEY]
   Sender: noreply@dintypefinal.se
   ```

### Option 2: SendGrid (FREE 100/day)

1. Sign up: https://sendgrid.com
2. Create API Key
3. In Supabase SMTP settings:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [YOUR_SENDGRID_API_KEY]
   Sender: noreply@dintypefinal.se
   ```

---

## 📝 What I've Already Done

✅ Created `/app/auth/confirm/route.ts` - Handles email confirmations
✅ Created `/app/auth/error/page.tsx` - Shows errors nicely
✅ Your reset password page already correct
✅ Created complete setup guide: `SUPABASE_EMAIL_SETUP.md`

---

## 🎯 Next Steps (Do This Now!)

1. **Open Supabase Dashboard**
2. **Follow Section 1️⃣ above** (Set Site URL & Redirect URLs)
3. **Follow Section 2️⃣ above** (Enable email confirmations)
4. **Follow Section 3️⃣ above** (Update email templates)
5. **Test password reset** immediately
6. **Check spam folder** if email doesn't arrive

**Time needed**: ⏱️ 10 minutes

If emails still don't arrive after 5 minutes, check Dashboard → Logs for error messages.
