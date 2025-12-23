# ✅ FIXED: Variable Naming Conflict Resolved

## The Error You Got
```
ERROR: 42702: column reference "table_name" is ambiguous
DETAIL: It could refer to either a PL/pgSQL variable or a table column.
```

## What Happened
In the PL/pgSQL block, I used a variable named `table_name`, which conflicts with the column `table_name` in `information_schema.tables`.

PostgreSQL couldn't tell if you meant:
- The **variable** `table_name` (from FOREACH loop)
- The **column** `information_schema.tables.table_name`

## The Fix
Changed the variable name from `table_name` to `tbl_name`:

```sql
-- BEFORE (caused error):
DECLARE
    table_name TEXT;  -- ❌ Conflicts with column name
BEGIN
    FOREACH table_name IN ARRAY tables_to_fix
    LOOP
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = table_name  -- ❌ Ambiguous!
        )

-- AFTER (fixed):
DECLARE
    tbl_name TEXT;  -- ✅ No conflict
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_fix
    LOOP
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = tbl_name  -- ✅ Clear: column = variable
        )
```

## Updated Files

### 1. `fix_permissions_safe.sql` (FIXED) ✅
- Renamed variable to `tbl_name`
- No more naming conflicts
- Safe with error handling

### 2. `fix_permissions_simple.sql` (NEW - RECOMMENDED) ⭐
- **No PL/pgSQL** - just straightforward SQL
- Easier to understand
- If a table doesn't exist, you'll see exactly which one
- **This is now the recommended approach**

## Which Script to Use?

### Use `fix_permissions_simple.sql` if:
- ✅ You want a straightforward approach
- ✅ You're okay with seeing errors for missing tables
- ✅ You want to know exactly which tables exist/don't exist

### Use `fix_permissions_safe.sql` if:
- ✅ You want zero errors
- ✅ You prefer scripts that check before executing
- ✅ You're comfortable with PL/pgSQL

**Both scripts do the same thing - just different approaches!**

## How to Run (Updated)

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Choose one:**
   - `fix_permissions_simple.sql` ⭐ (recommended)
   - `fix_permissions_safe.sql` (fixed, safe approach)
3. **Copy & Paste** into SQL Editor
4. **Click "Run"**
5. **Hard refresh** your frontend

## What Both Scripts Do

1. **Grant SELECT permissions** to `anon` and `authenticated` roles on public tables
2. **Enable RLS** on all tables
3. **Create RLS policies** to control row-level access
4. **Show verification** of what was granted

## Expected Result

After running either script:
- ✅ No more `permission denied for schema public` errors
- ✅ FAQs load correctly
- ✅ Banners display from Cloudinary
- ✅ Image suggestions work
- ✅ All frontend data fetching successful

---

**The naming conflict is now fixed in both scripts!** 🎉
