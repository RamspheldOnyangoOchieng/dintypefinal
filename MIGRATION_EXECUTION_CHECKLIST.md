# 🚀 DATABASE MIGRATION EXECUTION CHECKLIST

## ✅ Pre-Migration Review Complete!

You've reviewed:
- ✅ 65 migration files (chronologically ordered)
- ✅ All will create 25+ tables
- ✅ Admin system, token system, payment system
- ✅ SEK currency support
- ✅ Complete CMS system

---

## 📋 EXECUTION CHECKLIST

### Phase 1: Preparation ✅ DONE
- [x] Got client database credentials
- [x] Updated env.txt with new credentials
- [x] Tested connection successfully
- [x] Database confirmed empty (0 tables)
- [x] Reviewed all migrations and documentation

### Phase 2: Backup & Switch (NEXT!)
- [ ] Backup current .env → .env.dev.backup
- [ ] Copy env.txt → .env (activate client DB)
- [ ] Verify new .env has correct credentials

### Phase 3: Run Migrations
- [ ] Run: `node scripts/apply-migrations.js`
- [ ] Confirm all 65 migrations complete
- [ ] Check for any errors (should see "OK" for each)
- [ ] Verify ~25 tables created

### Phase 4: Data Population
- [ ] Run: `node scripts/setup-sek-packages.js`
  - Creates 4 token packages (SEK pricing)
  - 200 tokens = 99 SEK
  - 550 tokens = 249 SEK
  - 1550 tokens = 499 SEK
  - 5800 tokens = 1499 SEK

### Phase 5: Admin Setup
- [ ] Run: `node add-current-user-as-admin.js`
  - Enter your email address
  - Confirms admin user created
  - You'll need to sign up in the app first if not already

### Phase 6: Verification
- [ ] Run: `node test-new-db-connection.js`
  - Should show 25+ tables
  - Database no longer empty
- [ ] Run: `pnpm dev`
  - Start the application
  - Test login/signup
  - Check if admin dashboard accessible

### Phase 7: Optional - Character Images
- [ ] (Optional) Run: `node scripts/pregenerate-attribute-images.js`
  - Generates character attribute images
  - Takes 30-60 minutes
  - Can be done later
- [ ] (Optional) Run: `node scripts/regenerate-characters.js`
  - Regenerates AI character data
  - Takes time depending on API
  - Can be done later

---

## 🎯 CRITICAL COMMANDS SUMMARY

```bash
# 1. Backup & Switch
cp .env .env.dev.backup
cp env.txt .env

# 2. Run ALL Migrations (2-5 min)
node scripts/apply-migrations.js

# 3. Setup Token Packages (30 sec)
node scripts/setup-sek-packages.js

# 4. Add Admin User (1 min - interactive)
node add-current-user-as-admin.js

# 5. Verify Everything (30 sec)
node test-new-db-connection.js

# 6. Start App (testing)
pnpm dev

# 7. (Optional) Rollback if issues
cp .env.dev.backup .env
```

---

## ⚠️ IMPORTANT NOTES

### About apply-migrations.js
- Runs all 65 migrations in order
- Each migration shows: `→ filename ... OK`
- Uses transactions (safe rollback on error)
- Detects pooled connection automatically
- Should complete in 2-5 minutes

### About setup-sek-packages.js
- Deletes old token packages
- Creates 4 new packages with SEK pricing
- Safe to run multiple times

### About add-current-user-as-admin.js
⚠️ **IMPORTANT**: This script has hardcoded dev database credentials!
You'll need to either:
1. Update it to use `.env` file, OR
2. Run this command manually after you create your first user

### Manual Admin Addition (Alternative)
After signing up in the app, run this SQL:
```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Add yourself as admin (use the ID from above)
INSERT INTO admin_users (user_id) VALUES ('your-user-id-here');
```

---

## 🔍 EXPECTED RESULTS

### After Migrations (Step 3)
```
→ 20240318_create_debug_helpers.sql ... OK
→ 20240321_add_is_admin_function.sql ... OK
→ 20240321_create_stripe_keys_table.sql ... OK
... (62 more migrations)
→ 20251110_update_token_packages_sek_pricing.sql ... OK

All migrations applied successfully.
```

### After Token Packages (Step 4)
```
🧹 Cleaning up token packages...
✅ Old packages removed

📦 Creating new SEK token packages...
✅ Created: Small Package (200 tokens = 99 SEK)
✅ Created: Medium Package (550 tokens = 249 SEK)
✅ Created: Large Package (1550 tokens = 499 SEK)
✅ Created: Mega Package (5800 tokens = 1499 SEK)
```

### After Verification (Step 5)
```
📋 Existing tables: 27
📝 Tables found:
   - characters
   - generated_images
   - collections
   - user_tokens
   - token_packages
   - subscription_plans
   - payments
   - admin_users
   - banned_users
   - cost_logs
   ... (17 more)
```

---

## 🆘 TROUBLESHOOTING

### Issue: Migration fails midway
**Solution**: 
1. Check error message
2. Fix the specific migration file if needed
3. Migrations use transactions, so failed ones rollback
4. Safe to re-run apply-migrations.js

### Issue: "relation already exists"
**Solution**: 
- Table already created (maybe migration ran before)
- Skip to next migration or continue
- Most migrations have "IF NOT EXISTS" clauses

### Issue: add-current-user-as-admin.js connects to wrong DB
**Solution**:
Use manual SQL method instead:
```sql
SELECT id FROM auth.users WHERE email = 'your@email.com';
INSERT INTO admin_users (user_id) VALUES ('user-id-from-above');
```

### Issue: Can't see admin dashboard in app
**Solution**:
1. Make sure you added yourself as admin
2. Sign out and sign in again
3. Check browser console for errors
4. Verify admin_users table has your user_id

### Issue: SEK pricing not showing
**Solution**:
1. Verify token_packages table has data:
   ```sql
   SELECT * FROM token_packages ORDER BY tokens;
   ```
2. Clear browser cache
3. Check app fetches from correct database

---

## 🎉 SUCCESS CRITERIA

After all steps, you should have:

### Database Level:
- ✅ 27 tables created
- ✅ 10+ functions/procedures
- ✅ RLS policies on all tables
- ✅ Storage bucket for images
- ✅ Token packages with SEK pricing

### Application Level:
- ✅ App connects to client database
- ✅ Can sign up/login users
- ✅ Token system functional
- ✅ Admin dashboard accessible (if admin)
- ✅ Can create characters
- ✅ Payment system ready (with Stripe config)
- ✅ SEK currency shows in UI

### Admin Features:
- ✅ User management page works
- ✅ Can ban/unban users
- ✅ Cost tracking visible
- ✅ Payment disputes manageable

---

## 📝 POST-MIGRATION TASKS

After successful migration:

1. **Test Core Features**
   - [ ] User signup/login
   - [ ] Character creation
   - [ ] Token usage
   - [ ] Admin dashboard

2. **Configure Services**
   - [ ] Stripe webhook endpoints
   - [ ] Email templates (if using)
   - [ ] Storage policies

3. **Populate Content**
   - [ ] Add FAQ content
   - [ ] Update footer content
   - [ ] Create initial blog posts
   - [ ] Add premium page content

4. **Optional Enhancements**
   - [ ] Generate character images
   - [ ] Pregenerate attribute images
   - [ ] Import existing user data (if any)

---

## 🔄 ROLLBACK PROCEDURE

If anything goes wrong:

```bash
# 1. Stop the app
Ctrl+C (if running)

# 2. Restore dev database
cp .env.dev.backup .env

# 3. Restart app (now on dev DB)
pnpm dev

# 4. Analyze what went wrong
# 5. Fix issues
# 6. Try again
```

The client database will remain in whatever state it was in when the error occurred. You can either:
- Drop all tables and start fresh, OR
- Continue from where it failed

---

## ✅ READY TO PROCEED?

You've reviewed everything. The plan is solid.

**Estimated Total Time**: 10-15 minutes (without optional image generation)

**Risk Level**: Low (we have backups and rollback plan)

**Recommendation**: Proceed with automatic execution

---

## 🚦 NEXT STEP

Say "proceed" or "let's do it" and I'll execute all steps automatically!

Or say:
- "manual" - I'll guide you through each step one by one
- "review X" - To review a specific migration file
- "wait" - If you need more time

Your choice! 🎯
