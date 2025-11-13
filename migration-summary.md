# 🗄️ COMPLETE DATABASE MIGRATION REVIEW

## 📊 Overview
- **Total Migration Files**: 65
- **Database Status**: Empty (0 tables)
- **Target Database**: Client Production (yrhexcjqwycfkjrmgplp.supabase.co)
- **Current Database**: Dev (qfjptqdkthmejxpwbmvq.supabase.co)

---

## 📅 MIGRATION TIMELINE (2024-2025)

### Phase 1: Foundation (March 2024)
**Files 1-10** - Core setup
```
✅ 20240318_create_debug_helpers.sql          - Debug utilities
✅ 20240321_add_is_admin_function.sql         - Admin check function
✅ 20240321_create_stripe_keys_table.sql      - Stripe integration
✅ 20240321_create_stripe_keys_function.sql   - Stripe key management
✅ 20240322_create_payments_table.sql         - Payment system
✅ 20240322_create_subscription_plans.sql     - Subscription tiers
✅ 20240322_settings_rls_policy.sql           - Settings security
✅ 20240322_update_premium_profiles.sql       - Premium features
✅ 20240330_create_collections_table.sql      - Image collections
✅ 20240330_create_generated_images_table.sql - AI generated images
```

### Phase 2: Images & Security (March-April 2024)
**Files 11-20** - Image handling & RLS
```
✅ 20240330_fix_generated_images_fk.sql       - Foreign key fixes
✅ 20240330_update_generated_images_rls.sql   - Image security
✅ 20240330_update_generated_images_table.sql - Image table updates
✅ 20240331_add_anonymous_policies.sql        - Anonymous user access
✅ 20240331_add_rls_policies.sql              - Row level security
✅ 20240401_add_video_url_to_characters.sql   - Video support
✅ 20240401_fix_subscription_plans_rls.sql    - Subscription security
✅ 20240415_create_faqs_table.sql             - FAQ system
✅ 20240415_setup_faqs_table_final.sql        - FAQ completion
✅ 20240415_create_footer_content_table.sql   - CMS footer
```

### Phase 3: Token System (June 2024)
**Files 21-30** - Token economy
```
✅ 20240522_create_subscription_system.sql    - Full subscription system
✅ 20240612_create_token_tables.sql           - User tokens
✅ 20240612_create_token_usage_function.sql   - Token consumption
✅ 20240612_create_delete_user_function.sql   - User deletion
✅ 20240729_fix_character_rls.sql             - Character security
```

### Phase 4: Character Enhancements (Nov 2024-Jan 2025)
**Files 31-45** - Character metadata
```
✅ 20241109_add_image_url_column.sql          - Image URL field
✅ 20250107_update_plan_features_from_spreadsheet.sql - Plan features
✅ 20250108_add_metadata_to_characters.sql    - Character metadata
✅ 20250110_auto_create_user_tokens.sql       - Auto token creation
✅ 20250110_create_cms_tables.sql             - CMS system
✅ 20250110_create_cost_logs.sql              - Cost tracking
✅ 20250110_create_storage_bucket.sql         - Storage setup
✅ 20250110_insert_token_packages.sql         - Token packages
✅ 20250111_add_bilingual_blog.sql            - Blog system
✅ 20250115000000_create_saved_prompts_table.sql - Saved prompts
```

### Phase 5: Advanced Features (Aug 2025)
**Files 46-55** - Functions & admin
```
✅ 20250810222200_create_decrement_user_tokens_function.sql - Token deduction
✅ 20250811142000_create_settings_table.sql   - App settings
✅ 20250811171500_update_users_rls.sql        - User security
✅ 20250811194800_create_execute_sql_function.sql - SQL executor
✅ 20250812135400_create_documents_table.sql  - Document management
✅ 20250812163500_create_revenue_transactions_table.sql - Revenue tracking
✅ 20250812172200_alter_revenue_transactions_amount_type.sql - Amount fixes
✅ 20250812174500_create_token_packages_table.sql - Token packages v2
✅ 20250812174600_create_premium_page_content_table.sql - Premium CMS
✅ 20250812174700_seed_premium_page_content.sql - Premium seed data
```

### Phase 6: SEK Pricing & Admin (Nov 2025)
**Files 56-65** - Latest features
```
✅ 20250812174800_seed_token_packages.sql     - Token package data
✅ 20250906110000_create_plan_features_table.sql - Plan features v2
✅ 20251109000000_add_metadata_to_characters.sql - Character metadata v2
✅ 20251109000001_add_voice_to_characters.sql - Voice support
✅ 20251109000002_comprehensive_characters_migration.sql - Full character update
✅ 20251109000003_make_character_columns_nullable.sql - Nullable columns
✅ 20251109120000_create_admin_users_table.sql - Admin system
✅ 20251109120001_create_banned_users_table.sql - Ban system
✅ 20251109120002_create_cost_logs_table.sql  - Cost logging
✅ 20251109120003_create_payment_disputes_table.sql - Dispute system
✅ 20251109120004_complete_all_migrations.sql - Meta migration
✅ 20251109120005_create_email_templates_table.sql - Email templates
✅ 20251110_update_token_packages_sek_pricing.sql - SEK currency
```

---

## 🗂️ DATABASE SCHEMA (After All Migrations)

### Core Tables (15+)
1. **characters** - AI character profiles
2. **generated_images** - AI generated images
3. **collections** - Image collections
4. **users** (auth.users) - User accounts
5. **user_tokens** - Token balances
6. **token_usage** - Token consumption log
7. **token_packages** - Purchase packages (SEK pricing)
8. **subscription_plans** - Subscription tiers
9. **plan_features** - Feature limits per plan
10. **payments** - Payment records
11. **revenue_transactions** - Revenue tracking
12. **payment_disputes** - Refunds & disputes
13. **admin_users** - Admin privileges
14. **banned_users** - Ban list
15. **cost_logs** - Cost analytics

### CMS Tables (5+)
16. **faqs** - FAQ content
17. **footer_content** - Footer data
18. **premium_page_content** - Premium page CMS
19. **blog_posts** - Bilingual blog
20. **email_templates** - Email templates
21. **documents** - Document storage
22. **settings** - App settings

### Supporting Tables (3+)
23. **saved_prompts** - User saved prompts
24. **stripe_keys** - Stripe configuration
25. **storage.buckets** - File storage

---

## 🔧 FUNCTIONS & PROCEDURES

### Admin Functions
- `is_admin(user_uuid)` - Check admin status
- `is_user_banned(user_uuid)` - Check ban status
- `execute_sql(sql_text)` - Execute SQL (admin only)

### Token Functions
- `auto_create_user_tokens()` - Auto-create tokens on signup
- `decrement_user_tokens(user_id, amount)` - Deduct tokens
- `create_token_usage_record(...)` - Log usage

### Cost Functions
- `log_token_cost(...)` - Log API costs
- `get_user_total_cost(user_id)` - Get total costs
- `get_cost_breakdown(...)` - Cost analytics

### Payment Functions
- `create_refund_dispute(...)` - Create refund
- `get_dispute_stats(...)` - Dispute analytics

### Utility Functions
- `delete_user(user_uuid)` - Safely delete user & data
- `update_payment_disputes_updated_at()` - Trigger for timestamps

---

## 🔐 SECURITY (RLS Policies)

All tables have Row Level Security enabled with policies for:
- ✅ Public read (where applicable)
- ✅ User owns data
- ✅ Admin full access
- ✅ Service role bypass
- ✅ Anonymous user access (limited)

---

## 📦 ADDITIONAL SETUP FILES

Beyond migrations, you have:

### 1. Schema Files
- `supabase/schema.sql` - Full schema (alternative to migrations)
- `supabase/complete-setup.sql` - Complete setup script

### 2. Setup Scripts
- `setup_create_character_db.sql` - Character table setup
- `admin_users_setup.sql` - Admin setup

### 3. Script Files (Important!)
- `scripts/setup-sek-packages.js` - Setup SEK pricing
- `scripts/pregenerate-attribute-images.js` - Generate character images
- `scripts/regenerate-characters.js` - Regenerate AI characters
- `add-current-user-as-admin.js` - Make yourself admin
- `scripts/cleanup-token-packages.js` - Clean duplicate packages

---

## ⚠️ CRITICAL CONSIDERATIONS

### 1. Migration Order Matters
- Migrations MUST run in chronological order
- Foreign keys depend on tables created earlier
- Functions depend on tables

### 2. Duplicate Prevention
- Some migrations have `CREATE IF NOT EXISTS`
- Some migrations have `DROP IF EXISTS` first
- Running twice should be safe (mostly)

### 3. Data Population
After migrations complete, you need to:
- ✅ Setup SEK token packages
- ✅ Create default subscription plans
- ✅ Add yourself as admin
- ✅ Populate CMS content (FAQs, footer, etc.)
- ✅ Generate character images (optional)

### 4. Schema vs Migrations
You have TWO options:
- **Option A**: Run all 65 migrations (recommended, tracks history)
- **Option B**: Run `schema.sql` or `complete-setup.sql` (faster, no history)

---

## 🚀 RECOMMENDED EXECUTION PLAN

### Step 1: Backup Current .env
```bash
cp .env .env.dev.backup
```

### Step 2: Switch to Client Database
```bash
cp env.txt .env
```

### Step 3: Run All Migrations
```bash
node scripts/apply-migrations.js
```
This will run all 65 migrations in order.

### Step 4: Verify Tables Created
```bash
node test-new-db-connection.js
```
Should show 25+ tables now.

### Step 5: Setup SEK Pricing
```bash
node scripts/setup-sek-packages.js
```

### Step 6: Add Admin User
```bash
node add-current-user-as-admin.js
```

### Step 7: (Optional) Generate Images
```bash
node scripts/pregenerate-attribute-images.js
node scripts/regenerate-characters.js
```

### Step 8: Test Application
```bash
pnpm dev
```

---

## 📝 NOTES

### What Gets Created:
- ✅ 25+ database tables
- ✅ 10+ functions/procedures
- ✅ 50+ RLS policies
- ✅ Storage buckets
- ✅ Indexes for performance
- ✅ Triggers for automation

### What Needs Manual Setup:
- ⚠️ Token packages (run script)
- ⚠️ Admin user (run script)
- ⚠️ CMS content (can be added later)
- ⚠️ Character images (optional)
- ⚠️ Stripe webhook endpoints
- ⚠️ Email templates (optional)

### Time Estimate:
- Migration execution: ~2-5 minutes
- Data population: ~5-10 minutes
- Image generation: ~30-60 minutes (optional)
- Total: ~10-15 minutes (without images)

---

## ✅ SUCCESS CRITERIA

After completion, you should have:
1. ✅ 25+ tables in database
2. ✅ Can login to app
3. ✅ Can create characters
4. ✅ Token system working
5. ✅ Admin dashboard accessible
6. ✅ Payments functional (with Stripe configured)
7. ✅ SEK currency showing in UI

---

## 🆘 ROLLBACK PLAN

If something goes wrong:
1. Stop any running processes
2. Restore original .env:
   ```bash
   cp .env.dev.backup .env
   ```
3. App will reconnect to dev database
4. Investigate issues
5. Try again with fixes

---

## 📞 NEXT QUESTION

Ready to proceed? I recommend:

**Option A**: Run everything automatically (safest)
**Option B**: Run migrations only, then manually test
**Option C**: Review specific migrations first

Which would you prefer?
