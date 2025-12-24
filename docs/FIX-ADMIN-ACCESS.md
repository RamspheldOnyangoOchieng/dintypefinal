# 🔧 QUICK FIX: Admin Access Denied

## Problem
You're logged in as admin but getting "Access Denied" when trying to access `/admin/*` pages.

## Root Cause
The `isAdmin()` function checks 4 places for admin status:
1. `admin_users` table
2. `app_admins` table  
3. `profiles.is_admin` column
4. User metadata

If you're not in ANY of these, you'll be denied access.

---

## ⚡ QUICK FIX (Choose ONE method)

### Method 1: Add to admin_users table (RECOMMENDED)

**Step 1:** Go to Supabase SQL Editor

**Step 2:** Run this (replace with YOUR email):

```sql
-- Add yourself as admin
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users 
WHERE email = 'aware1.gaming@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify it worked
SELECT * FROM admin_users WHERE email = 'aware1.gaming@gmail.com';
```

---

### Method 2: Update profiles table

```sql
-- Mark yourself as admin in profiles
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'aware1.gaming@gmail.com');

-- Verify it worked
SELECT id, email, is_admin FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'aware1.gaming@gmail.com');
```

---

### Method 3: Use the diagnostic script

**Step 1:** Open file:
```
supabase/diagnostics/check_admin_status.sql
```

**Step 2:** Replace `aware1.gaming@gmail.com` with YOUR email throughout the file

**Step 3:** Copy and paste into Supabase SQL Editor

**Step 4:** Run the entire script

**Step 5:** Look for results that say "✅ In admin_users" or "✅ In profiles"

---

## 🔄 After Running the Fix

1. **Logout** from your app
2. **Clear browser cache** (or use Incognito/Private window)
3. **Login again** as admin
4. **Try accessing** `/admin/dashboard`

The auth context will re-check your admin status on login and should now grant you access!

---

## 🧪 Test Your Admin Status

After applying the fix, open browser console (F12) and check for logs:

You should see:
```
[isAdmin] Checking admin status for user: xxx-xxx-xxx
[isAdmin] ✅ User found in admin_users table
```

OR

```
[isAdmin] ✅ User has is_admin=true in profiles
```

If you see `❌ NOT ADMIN`, the fix didn't work - try another method.

---

## 🆘 Still Not Working?

Check these:

### 1. Session Cookie Issues
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
// Then logout and login again
```

### 2. RLS Policies
Make sure the `admin_users` table has proper SELECT policy:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'admin_users';

-- If no SELECT policy exists, create one:
CREATE POLICY "Allow anon to check admin status"
ON admin_users FOR SELECT
TO anon
USING (true);
```

### 3. Check Auth Context
Open `/components/auth-context.tsx` and verify line 88:
```typescript
const adminStatus = await isAdmin(user.id)
```

This should be calling the isAdmin function correctly.

---

## 🎯 MOST LIKELY FIX

**99% of the time, this is the issue:**

You're in `admin_users` table BUT the RLS policy is blocking the read.

Run this:

```sql
-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow anon to check admin status" ON admin_users;
DROP POLICY IF EXISTS "Anyone can check admin status" ON admin_users;

-- Create new policy that allows checking
CREATE POLICY "Anyone can check admin status"
ON admin_users FOR SELECT
TO anon, authenticated
USING (true);

-- Grant SELECT permission
GRANT SELECT ON admin_users TO anon, authenticated;
```

Then logout, login again, and try accessing admin!
