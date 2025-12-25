# Admin Login Issue - Debugging Guide

## Problem
You're logged in as admin but being redirected to login when accessing `/admin` routes.

## Root Cause
The middleware (`middleware.ts`) runs on **every** request to admin routes and checks your admin status by querying the database. If this check fails, you get redirected even though you're logged in.

## How to Debug

### Step 1: Enable Debug Mode
Add this to your URL when accessing admin: `?__mwdebug=1`

Example: `http://localhost:3000/admin?__mwdebug=1`

This will show detailed logs in:
- Browser console
- Response headers (`x-mw-logs`)
- Network tab

### Step 2: Check Your Admin Status in Database
Run the diagnostic SQL script:
1. Open Supabase SQL Editor
2. Run: `supabase/diagnostics/check_admin_status.sql`
3. Check if your user appears in:
   - `admin_users` table
   - `profiles` table with `is_admin = true`

### Step 3: Verify What the Middleware Sees
When you visit `/admin?__mwdebug=1`, check the logs for:
- `user-found` - Your session is valid
- `admin-status: adminUser=true` - You're in admin_users table
- `admin-verified ✅` - You passed the check

If you see:
- `admin-no-user` → Session issue (cookies/auth problem)
- `not-admin` → Database issue (you're not marked as admin)
- `admin-check-error` → RLS/permissions issue

## Quick Fixes

### Fix 1: Add Yourself as Admin (Database)
```sql
-- Run in Supabase SQL Editor
-- Replace with YOUR email
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'your@email.com'
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'your@email.com';
```

### Fix 2: Fix RLS Policies
```sql
-- Ensure admin_users table can be read
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow reading admin_users" ON public.admin_users;
CREATE POLICY "Allow reading admin_users"
ON public.admin_users FOR SELECT
USING (true);

GRANT SELECT ON public.admin_users TO anon;
GRANT SELECT ON public.admin_users TO authenticated;
```

### Fix 3: Clear Browser State
Sometimes cached auth state causes issues:
1. Open DevTools Console
2. Run:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Log in again

### Fix 4: Set Admin Role in User Metadata
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your@email.com';
```

## Recent Changes Made

### 1. Fixed `middleware.ts`
- Changed redirect from `/login` to `/admin/login` for consistency
- Added skip for `/admin/login` and `/admin/signup` pages to prevent redirect loops
- Improved error logging with detailed admin status
- Added error query params for better debugging

### 2. Created Diagnostic Tools
- `check_admin_status.sql` - Check your admin status across all tables
- This README - Step-by-step debugging guide

## Testing the Fix

1. **Enable debug mode**: Visit `http://localhost:3000/admin?__mwdebug=1`
2. **Check console**: Look for middleware logs
3. **Check network tab**: Look for `x-mw-logs` header in the response
4. **Verify redirect**: If you're redirected, check the URL for error params

## Common Issues

### Issue: "admin-no-user" in logs
**Cause**: Session/cookies not working  
**Fix**: 
- Check if cookies are enabled
- Try logging out and back in
- Clear browser storage and try again

### Issue: "not-admin" in logs
**Cause**: Not marked as admin in database  
**Fix**: Run "Fix 1" SQL above

### Issue: "admin-check-error" in logs
**Cause**: RLS policy blocking the query  
**Fix**: Run "Fix 2" SQL above

### Issue: Infinite redirect loop
**Cause**: Middleware was redirecting login page too  
**Fix**: Already fixed in latest middleware.ts update

## Need More Help?

If you're still having issues:
1. Share the `x-mw-logs` header value (visit with `?__mwdebug=1`)
2. Share the output of `check_admin_status.sql`
3. Share any console errors
