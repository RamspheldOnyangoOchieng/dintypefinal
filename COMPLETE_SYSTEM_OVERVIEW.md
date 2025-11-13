# 🎯 COMPLETE SYSTEM OVERVIEW - dintyp.se

## 📊 Project Type
**AI Character Creation & Chat Platform**
- Swedish market (SEK currency)
- Female-only AI companions
- Freemium model (Free + Premium tiers)
- Token-based character creation
- Stripe payments integration

---

## 🗄️ STORAGE BUCKETS (Supabase Storage)

Your system requires **3 Storage Buckets**:

### 1. **`images`** bucket (Main)
- **Purpose**: User-generated character images
- **Public**: Yes
- **Created in**: Multiple migrations + schema.sql
- **Policies**: 
  - Public read access
  - Authenticated users can upload/update/delete

### 2. **`attributes`** bucket (Character Creation)
- **Purpose**: Pre-generated attribute preview images
- **Public**: Yes
- **Created in**: `setup_create_character_db.sql`
- **Used by**: Create character flow
- **Content**: ~168 images (8 attributes × 4-7 values × 2 styles)
- **Policies**:
  - Public can view
  - Authenticated can upload/update/delete

### 3. **`media-library`** bucket (CMS)
- **Purpose**: Admin uploaded media for CMS
- **Public**: Yes (read-only)
- **Created in**: `supabase/migrations/20250110_create_storage_bucket.sql`
- **Used by**: Blog, documents, premium pages
- **Policies**:
  - Public read access
  - Admin-only upload/delete

---

## 📦 DATABASE TABLES (27 Total)

### Core Application (7 tables)
1. **characters** - AI character profiles with metadata
2. **generated_images** - User-generated images history
3. **collections** - Image collection organization
4. **attribute_images** - Pre-generated character creation images
5. **saved_prompts** - User saved prompts
6. **settings** - Application settings
7. **documents** - Document management

### User & Auth (5 tables)
8. **users** (auth.users) - Supabase auth users
9. **admin_users** - Admin privilege tracking
10. **banned_users** - Ban system with duration
11. **user_tokens** - Token balances per user
12. **token_usage** - Token consumption log

### Payments & Revenue (7 tables)
13. **payments** - Payment records
14. **revenue_transactions** - Revenue tracking
15. **payment_disputes** - Refunds & disputes
16. **token_packages** - Token purchase packages (SEK)
17. **subscription_plans** - Premium subscription tiers
18. **plan_features** - Feature limits per plan
19. **stripe_keys** - Stripe configuration

### CMS & Content (5 tables)
20. **faqs** - FAQ content (bilingual)
21. **footer_content** - Footer data
22. **premium_page_content** - Premium page CMS
23. **blog_posts** - Bilingual blog system
24. **email_templates** - Email templates
25. **media_library** - Uploaded media files

### Analytics & Monitoring (2 tables)
26. **cost_logs** - API cost tracking
27. **debug_logs** - Debug information

---

## 🎨 IMAGE GENERATION SYSTEM

### Types of Images

1. **Character Images** (Main product)
   - Generated via Novita AI API
   - Stored in `images` bucket
   - Tracked in `characters` table
   - Cost: Tokens (10-50 per generation)

2. **Attribute Preview Images** (Character Creation)
   - Pre-generated for instant preview
   - Stored in `attributes` bucket
   - Tracked in `attribute_images` table
   - Total: ~168 images needed
   - Styles: Realistic + Anime

3. **Selection Images** (Character Creation)
   - Generated on-demand during creation flow
   - Used for attribute selection
   - Stored in `images` bucket

### Image Generation Scripts

**🔄 Pre-generation Scripts (Run Once Per Database):**

1. **`scripts/pregenerate-attribute-images.js`**
   - Generates all 168 attribute preview images
   - Takes 30-60 minutes
   - Required for create-character flow
   - Run after migrations complete
   ```bash
   node scripts/pregenerate-attribute-images.js
   ```

2. **`scripts/generate-selection-images.js`**
   - Generates character selection images
   - Optional, can be done on-demand

**🎭 Character Generation Scripts:**

3. **`scripts/regenerate-characters.js`**
   - Creates sample AI characters (Ginah, Maze, Agnes, etc.)
   - Populates database with demo characters
   - Optional but recommended for testing
   - Takes 10-30 minutes depending on count
   ```bash
   node scripts/regenerate-characters.js
   ```

4. **`scripts/regenerate-exact-models.js`**
   - Regenerates specific character models
   - For updating existing characters

5. **`scripts/regenerate-failed.js`**
   - Re-runs failed generations
   - Useful after API errors

**🔍 Utility Scripts:**

6. **`scripts/check-db-images.js`** - Verify image accessibility
7. **`scripts/check-database-characters.js`** - Verify character data
8. **`scripts/fetch-cloudinary-images.js`** - Legacy Cloudinary import
9. **`scripts/migrate-images-to-supabase.js`** - Migrate images to Supabase

---

## 🚀 CRITICAL SETUP SCRIPTS

### Must Run After Migration:

**1. Token Packages Setup** ⭐ CRITICAL
```bash
node scripts/setup-sek-packages.js
```
Creates 4 token packages:
- 200 tokens = 99 SEK
- 550 tokens = 249 SEK
- 1550 tokens = 499 SEK
- 5800 tokens = 1499 SEK

**2. Admin User Setup** ⭐ CRITICAL
```bash
node add-admin-user.js
```
Makes your account an admin (required for dashboard access)

**3. Attribute Images** ⭐ HIGHLY RECOMMENDED
```bash
node scripts/pregenerate-attribute-images.js
```
Generates preview images for character creation (30-60 min)

**4. Sample Characters** ✅ OPTIONAL
```bash
node scripts/regenerate-characters.js
```
Creates demo characters for testing (10-30 min)

---

## 🔧 ADDITIONAL SETUP FILES

### Root-level SQL Files:

1. **`setup_create_character_db.sql`**
   - Creates attribute_images table
   - Creates `attributes` storage bucket
   - Sets up RLS policies for attributes
   - **When to use**: If migrations don't create attribute system

2. **`admin_users_setup.sql`**
   - Quick admin user setup SQL
   - Alternative to add-admin-user.js script

3. **`20240521_create_transactions_table.sql`**
   - Standalone transaction table creation
   - May be included in migrations already

### Root-level Scripts:

1. **`check-admin-status.js`** - Verify admin status
2. **`check-content-blocks.js`** - Verify CMS blocks
3. **`list-all-blocks.js`** - List all content blocks
4. **`normalize-pages.js`** - Normalize page content
5. **`test-payment.js`** - Test Stripe integration
6. **`test-api-endpoint.js`** - Test API endpoints
7. **`test-browser-session.js`** - Test browser sessions

---

## 📖 DOCUMENTATION FILES (41 total)

### Setup & Migration Guides:
- **MIGRATION_SETUP_GUIDE.md** - Migration instructions
- **MIGRATION_EXECUTION_CHECKLIST.md** - Step-by-step checklist (I created this)
- **migration-summary.md** - Complete migration overview (I created this)
- **QUICK_INTEGRATION_GUIDE.md** - Quick start guide
- **NEW_FEATURES_SETUP.md** - New feature setup

### Feature Implementation:
- **CHARACTER_CREATION_TOKEN_BILLING.md** - Token billing system
- **CREATE_CHARACTER_*.md** (4 files) - Character creation guides
- **EMAIL_TEMPLATES_*.md** (2 files) - Email template system
- **TOKEN_BILLING_IMPLEMENTATION.md** - Token billing details
- **PREMIUM_PLAN_IMPLEMENTATION.md** - Premium features
- **FREE_PLAN_*.md** (3 files) - Free plan restrictions
- **FEMALE_ONLY_*.md** (2 files) - Female-only configuration

### Admin & Management:
- **ADMIN_*.md** (3 files) - Admin integration guides
- **USER_ACCOUNT_MANAGEMENT_GUIDE.md** - User management
- **BUDGET_*.md** (2 files) - Budget monitoring
- **BACKEND_COST_ANALYSIS.md** - Cost analysis

### Currency & Payments:
- **SEK_CURRENCY_CONFIGURATION.md** - SEK pricing
- **SWEDISH_KRONA_*.md** (2 files) - Swedish currency implementation

### System Documentation:
- **SYSTEM_QUESTIONNAIRE_ANSWERS.md** - Complete Q&A (2387 lines!)
- **IMPLEMENTATION_*.md** (2 files) - Implementation summaries
- **RESTRICTIONS_IMPLEMENTATION_COMPLETE.md** - Restriction system
- **REGENERATION_STATUS.md** - Regeneration tracking

### Other Features:
- **HOVER_VIDEO_*.md** (2 files) - Video hover feature
- **SEO_META_IMPLEMENTATION_COMPLETE.md** - SEO implementation
- **LOGIN_ACCOUNT_IMPLEMENTATION_SUMMARY.md** - Login system
- **CLOUDINARY_*.md** (2 files) - Cloudinary integration (legacy)

---

## 🎯 COMPLETE MIGRATION CHECKLIST

### Phase 1: Database Setup (5-10 minutes)
- [ ] 1. Backup current .env → .env.dev.backup
- [ ] 2. Copy env.txt → .env
- [ ] 3. Run migrations: `node scripts/apply-migrations.js`
- [ ] 4. Verify: ~27 tables created

### Phase 2: Essential Data (2-3 minutes)
- [ ] 5. Setup token packages: `node scripts/setup-sek-packages.js`
- [ ] 6. Create storage buckets (check if migrations did this)
- [ ] 7. Add admin user: `node add-admin-user.js`

### Phase 3: Storage Buckets (Manual check)
- [ ] 8. Verify `images` bucket exists
- [ ] 9. Verify `attributes` bucket exists
- [ ] 10. Verify `media-library` bucket exists
- [ ] 11. If missing, run: `setup_create_character_db.sql`

### Phase 4: Image Generation (30-90 minutes - OPTIONAL)
- [ ] 12. Generate attribute images: `node scripts/pregenerate-attribute-images.js`
- [ ] 13. Generate sample characters: `node scripts/regenerate-characters.js`

### Phase 5: Testing (5-10 minutes)
- [ ] 14. Start app: `pnpm dev`
- [ ] 15. Test signup/login
- [ ] 16. Test character creation (needs attribute images)
- [ ] 17. Test admin dashboard access
- [ ] 18. Test token purchase (Stripe test mode)

### Phase 6: Configuration (5 minutes)
- [ ] 19. Configure Stripe keys in admin settings
- [ ] 20. Setup Stripe webhook endpoints
- [ ] 21. Test payment flow
- [ ] 22. Populate CMS content (FAQs, footer, etc.)

---

## ⚙️ SYSTEM FEATURES

### User Features:
- ✅ User signup/login (Supabase Auth)
- ✅ Free plan (1 character, limited features)
- ✅ Premium plans (3 plans with different limits)
- ✅ Token system (buy tokens, use for generation)
- ✅ Character creation (AI-powered, female only)
- ✅ Character chat (real-time AI conversation)
- ✅ Image generation (Novita AI integration)
- ✅ Saved prompts
- ✅ User dashboard

### Payment Features:
- ✅ Stripe integration (test + live modes)
- ✅ Token packages (SEK pricing)
- ✅ Premium subscriptions (1, 3, 12 months)
- ✅ Automatic tax calculation
- ✅ Invoice generation
- ✅ Refund processing
- ✅ Dispute tracking
- ✅ 3-day grace period

### Admin Features:
- ✅ Admin dashboard
- ✅ User management (ban/unban, delete)
- ✅ Token management
- ✅ Payment tracking
- ✅ Cost monitoring
- ✅ Email template management
- ✅ CMS (blog, FAQs, footer)
- ✅ Analytics & reports

### Technical Features:
- ✅ SEK currency throughout
- ✅ Bilingual support (Swedish/English)
- ✅ Row Level Security (RLS)
- ✅ API rate limiting
- ✅ Cost tracking
- ✅ Error logging
- ✅ Webhook handling
- ✅ Email notifications

---

## 🔑 CRITICAL ENVIRONMENT VARIABLES

### Supabase (Database & Auth):
```env
NEXT_PUBLIC_SUPABASE_URL=https://yrhexcjqwycfkjrmgplp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service role key)
SUPABASE_ANON_KEY=eyJ... (anon key)
SUPABASE_JWT_SECRET=... (JWT secret)
POSTGRES_URL_NON_POOLING=postgresql://... (direct connection)
POSTGRES_URL=postgresql://... (pooled connection)
```

### Stripe (Payments):
```env
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_MODE=true or false
```

### AI Services:
```env
NOVITA_API_KEY=sk_... (image generation)
NEXT_PUBLIC_NOVITA_API_KEY=sk_... (client-side)
GROQ_API_KEY=gsk_... (chat AI)
```

### Other Services:
```env
GOOGLE_TRANSLATE_API_KEY=AIz... (translation)
CLOUDINARY_CLOUD_NAME=... (legacy, optional)
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Application:
```env
NEXT_PUBLIC_SITE_NAME=dintyp.se
NEXT_PUBLIC_SITE_URL=https://ccandyat.vercel.app/
ADMIN_SETUP_KEY=code2025
```

---

## 📊 TIME ESTIMATES

| Task | Duration | Priority |
|------|----------|----------|
| Database migration | 2-5 min | ⭐ CRITICAL |
| Token packages setup | 30 sec | ⭐ CRITICAL |
| Admin user setup | 1 min | ⭐ CRITICAL |
| Storage bucket verification | 2 min | ⭐ CRITICAL |
| Attribute image generation | 30-60 min | ⚠️ HIGH |
| Sample character generation | 10-30 min | ✅ OPTIONAL |
| CMS content population | 10-20 min | ✅ OPTIONAL |
| Testing & verification | 10-15 min | ⭐ CRITICAL |
| **TOTAL (minimum)** | **~10-15 min** | Without images |
| **TOTAL (complete)** | **~60-90 min** | With all images |

---

## 🆘 COMMON ISSUES & SOLUTIONS

### Issue: Storage buckets not created
**Solution**: Run `setup_create_character_db.sql` manually

### Issue: Character creation fails "No attribute images"
**Solution**: Run `node scripts/pregenerate-attribute-images.js`

### Issue: Admin dashboard not accessible
**Solution**: Run `node add-admin-user.js` and sign in again

### Issue: Token packages missing
**Solution**: Run `node scripts/setup-sek-packages.js`

### Issue: Payment fails
**Solution**: Configure Stripe keys in `/admin/settings/integrations`

### Issue: Migration fails midway
**Solution**: Check error, fix migration file, re-run (safe, uses transactions)

### Issue: Images not uploading
**Solution**: Check storage bucket policies, verify service role key

---

## ✅ POST-MIGRATION VERIFICATION CHECKLIST

### Database:
- [ ] 27 tables exist
- [ ] Token packages populated (4 packages)
- [ ] Admin user exists
- [ ] Functions created (is_admin, log_token_cost, etc.)

### Storage:
- [ ] `images` bucket exists and is public
- [ ] `attributes` bucket exists and is public
- [ ] `media-library` bucket exists and is public
- [ ] Storage policies configured

### Application:
- [ ] App starts without errors
- [ ] Can sign up new user
- [ ] Can login existing user
- [ ] Dashboard loads
- [ ] Admin dashboard accessible (if admin)

### Features:
- [ ] Character creation works
- [ ] Attribute images show (if pregenerated)
- [ ] Token balance shows correctly
- [ ] Can purchase tokens (test mode)
- [ ] Payment webhook works
- [ ] Admin can ban/unban users

---

## 🎉 SUCCESS CRITERIA

Your client's database is ready when:

1. ✅ All 27 tables created
2. ✅ All 3 storage buckets exist
3. ✅ Token packages populated (SEK pricing)
4. ✅ Admin user created
5. ✅ App connects successfully
6. ✅ Users can sign up/login
7. ✅ Character creation works
8. ✅ Payments process correctly
9. ✅ Admin dashboard functional
10. ✅ SEK currency shows throughout UI

---

## �� NEXT STEPS AFTER MIGRATION

1. **Configure Stripe Webhook** (Production)
   - Add webhook endpoint in Stripe Dashboard
   - URL: `https://yourdomain.com/api/stripe-webhook`
   - Events: checkout.session.completed, payment_intent.*

2. **Populate CMS Content**
   - Add FAQs via admin dashboard
   - Update footer content
   - Create initial blog posts
   - Add email templates

3. **Generate Sample Characters** (Optional)
   - Run regenerate-characters.js
   - Creates demo characters for users

4. **Test Everything**
   - Test payment flow end-to-end
   - Test character creation
   - Test admin functions
   - Test user restrictions

5. **Go Live**
   - Switch to live Stripe keys
   - Update environment variables
   - Monitor logs & errors
   - Track costs via admin dashboard

---

**Document Created**: November 13, 2025
**Total System Components**: 27 tables + 3 buckets + 65 migrations + 40+ scripts
**Estimated Setup Time**: 10-90 minutes depending on options
