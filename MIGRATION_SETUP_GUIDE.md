# Database Migrations Setup Guide

## 🎯 Purpose
This guide will help you apply all missing database migrations for admin features.

## 📦 What's Being Created

### 4 New Tables:
1. **admin_users** - Track admin privileges
2. **banned_users** - Track banned users with duration and reason
3. **cost_logs** - Track token usage costs for analytics
4. **payment_disputes** - Track refunds and payment disputes

### 10 New Functions:
1. `is_admin(user_uuid)` - Check if user is admin
2. `is_user_banned(user_uuid)` - Check if user is banned
3. `log_token_cost(...)` - Log token usage
4. `get_user_total_cost(user_id)` - Get total user costs
5. `get_cost_breakdown(...)` - Get cost analytics
6. `create_refund_dispute(...)` - Create refund record
7. `get_dispute_stats(...)` - Get dispute statistics
8. `update_payment_disputes_updated_at()` - Trigger function

## 🚀 Method 1: Automated (Recommended)

### Run the migration script:
```bash
./scripts/run-migrations.sh
```

This will:
- ✅ Check for Supabase CLI
- ✅ List migrations to apply
- ✅ Ask for confirmation
- ✅ Apply all migrations
- ✅ Verify success

## 📝 Method 2: Manual (Supabase Dashboard)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**

### Step 2: Run Migration SQL
1. Open file: `supabase/migrations/20251109120004_complete_all_migrations.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **Run**

### Step 3: Verify
You should see output:
```
table_name        | row_count
------------------|----------
admin_users       | 0
banned_users      | 0
cost_logs         | 0
payment_disputes  | 0
```

## 🔧 Method 3: Individual Migrations

If you prefer to apply migrations one by one:

```bash
# 1. Admin users table
psql $DATABASE_URL -f supabase/migrations/20251109120000_create_admin_users_table.sql

# 2. Banned users table
psql $DATABASE_URL -f supabase/migrations/20251109120001_create_banned_users_table.sql

# 3. Cost logs table
psql $DATABASE_URL -f supabase/migrations/20251109120002_create_cost_logs_table.sql

# 4. Payment disputes table
psql $DATABASE_URL -f supabase/migrations/20251109120003_create_payment_disputes_table.sql
```

## ✅ Verification Steps

### 1. Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_users', 'banned_users', 'cost_logs', 'payment_disputes');
```

### 2. Check Functions Created
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'is_user_banned', 'log_token_cost');
```

### 3. Test Admin Function
```sql
SELECT is_admin('your-user-uuid-here');
-- Should return: false (until you add yourself as admin)
```

## 👑 Add Your First Admin

### After migrations are complete:

```sql
-- Replace with your actual user UUID
INSERT INTO admin_users (user_id)
VALUES ('your-user-uuid-from-auth-users');
```

### To find your user UUID:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

## 🧪 Test Admin Features

After adding yourself as admin:

1. **Test Admin Check:**
   ```sql
   SELECT is_admin(auth.uid());  -- Should return: true
   ```

2. **Test Ban User:**
   ```sql
   -- Ban a test user for 7 days
   INSERT INTO banned_users (user_id, banned_until, reason)
   VALUES ('test-user-uuid', NOW() + INTERVAL '7 days', 'Test ban');
   
   SELECT is_user_banned('test-user-uuid');  -- Should return: true
   ```

3. **Test Cost Logging:**
   ```sql
   SELECT log_token_cost(
     'your-user-uuid',
     'chat_message',
     10,
     '{"model": "gpt-4", "tokens": 150}'::jsonb
   );
   
   SELECT * FROM cost_logs WHERE user_id = 'your-user-uuid';
   ```

4. **Test Dispute Creation:**
   ```sql
   SELECT create_refund_dispute(
     NULL,  -- payment_transaction_id
     'your-user-uuid',
     9.99,
     'Test refund',
     'ch_test_123'
   );
   
   SELECT * FROM payment_disputes WHERE user_id = 'your-user-uuid';
   ```

## 🔒 Security Features

All tables have:
- ✅ Row Level Security (RLS) enabled
- ✅ Admin-only access policies
- ✅ User can view own data
- ✅ Service role bypass for APIs
- ✅ Proper indexes for performance

## 📊 Admin Dashboard Access

After migrations:

1. Visit: `/admin/dashboard/users`
   - Ban/unban users
   - Reset passwords
   - Promote/demote admins

2. Visit: `/admin/dashboard/costs` (if created)
   - View cost breakdown
   - Monitor token usage
   - Track by action type

3. Visit: `/admin/dashboard/payments`
   - Process refunds
   - View disputes
   - Track payment issues

## ❌ Troubleshooting

### Error: "relation already exists"
- Tables already created, you're good!
- Skip to verification steps

### Error: "permission denied"
- Make sure you're using service role key
- Or run as database owner

### Error: "column does not exist"
- Make sure payment_transactions table exists
- Run previous migrations first

### Error: "function does not exist"
- Make sure all migrations ran successfully
- Check for SQL syntax errors

## 🎉 Success!

Once complete, you'll have:
- ✅ Full admin user management
- ✅ User ban/unban system
- ✅ Token cost tracking
- ✅ Refund/dispute management
- ✅ All features ACTUALLY working!

## 📞 Next Steps

1. Add yourself as admin (see above)
2. Test admin features in dashboard
3. Configure API endpoints to use new tables
4. Update frontend to show admin features
5. Test user ban flow
6. Test cost logging integration

---

**Migration Files Location:**
- Individual: `supabase/migrations/20251109120000_*.sql`
- Combined: `supabase/migrations/20251109120004_complete_all_migrations.sql`
- Runner: `scripts/run-migrations.sh`
