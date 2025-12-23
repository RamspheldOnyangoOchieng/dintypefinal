# 🚀 READY TO FIX - Choose Your Script

## ⚡ Quick Steps

1. Open **Supabase Dashboard** → **SQL Editor**
2. Pick **ONE** of these scripts (both work!):

---

## Option 1: Simple & Direct ⭐ **RECOMMENDED**

**File:** `supabase/diagnostics/fix_permissions_simple.sql`

✅ **Use this if:** You want straightforward SQL  
⚠️ **Note:** Will show errors for non-existent tables (you can ignore them)

### What you'll see:
```
ERROR: relation "blog_posts" does not exist
(ignore - just means you don't have that table)

✅ Success for tables that exist!
```

---

## Option 2: Smart & Safe

**File:** `supabase/diagnostics/fix_permissions_safe.sql`

✅ **Use this if:** You want zero errors  
⚠️ **Note:** Uses PL/pgSQL (slightly more complex)

### What you'll see:
```
NOTICE: Granted SELECT on banners to anon, authenticated
NOTICE: Enabled RLS on banners
NOTICE: Created RLS policy for banners
NOTICE: Table blog_posts does not exist, skipping
...
```

---

## After Running Either Script

### Stop Dev Server & Restart
```bash
# Press Ctrl+C to stop
npm run dev
```

### Hard Refresh Browser
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Expected Result
✅ No console errors  
✅ FAQs load  
✅ Banners from Cloudinary display  
✅ Image suggestions work  
✅ All data fetching successful  

---

## Tables That Get Fixed

**Public Access (anyone can read):**
- banners
- image_suggestions
- faqs
- token_packages
- premium_page_content
- plan_features
- characters
- subscription_plans

**Authenticated Access (logged-in users only):**
- profiles (own only)
- user_tokens (own only)
- generated_images (own only)
- token_transactions (own only)
- payment_transactions (own only)

---

## Troubleshooting

### Still seeing errors?
1. Check Supabase SQL Editor for error messages
2. Verify tables exist in Table Editor
3. Check `.env` file has correct Supabase credentials
4. Clear browser cache completely

### Want to verify permissions?
Run this query in SQL Editor:
```sql
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND table_schema = 'public'
ORDER BY table_name;
```

---

## Summary

| Script | Complexity | Error Handling | Recommended |
|--------|-----------|----------------|-------------|
| `fix_permissions_simple.sql` | Low | Shows errors | ⭐ **Yes** |
| `fix_permissions_safe.sql` | Medium | Skips errors | ✅ Alternative |

**Both fix the same issue - pick whichever you prefer!**

---

**Time to fix: 1 minute** ⏱️  
**Difficulty: Copy & Paste** 📋
