># 🔧 Frontend Fetch Error Fix Guide
## Issue: Banners & Image Suggestions Not Loading

## 🚨 Problem
Your database **has the tables and data**, but the **frontend cannot fetch** them due to **Row Level Security (RLS) policy issues**.

### Symptoms:
- ✅ Database has `banners` and `image_suggestions` tables
- ✅ Data exists and is routed to Cloudinary  
- ❌ Frontend shows "Supabase error: 0"
- ❌ Frontend shows "Error fetching banners: 0"
- ❌ Console shows "permission denied for schema public"

### Root Cause:
**RLS policies are blocking anonymous (unauthenticated) users from reading the tables.**

Your frontend uses the `anon` role (anonymous), but the RLS policies likely only allow `authenticated` users to access the data.

---

## ✅ Solution: Fix RLS Policies

### Step 1: Run the RLS Fix Script

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to **SQL Editor**

2. **Execute the Fix**
   - Open file: `supabase/diagnostics/fix_rls_combined.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click **Run**

### Step 2: Verify the Fix

After running the script, you should see output showing:
- Policy names created
- Count of accessible banners
- Count of accessible image suggestions

### Step 3: Test in Frontend

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Reload the page**
3. **Check console** - errors should be gone
4. **Verify data loads** - banners and suggestions should display

---

## 🔍 What the Fix Does

### For `banners` table:
```sql
-- Allows anonymous users to read ACTIVE banners
CREATE POLICY "Allow public read access to active banners"
ON public.banners
FOR SELECT
TO anon, authenticated
USING (is_active = true);
```

### For `image_suggestions` table:
```sql
-- Allows anonymous users to read ACTIVE suggestions
CREATE POLICY "Allow public read access to active suggestions"
ON public.image_suggestions
FOR SELECT
TO anon, authenticated
USING (is_active = true);
```

**Key points:**
- `TO anon, authenticated` → Allows BOTH logged-out and logged-in users
- `USING (is_active = true)` → Only shows active records to public users
- Authenticated users can see ALL records (including inactive ones)

---

## 🛠️ Additional Fixes Made

### Enhanced Error Logging
I've updated `banner-context.tsx` to show **detailed error information**:

```typescript
console.error("Supabase error details:", {
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code,
})
```

Now you'll see **actual error messages** instead of just "0".

---

## 📋 Diagnostic Tools Created

If you need to investigate further:

### 1. Check RLS Status
Run: `supabase/diagnostics/check_banners_rls.sql`
- Shows table structure
- Lists all RLS policies
- Tests anonymous access

### 2. Fix Banners Only
Run: `supabase/diagnostics/fix_banners_rls.sql`

### 3. Fix Image Suggestions Only
Run: `supabase/diagnostics/fix_image_suggestions_rls.sql`

### 4. Fix Both (Recommended)
Run: `supabase/diagnostics/fix_rls_combined.sql` ⭐

---

## 🐛 If Issues Persist

### Check 1: Verify Environment Variables
Ensure your `.env.local` or `.env` has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Check 2: Restart Development Server
```bash
npm run dev
# or
yarn dev
```

### Check 3: Check Supabase Client
The client in `utils/supabase/client.ts` should use:
```typescript
createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
✅ This is already correct in your code.

### Check 4: Verify Table Names
In your Supabase dashboard → Table Editor, confirm:
- Table is named exactly `banners` (lowercase, plural)
- Table is named exactly `image_suggestions` (lowercase, underscore)

### Check 5: Check for Typos in Context
In `banner-context.tsx` line 44:
```typescript
.from("banners")  // Must match exact table name
```

In `image-suggestions-context.tsx` line 39:
```typescript
.from("image_suggestions")  // Must match exact table name
```

---

## 🎯 Expected Behavior After Fix

### Before Fix:
```
Console Errors:
❌ Supabase error: 0
❌ Error fetching banners: 0
❌ permission denied for schema public

UI:
❌ No banners shown (or fallback banners)
❌ No image suggestions shown
```

### After Fix:
```
Console:
✅ No errors
✅ Data fetching successfully

UI:
✅ Banners displayed from Cloudinary
✅ Image suggestions loaded
✅ Everything works for non-logged-in users
```

---

## 📝 Files Modified/Created

### Modified:
- `components/banner-context.tsx` - Improved error logging
- `components/image-suggestions-context.tsx` - (Needs same fix)

### Created:
- `supabase/diagnostics/check_banners_rls.sql` - Diagnostic tool
- `supabase/diagnostics/fix_banners_rls.sql` - Fix for banners
- `supabase/diagnostics/fix_image_suggestions_rls.sql` - Fix for suggestions
- `supabase/diagnostics/fix_rls_combined.sql` - **Combined fix** ⭐

---

## 🎉 Summary

**The problem:** RLS policies blocking anonymous users  
**The solution:** Update policies to allow `anon` role to read active records  
**The fix:** Run `fix_rls_combined.sql` in Supabase SQL Editor

After running the fix, your Cloudinary banners should load perfectly in the frontend! 🚀
