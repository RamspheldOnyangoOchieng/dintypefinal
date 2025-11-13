# 🔍 DEEP IMPLEMENTATION REVIEW
## dintyp.se - Complete Technical Architecture

**Generated**: 2025-01-19  
**Purpose**: Deep-dive into critical system implementations  
**Database Migration**: From `qfjptqdkthmejxpwbmvq` (dev) → `yrhexcjqwycfkjrmgplp` (client production)

---

## 📋 TABLE OF CONTENTS

1. [Authentication & Security](#authentication--security)
2. [Token Economy System](#token-economy-system)
3. [Payment Processing Flow](#payment-processing-flow)
4. [Character Creation Pipeline](#character-creation-pipeline)
5. [Image Generation System](#image-generation-system)
6. [Email Service Architecture](#email-service-architecture)
7. [Admin Access Control](#admin-access-control)
8. [Database Functions & Triggers](#database-functions--triggers)
9. [Row Level Security (RLS)](#row-level-security-rls)
10. [Cost Tracking & Analytics](#cost-tracking--analytics)
11. [Integration Configuration](#integration-configuration)
12. [API Rate Limiting & Restrictions](#api-rate-limiting--restrictions)

---

## 1️⃣ AUTHENTICATION & SECURITY

### Middleware Protection (`middleware.ts`)

**Purpose**: Edge middleware for route protection and admin verification

**Key Features**:
- Runs on every request (except static files)
- Lazy imports Supabase to avoid Edge runtime issues
- Debug mode via `?__mwdebug=1` query param or `NEXT_PUBLIC_MW_DEBUG=1` env
- Trace ID for request tracking (`x-trace-id` header)

**Admin Protection Flow**:
```typescript
1. Check if route starts with /admin
2. Verify session exists (redirect if no session)
3. Check admin_users table (primary method)
4. Fallback: Check profiles.is_admin column
5. Fallback: Check user_metadata.role === 'admin'
6. Allow access if any check passes
```

**Graceful Degradation**:
- If Supabase env vars missing → Skip auth checks
- If supabase-js import fails → Continue without enforcement
- If session fetch fails → Log error, continue
- Production behavior vs debug behavior (debug returns JSON errors)

**Configuration**:
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

---

## 2️⃣ TOKEN ECONOMY SYSTEM

### Token Costs

| Action | Token Cost | API |
|--------|-----------|-----|
| **Character Creation** | 8 tokens | GROQ (AI description) |
| **Image Generation (SD XL)** | 2 tokens | Novita AI |
| **Image Generation (Flux-Pro)** | 20 tokens | Novita AI |
| **Chat Message** | ~1 token (varies) | GROQ (future) |

### Token Deduction Flow

**File**: `/lib/token-management.ts`

```typescript
async function deductTokens(
  userId: string, 
  amount: number, 
  description: string,
  metadata?: any
): Promise<boolean>
```

**Process**:
1. Check current balance via `user_tokens.balance`
2. Return `false` if insufficient balance
3. Decrement balance atomically
4. Log transaction to `token_transactions` table
5. Log cost to `cost_logs` table
6. Return `true` on success

**Transaction Logging**:
```typescript
{
  user_id: UUID,
  amount: INTEGER,
  type: 'deduction' | 'purchase' | 'bonus' | 'refund',
  description: STRING,
  metadata: JSONB,
  created_at: TIMESTAMP
}
```

### Token Refund Flow

**File**: `/lib/token-management.ts`

```typescript
async function refundTokens(
  userId: string, 
  amount: number, 
  reason: string,
  metadata?: any
): Promise<boolean>
```

**Used When**:
- Image generation fails (Novita API error)
- Character creation fails mid-process
- Payment disputes resolved in user's favor

### Initial Token Grant

**File**: `/supabase/migrations/20250110_auto_create_user_tokens.sql`

**Trigger**: `on_auth_user_created_tokens`
- **Event**: After INSERT on `auth.users`
- **Action**: Create `user_tokens` record with 50 free tokens
- **Logging**: Inserts "Welcome bonus" transaction

```sql
CREATE FUNCTION create_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_tokens (user_id, balance)
  VALUES (NEW.id, 50)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO token_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 50, 'bonus', 'Welcome bonus - 50 free tokens');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Token Balance Enforcement

**Every API endpoint that costs tokens includes**:

```typescript
// 1. Ensure user has token record
const { ensureUserTokens } = await import('@/lib/ensure-user-tokens');
const balance = await ensureUserTokens(userId);

// 2. Check balance before action
if (balance < TOKEN_COST) {
  return NextResponse.json({
    error: 'Insufficient tokens',
    required: TOKEN_COST,
    current: balance
  }, { status: 402 }); // 402 Payment Required
}

// 3. Deduct tokens
const success = await deductTokens(userId, TOKEN_COST, description);
if (!success) {
  return NextResponse.json({ error: 'Token deduction failed' }, { status: 402 });
}
```

---

## 3️⃣ PAYMENT PROCESSING FLOW

### Stripe Webhook Handler

**File**: `/app/api/stripe-webhook/route.ts` (278 lines)

**Signature Verification**:
```typescript
const signature = request.headers.get('stripe-signature');
const webhookSecret = await getStripeWebhookSecret(); // DB-first, env fallback
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### Event Handlers

#### 1. `checkout.session.completed`

**Purpose**: Process successful Stripe checkout

**Flow**:
```typescript
1. Extract userId from session.metadata or client_reference_id
2. Calculate amount in SEK (session.amount_total / 100)
3. Determine purchase type:
   - Token purchase: metadata.tokens exists
   - Plan purchase: metadata.planId exists
   
4. Create payment_transactions record:
   - stripe_session_id
   - user_id
   - amount_sek
   - currency: 'sek'
   - status: 'completed'
   - metadata: full session object
   
5. If token purchase:
   - Add tokens to user_tokens.balance
   - Log to token_transactions (type: 'purchase')
   - Send payment confirmation email
   
6. If plan purchase:
   - Calculate expiration: NOW() + planDurationMonths
   - Create/update premium_profiles record
   - Send welcome email
   
7. Record revenue:
   - Insert into revenue_transactions
   - Fields: user_id, amount_sek, transaction_type, payment_intent_id
```

**SEK Currency Handling**:
```typescript
// Stripe stores amount in öre (smallest unit)
const fromStripeAmount = (oreAmount: number) => oreAmount / 100; // SEK
const formatSEK = (amount: number) => `${amount.toFixed(2)} SEK`;
```

#### 2. `payment_intent.succeeded`

**Purpose**: Confirm payment completion (backup verification)

**Action**: Update `payment_transactions.status = 'completed'`

#### 3. `payment_intent.payment_failed`

**Purpose**: Log failed payments

**Action**: Update `payment_transactions.status = 'failed'`

#### 4. `charge.refunded`

**Purpose**: Process refunds

**Flow**:
```typescript
1. Extract userId from charge.metadata
2. Calculate refund amount (charge.amount_refunded / 100)
3. Determine what was purchased:
   - If tokens: deduct from user_tokens.balance
   - If premium: delete premium_profiles record
   
4. Log negative revenue:
   - amount_sek: -refundAmount
   - transaction_type: 'refund'
   
5. Update payment_transactions.status = 'refunded'
```

**Token Deduction**:
```typescript
// Prevent negative balance
const newBalance = Math.max(0, currentBalance - tokenAmount);
await supabase
  .from('user_tokens')
  .update({ balance: newBalance })
  .eq('user_id', userId);
```

#### 5. `charge.dispute.created`

**Purpose**: Log payment disputes

**Action**: Insert into `payment_disputes` table
```typescript
{
  stripe_dispute_id,
  stripe_charge_id,
  user_id,
  amount,
  currency,
  reason,
  status: 'pending',
  dispute_type,
  evidence: JSON
}
```

### Premium Plan Activation

**Duration Mapping**:
```typescript
const planDurations = {
  'basic-monthly': 1,
  'basic-yearly': 12,
  'premium-monthly': 1,
  'premium-yearly': 12
};
```

**Expiration Calculation**:
```typescript
const expiresAt = new Date();
expiresAt.setMonth(expiresAt.getMonth() + planDurationMonths);
```

**Database Record**:
```typescript
await supabase.from('premium_profiles').upsert({
  user_id,
  plan_id: session.metadata.planId,
  status: 'active',
  expires_at: expiresAt.toISOString(),
  stripe_subscription_id: session.subscription,
  auto_renew: true
});
```

---

## 4️⃣ CHARACTER CREATION PIPELINE

### Complete Flow

**File**: `/app/api/save-character/route.ts` (345 lines)

**Step-by-Step Process**:

#### Step 1: Validation
```typescript
1. Verify userId from session
2. Validate characterName (required)
3. Validate imageUrl (required)
4. Validate characterDetails object
```

#### Step 2: Restriction Check

**Active Girlfriend Limit** (Free vs Premium):
```typescript
const { checkActiveGirlfriendLimit } = await import('@/lib/user-restrictions');
const activeCheck = await checkActiveGirlfriendLimit(userId);

if (!activeCheck.allowed) {
  return NextResponse.json({
    error: 'Active girlfriend limit reached',
    details: activeCheck.message,
    current_usage: activeCheck.currentUsage,
    limit: activeCheck.limit,
    upgrade_required: true
  }, { status: 403 });
}
```

**Free Plan**: Max 5 active characters  
**Premium Plan**: Unlimited characters

#### Step 3: Token Balance Check
```typescript
const { ensureUserTokens } = await import('@/lib/ensure-user-tokens');
const balance = await ensureUserTokens(userId);

if (balance < CHARACTER_CREATION_TOKEN_COST) { // 8 tokens
  return NextResponse.json({
    error: 'Insufficient tokens',
    required_tokens: 8,
    current_balance: balance
  }, { status: 402 });
}
```

#### Step 4: Token Deduction
```typescript
const deductionResult = await deductTokens(
  userId,
  8,
  `Character creation: ${characterName}`,
  {
    character_name: characterName,
    operation: 'create_character',
    includes: ['ai_description_generation', 'character_storage']
  }
);
```

#### Step 5: Image Upload to Supabase Storage

**Check if external URL**:
```typescript
if (imageUrl.includes('novita.ai') || !imageUrl.includes(supabaseUrl)) {
  permanentImageUrl = await uploadImageToSupabase(imageUrl);
}
```

**Upload Process**:
```typescript
async function uploadImageToSupabase(imageUrl: string): Promise<string> {
  // 1. Download image from external URL
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // 2. Generate unique filename
  const filename = `character-${Date.now()}-${Math.random().toString(36)}.jpg`;
  
  // 3. Upload to 'images' bucket
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });
  
  // 4. Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(filename);
  
  return publicUrlData.publicUrl;
}
```

#### Step 6: AI Description Generation

**GROQ API Call**:
```typescript
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const completion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content: `You are a creative writer specializing in character descriptions...`
    },
    {
      role: "user",
      content: `Create a detailed and engaging description for ${name}...`
    }
  ],
  temperature: 0.9, // High creativity
  max_tokens: 500
});

const description = completion.choices[0]?.message?.content || fallbackDescription;
```

**Fallback (if GROQ fails)**:
```typescript
const fallbackDescription = `${name} is a ${details.age} ${details.ethnicity} with ${details.hairColor} ${details.hairStyle} hair...`;
```

#### Step 7: System Prompt Generation

**Function**: `buildSystemPrompt(characterDetails, characterName)`

**Template**:
```typescript
`You are ${characterName}, a ${age} ${ethnicity} ${personality} character.

PERSONALITY:
${personalityTraits}

RELATIONSHIP:
${relationshipContext}

PHYSICAL APPEARANCE:
- Ethnicity: ${ethnicity}
- Age: ${age}
- Hair: ${hairColor} ${hairStyle} (${hairLength})
- Eyes: ${eyeColor} (${eyeShape})
- Body: ${bodyType}
- Lips: ${lipShape}

BEHAVIOR GUIDELINES:
- Stay in character at all times
- Respond based on your personality: ${personality}
- Acknowledge your relationship as: ${relationship}
- Be engaging and interactive
- Use emotive language
- Never break character

RESPONSE STYLE:
${personalitySpecificGuidelines}
`
```

#### Step 8: Database Insertion

```typescript
const { data, error } = await supabase
  .from('characters')
  .insert({
    user_id: userId,
    name: characterName,
    age: extractAge(characterDetails.age), // "20s" → 25
    image: permanentImageUrl,
    image_url: permanentImageUrl,
    description: description,
    system_prompt: systemPrompt,
    personality: characterDetails.personality,
    voice: 'default',
    is_public: false,
    share_revenue: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: characterDetails, // Full JSON
    ethnicity: characterDetails.ethnicity,
    relationship: characterDetails.relationship,
    body: characterDetails.bodyType,
    occupation: 'Student'
  })
  .select()
  .single();
```

#### Step 9: Error Handling & Refund

**If ANY step fails after token deduction**:
```typescript
catch (error) {
  if (tokensDeducted) {
    // Refund the 8 tokens
    await refundTokens(
      userId,
      CHARACTER_CREATION_TOKEN_COST,
      `Refund: Character creation failed - ${error.message}`,
      { 
        character_name: characterName,
        error: error.message,
        refund_reason: 'creation_failure'
      }
    );
  }
  
  return NextResponse.json({
    error: 'Character creation failed',
    details: error.message,
    tokens_refunded: tokensDeducted
  }, { status: 500 });
}
```

---

## 5️⃣ IMAGE GENERATION SYSTEM

### Novita AI Integration

**File**: `/app/api/generate-character-image/route.ts` (178 lines)

**Models Supported**:
```typescript
{
  'sd_xl': 'sd_xl_base_1.0.safetensors',
  'flux': 'flux_1_schnell_fp8.safetensors' // Premium only
}
```

**Token Costs**:
- SD XL: 2 tokens per image
- Flux-Pro: 20 tokens per image

### Image Generation Flow

#### Step 1: Build Prompt

**Realistic Style**:
```typescript
const prompt = `
Professional studio portrait photography of a beautiful ${ethnicity} woman, 
age ${age}, with ${hairColor} ${hairStyle} hair (${hairLength}), 
${eyeColor} ${eyeShape} eyes, ${lipShape} lips, ${bodyType} body type.
Personality: ${personality}. Relationship: ${relationship}.

Shot on Canon EOS R5, 85mm f/1.4 lens, soft studio lighting, 
bokeh background, high resolution 8K, sharp focus on face, 
professional color grading, magazine quality, ultra realistic skin texture.
`;
```

**Anime Style**:
```typescript
const prompt = `
Anime illustration of a beautiful ${ethnicity} woman, 
age ${age}, with ${hairColor} ${hairStyle} hair (${hairLength}), 
${eyeColor} ${eyeShape} eyes, ${lipShape} lips, ${bodyType} body type.
Personality: ${personality}. Relationship: ${relationship}.

High quality anime art style, detailed eyes, smooth shading, 
vibrant colors, manga-style illustration, studio quality, 
professional digital art, 4K resolution.
`;
```

#### Step 2: Build Negative Prompt (Female-Only Enforcement)

```typescript
const negativePrompt = `
male, man, boy, masculine, beard, mustache, facial hair, adam's apple,
penis, testicles, male genitalia, flat chest, masculine features,
ugly, deformed, blurry, low quality, watermark, text, logo, 
multiple people, crowd, NSFW, nude, naked, explicit content
`;
```

#### Step 3: Async Task Submission

**POST to Novita AI**:
```typescript
const requestBody = {
  extra: {
    response_image_type: "jpeg",
    enable_nsfw_detection: false
  },
  request: {
    prompt: prompt,
    model_name: "sd_xl_base_1.0.safetensors",
    negative_prompt: negativePrompt,
    width: 512,
    height: 768,
    image_num: 1,
    steps: 50,
    seed: -1,
    sampler_name: "DPM++ 2M Karras",
    guidance_scale: 7.5
  }
};

const response = await fetch("https://api.novita.ai/v3/async/txt2img", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${NOVITA_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(requestBody)
});

const { task_id } = await response.json();
```

#### Step 4: Polling for Completion

**Polling Configuration**:
- **Max Attempts**: 60
- **Interval**: 2 seconds
- **Total Timeout**: 120 seconds (2 minutes)

**Polling Loop**:
```typescript
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const progressResponse = await fetch(
    `https://api.novita.ai/v3/async/task-result?task_id=${task_id}`,
    {
      headers: { Authorization: `Bearer ${NOVITA_API_KEY}` }
    }
  );
  
  const progressData = await progressResponse.json();
  
  if (progressData.task.status === "TASK_STATUS_SUCCEED") {
    const imageUrl = progressData.images[0].image_url;
    return NextResponse.json({ success: true, imageUrl });
  }
  
  if (progressData.task.status === "TASK_STATUS_FAILED") {
    throw new Error("Image generation failed");
  }
  
  // Wait 2 seconds before next poll
  await new Promise(resolve => setTimeout(resolve, 2000));
}

throw new Error("Timeout: Image generation took too long");
```

#### Step 5: Error Handling & Refund

**If generation fails AFTER token deduction**:
```typescript
catch (error) {
  const refundResult = await refundTokens(
    userId,
    tokenCost,
    `Refund for failed image generation (${model})`,
    {
      original_request: { prompt, model },
      api_error: error.message,
      refund_reason: "API generation failure"
    }
  );
  
  return NextResponse.json({
    error: "Failed to generate image",
    details: "Image generation service is currently unavailable. Your tokens have been refunded.",
    refunded: true
  }, { status: 500 });
}
```

---

## 6️⃣ EMAIL SERVICE ARCHITECTURE

### Dual Provider Support

**File**: `/lib/email/service.ts` (187 lines)

**Supported Providers**:
1. **Resend** (Primary)
2. **SendGrid** (Fallback)

### Configuration Retrieval

**Database-First with Caching**:
```typescript
let emailConfigCache: {
  provider: 'resend' | 'sendgrid';
  apiKey: string;
  fromAddress: string;
  fromName: string;
} | null = null;

let emailConfigCacheTime = 0;
const EMAIL_CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getEmailConfig() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (emailConfigCache && now - emailConfigCacheTime < EMAIL_CONFIG_CACHE_TTL) {
    return emailConfigCache;
  }
  
  // Fetch from system_integrations table
  const { data } = await supabase
    .from('system_integrations')
    .select('key, value')
    .in('key', ['email_provider', 'email_api_key', 'email_from_address', 'email_from_name']);
  
  const config = {
    provider: data.find(r => r.key === 'email_provider')?.value || 'resend',
    apiKey: data.find(r => r.key === 'email_api_key')?.value || process.env.RESEND_API_KEY,
    fromAddress: data.find(r => r.key === 'email_from_address')?.value || 'noreply@dintyp.se',
    fromName: data.find(r => r.key === 'email_from_name')?.value || 'dintyp.se'
  };
  
  // Update cache
  emailConfigCache = config;
  emailConfigCacheTime = now;
  
  return config;
}
```

### Template System

**Database Templates** (Primary):
```typescript
async function getEmailTemplate(templateName: string) {
  const { data } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', templateName)
    .eq('is_active', true)
    .single();
  
  if (data) {
    return {
      subject: data.subject,
      html: data.html_content,
      text: data.text_content
    };
  }
  
  // Fallback to hardcoded templates
  return hardcodedTemplates[templateName];
}
```

**Hardcoded Templates** (Fallback):

File: `/lib/email/templates.ts` (301 lines)

```typescript
export const emailTemplates = {
  welcome: {
    subject: 'Välkommen till dintyp.se! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Välkommen {{username}}!</h1>
        <p>Tack för att du har registrerat dig på dintyp.se...</p>
        <div style="background: #f0f0f0; padding: 20px; border-radius: 8px;">
          <h2>Dina startpresent: 50 gratistokens! 🎁</h2>
          <p>Vi har lagt till 50 tokens på ditt konto...</p>
        </div>
      </div>
    `,
    text: 'Välkommen {{username}}! Tack för att du har registrerat dig...'
  },
  
  paymentConfirmation: {
    subject: 'Betalningsbekräftelse - {{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h1>Tack för ditt köp, {{username}}!</h1>
        <p>Beställning: {{orderNumber}}</p>
        <p>Belopp: {{amount}} SEK</p>
        <p>{{purchaseDetails}}</p>
      </div>
    `,
    text: 'Tack för ditt köp...'
  }
};
```

### Variable Substitution

```typescript
function substituteVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}
```

### Provider Implementation

#### Resend

```typescript
import { Resend } from 'resend';

async function sendViaResend(config, to, subject, html, text) {
  const resend = new Resend(config.apiKey);
  
  const { data, error } = await resend.emails.send({
    from: `${config.fromName} <${config.fromAddress}>`,
    to: [to],
    subject,
    html,
    text
  });
  
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  
  return data;
}
```

#### SendGrid

```typescript
import sgMail from '@sendgrid/mail';

async function sendViaSendGrid(config, to, subject, html, text) {
  sgMail.setApiKey(config.apiKey);
  
  const msg = {
    to,
    from: {
      email: config.fromAddress,
      name: config.fromName
    },
    subject,
    html,
    text
  };
  
  await sgMail.send(msg);
}
```

### Graceful Degradation

**If email service not configured**:
```typescript
try {
  const config = await getEmailConfig();
  
  if (!config.apiKey) {
    console.warn('Email service not configured, logging to console instead');
    console.log(`
      Would send email:
      To: ${to}
      Subject: ${subject}
      Content: ${html.substring(0, 100)}...
    `);
    return true; // Don't block the main flow
  }
  
  await sendEmail(config, to, subject, html, text);
  return true;
  
} catch (error) {
  console.error('Email sending failed:', error);
  return true; // Still return true to avoid blocking payment processing
}
```

### Helper Functions

```typescript
export async function sendWelcomeEmail(to: string, username: string) {
  const template = await getEmailTemplate('welcome');
  const html = substituteVariables(template.html, { username });
  const text = substituteVariables(template.text, { username });
  return await sendEmail(to, template.subject, html, text);
}

export async function sendPaymentConfirmation(
  to: string, 
  username: string, 
  orderDetails: { orderNumber: string; amount: number; purchaseDetails: string }
) {
  const template = await getEmailTemplate('paymentConfirmation');
  const variables = {
    username,
    orderNumber: orderDetails.orderNumber,
    amount: orderDetails.amount.toFixed(2),
    purchaseDetails: orderDetails.purchaseDetails
  };
  const html = substituteVariables(template.html, variables);
  return await sendEmail(to, template.subject, html);
}
```

---

## 7️⃣ ADMIN ACCESS CONTROL

### Admin User Table

**Migration**: `20251109120000_create_admin_users.sql`

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
```

### RLS Policies

```sql
-- Only admins can view admin_users table
CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

-- Only admins can add new admins
CREATE POLICY "Admins can insert admin_users"
  ON admin_users FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

-- Only admins can remove admin access
CREATE POLICY "Admins can delete admin_users"
  ON admin_users FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));
```

### Admin Functions

**File**: `/supabase/migrations/20251109120004_complete_all_migrations.sql`

```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
```

### Adding First Admin

**Script**: `/add-admin-user.js`

```javascript
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAdminUser(email) {
  // 1. Find user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found');
    return;
  }
  
  // 2. Check if already admin
  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (existing) {
    console.log('User is already an admin');
    return;
  }
  
  // 3. Add to admin_users
  const { error } = await supabase
    .from('admin_users')
    .insert({ user_id: user.id });
  
  if (error) {
    console.error('Failed to add admin:', error);
  } else {
    console.log('✅ Successfully added admin user');
  }
}

// Usage
addAdminUser(process.argv[2] || 'admin@example.com');
```

**Run**:
```bash
node add-admin-user.js your-email@example.com
```

---

## 8️⃣ DATABASE FUNCTIONS & TRIGGERS

### Cost Tracking Functions

```sql
-- Log token cost
CREATE OR REPLACE FUNCTION public.log_token_cost(
  p_user_id UUID,
  p_action_type TEXT,
  p_cost INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.cost_logs (user_id, action_type, cost, metadata)
  VALUES (p_user_id, p_action_type, p_cost, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's total cost
CREATE OR REPLACE FUNCTION public.get_user_total_cost(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(cost), 0) INTO v_total 
  FROM public.cost_logs 
  WHERE user_id = p_user_id;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get cost breakdown
CREATE OR REPLACE FUNCTION public.get_cost_breakdown(
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (action_type TEXT, total_cost BIGINT, usage_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.action_type, 
    SUM(cl.cost)::BIGINT, 
    COUNT(*)::BIGINT
  FROM public.cost_logs cl
  WHERE (p_user_id IS NULL OR cl.user_id = p_user_id)
    AND (p_start_date IS NULL OR cl.created_at >= p_start_date)
    AND (p_end_date IS NULL OR cl.created_at <= p_end_date)
  GROUP BY cl.action_type 
  ORDER BY SUM(cl.cost) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Updated_at Triggers

**Pattern used across all tables**:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Applied to**:
- characters
- payment_transactions
- premium_profiles
- email_templates
- system_integrations
- user_tokens
- token_packages

---

## 9️⃣ ROW LEVEL SECURITY (RLS)

### Pattern: User-Owned Resources

**Applied to**: characters, user_tokens, token_transactions, payment_transactions

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own records"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own records"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own records"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete own records"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);
```

### Pattern: Admin-Only Tables

**Applied to**: admin_users, banned_users, system_integrations, email_templates

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view table_name"
  ON table_name FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ));

-- Only admins can insert
CREATE POLICY "Admins can insert table_name"
  ON table_name FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ));

-- Only admins can update
CREATE POLICY "Admins can update table_name"
  ON table_name FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ));

-- Only admins can delete
CREATE POLICY "Admins can delete table_name"
  ON table_name FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ));
```

### Pattern: Service Role Bypass

**All tables include**:

```sql
-- Service role can bypass RLS for webhooks, migrations, etc.
CREATE POLICY "Service role can manage table_name"
  ON table_name FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Pattern: Public Read (Characters)

```sql
-- Anyone can view public characters
CREATE POLICY "Anyone can view public characters"
  ON characters FOR SELECT
  USING (is_public = true);

-- Users can view their own private characters
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);
```

### Pattern: Mixed Access (Payment Disputes)

```sql
-- Users can view their own disputes
CREATE POLICY "Users can view own payment_disputes"
  ON payment_disputes FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all disputes
CREATE POLICY "Admins can view all payment_disputes"
  ON payment_disputes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ));
```

---

## 🔟 COST TRACKING & ANALYTICS

### Cost Logs Table

**Schema**:
```sql
CREATE TABLE cost_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'character_creation', 'image_generation', 'chat_message'
  cost INTEGER NOT NULL, -- Token cost
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cost_logs_user_id ON cost_logs(user_id);
CREATE INDEX idx_cost_logs_action_type ON cost_logs(action_type);
CREATE INDEX idx_cost_logs_created_at ON cost_logs(created_at DESC);
```

### API Endpoint

**File**: `/app/api/track-cost/route.ts`

**POST** - Log a cost:
```typescript
POST /api/track-cost
{
  "userId": "uuid",
  "actionType": "character_creation",
  "cost": 8,
  "metadata": {
    "character_name": "Emma",
    "operation": "create_character"
  }
}
```

**GET** - Retrieve costs:
```typescript
GET /api/track-cost?userId=uuid&actionType=character_creation&startDate=2025-01-01&endDate=2025-01-31

Response:
{
  "success": true,
  "logs": [...],
  "totalCost": 240
}
```

### Analytics Queries

**Total cost per user**:
```sql
SELECT user_id, SUM(cost) as total_cost
FROM cost_logs
GROUP BY user_id
ORDER BY total_cost DESC;
```

**Cost breakdown by action**:
```sql
SELECT action_type, SUM(cost) as total_cost, COUNT(*) as usage_count
FROM cost_logs
WHERE user_id = 'uuid'
GROUP BY action_type
ORDER BY total_cost DESC;
```

**Daily cost trends**:
```sql
SELECT 
  DATE(created_at) as date,
  SUM(cost) as daily_cost,
  COUNT(*) as action_count
FROM cost_logs
WHERE user_id = 'uuid'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 1️⃣1️⃣ INTEGRATION CONFIGURATION

### System Integrations Table

**Purpose**: Store all third-party API keys and configuration in database

**Schema**:
```sql
CREATE TABLE system_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Configuration Keys

| Key | Value Example | Used For |
|-----|--------------|----------|
| `stripe_secret_key` | `sk_live_...` | Payment processing |
| `stripe_publishable_key` | `pk_live_...` | Client-side Stripe |
| `stripe_webhook_secret` | `whsec_...` | Webhook verification |
| `email_provider` | `resend` or `sendgrid` | Email service selection |
| `email_api_key` | API key | Email sending |
| `email_from_address` | `noreply@dintyp.se` | Sender address |
| `email_from_name` | `dintyp.se` | Sender name |
| `oauth_google_client_id` | Client ID | Google OAuth |
| `oauth_google_client_secret` | Secret | Google OAuth |
| `oauth_discord_client_id` | Client ID | Discord OAuth |
| `oauth_twitter_api_key` | API key | Twitter OAuth |

### Integration Config Service

**File**: `/lib/integration-config.ts`

**Features**:
- Database-first with environment variable fallback
- 5-minute cache (TTL)
- Admin cache clearing

**Cache Implementation**:
```typescript
let integrationCache: Map<string, string> = new Map();
let integrationCacheTime = 0;
const INTEGRATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getIntegrationValue(key: string): Promise<string | null> {
  const now = Date.now();
  
  // Check cache
  if (now - integrationCacheTime < INTEGRATION_CACHE_TTL && integrationCache.has(key)) {
    return integrationCache.get(key) || null;
  }
  
  // Refresh cache
  const { data } = await supabase
    .from('system_integrations')
    .select('key, value')
    .eq('is_active', true);
  
  integrationCache = new Map(data.map(r => [r.key, r.value]));
  integrationCacheTime = now;
  
  // Fallback to environment variables
  if (!integrationCache.has(key)) {
    const envValue = process.env[key.toUpperCase()];
    if (envValue) {
      integrationCache.set(key, envValue);
    }
  }
  
  return integrationCache.get(key) || null;
}

export function clearIntegrationCache() {
  integrationCache.clear();
  integrationCacheTime = 0;
}
```

**Helper Functions**:
```typescript
export async function getStripeSecretKey(): Promise<string> {
  return await getIntegrationValue('stripe_secret_key') || process.env.STRIPE_SECRET_KEY;
}

export async function getStripeWebhookSecret(): Promise<string> {
  return await getIntegrationValue('stripe_webhook_secret') || process.env.STRIPE_WEBHOOK_SECRET;
}

export async function getEmailConfig() {
  return {
    provider: await getIntegrationValue('email_provider') || 'resend',
    apiKey: await getIntegrationValue('email_api_key') || process.env.RESEND_API_KEY,
    fromAddress: await getIntegrationValue('email_from_address') || 'noreply@dintyp.se',
    fromName: await getIntegrationValue('email_from_name') || 'dintyp.se'
  };
}
```

**Benefits**:
- Admins can update API keys without redeployment
- Secure storage (RLS policies protect access)
- Easy rotation of secrets
- Fallback to .env for development

---

## 1️⃣2️⃣ API RATE LIMITING & RESTRICTIONS

### User Restrictions System

**File**: `/lib/user-restrictions.ts`

**Free Plan Limits**:
```typescript
const FREE_PLAN_LIMITS = {
  max_active_girlfriends: 5,
  max_characters_total: 10,
  max_messages_per_day: 100,
  max_image_generations_per_day: 10
};
```

**Premium Plan Limits**:
```typescript
const PREMIUM_PLAN_LIMITS = {
  max_active_girlfriends: Infinity,
  max_characters_total: Infinity,
  max_messages_per_day: Infinity,
  max_image_generations_per_day: Infinity
};
```

### Restriction Check Functions

#### Active Girlfriend Limit

**Function**: `checkActiveGirlfriendLimit(userId: string)`

```typescript
export async function checkActiveGirlfriendLimit(userId: string) {
  // 1. Check if user has premium
  const { data: premium } = await supabase
    .from('premium_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .single();
  
  const isPremium = !!premium;
  const limit = isPremium ? Infinity : FREE_PLAN_LIMITS.max_active_girlfriends;
  
  // 2. Count active characters
  const { count: activeCount } = await supabase
    .from('characters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deleted', false);
  
  const currentUsage = activeCount || 0;
  
  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    isPremium,
    message: currentUsage >= limit 
      ? `You have reached the maximum of ${limit} active characters on the free plan. Upgrade to premium for unlimited characters.`
      : `You have ${currentUsage}/${limit} active characters.`
  };
}
```

**Usage in API**:
```typescript
const activeCheck = await checkActiveGirlfriendLimit(userId);

if (!activeCheck.allowed) {
  return NextResponse.json({
    error: 'Active girlfriend limit reached',
    details: activeCheck.message,
    current_usage: activeCheck.currentUsage,
    limit: activeCheck.limit,
    upgrade_required: true
  }, { status: 403 }); // 403 Forbidden
}
```

#### Daily Message Limit

```typescript
export async function checkDailyMessageLimit(userId: string) {
  const isPremium = await checkPremiumStatus(userId);
  const limit = isPremium ? Infinity : FREE_PLAN_LIMITS.max_messages_per_day;
  
  const today = new Date().toISOString().split('T')[0];
  
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`);
  
  const currentUsage = count || 0;
  
  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    resetTime: `${today}T23:59:59Z`
  };
}
```

### Premium Status Check

```typescript
async function checkPremiumStatus(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('premium_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .single();
  
  return !!data;
}
```

---

## 📊 SUMMARY OF CRITICAL DEPENDENCIES

### External Services

| Service | Purpose | API Key Location | Fallback |
|---------|---------|------------------|----------|
| **Supabase** | Database + Auth + Storage | `.env` | None (critical) |
| **Stripe** | Payments | `system_integrations` or `.env` | None (critical) |
| **Novita AI** | Image generation | `.env` (NOVITA_API_KEY) | None (critical) |
| **GROQ** | AI descriptions | `.env` (GROQ_API_KEY) | Basic descriptions |
| **Resend** | Email sending | `system_integrations` or `.env` | Console logging |
| **SendGrid** | Email sending (alt) | `system_integrations` | Console logging |

### Database Tables (27 total)

**Core Tables**:
1. `auth.users` - Supabase auth
2. `characters` - User-created characters
3. `user_tokens` - Token balances
4. `token_transactions` - Token history
5. `token_packages` - Purchasable token bundles
6. `payment_transactions` - Payment records
7. `premium_profiles` - Premium subscriptions
8. `revenue_transactions` - Revenue tracking

**Admin Tables**:
9. `admin_users` - Admin access control
10. `banned_users` - Banned user tracking
11. `system_integrations` - API keys/config
12. `email_templates` - Email templates
13. `payment_disputes` - Stripe disputes

**Analytics Tables**:
14. `cost_logs` - Token usage analytics
15. `api_usage_logs` - API call tracking

**Content Tables**:
16. `attributes` - Character creation options
17. `attribute_images` - Attribute preview images
18. `conversation_sessions` - Chat sessions (future)
19. `messages` - Chat messages (future)

### Storage Buckets (3 total)

1. **images** - Character images (public read)
2. **attributes** - Attribute preview images (public read)
3. **media-library** - User uploads (authenticated)

### Database Functions (8 critical)

1. `create_user_tokens()` - Auto-create token balance on signup
2. `log_token_cost()` - Track token usage
3. `get_user_total_cost()` - Sum user's token costs
4. `get_cost_breakdown()` - Analytics breakdown
5. `is_admin()` - Check admin status
6. `is_user_banned()` - Check ban status
7. `update_updated_at_column()` - Auto-update timestamps
8. `update_email_templates_updated_at()` - Email template timestamps

### Triggers (10+ active)

- `on_auth_user_created_tokens` - Create tokens on signup
- `set_updated_at` - Auto-update timestamps on all major tables
- `email_templates_updated_at` - Email template updates

---

## 🎯 POST-MIGRATION REQUIREMENTS

### 1. Stripe Webhook Setup

**In Stripe Dashboard**:
1. Go to Developers → Webhooks
2. Add endpoint: `https://dintyp.se/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
4. Copy webhook signing secret
5. Add to `system_integrations` table:
```sql
INSERT INTO system_integrations (key, value, description)
VALUES ('stripe_webhook_secret', 'whsec_...', 'Stripe webhook signing secret');
```

### 2. Email Service Configuration

**Option A: Resend**
```sql
INSERT INTO system_integrations (key, value) VALUES
  ('email_provider', 'resend'),
  ('email_api_key', 're_...'),
  ('email_from_address', 'noreply@dintyp.se'),
  ('email_from_name', 'dintyp.se');
```

**Option B: SendGrid**
```sql
INSERT INTO system_integrations (key, value) VALUES
  ('email_provider', 'sendgrid'),
  ('email_api_key', 'SG...'),
  ('email_from_address', 'noreply@dintyp.se'),
  ('email_from_name', 'dintyp.se');
```

### 3. Token Packages Population

**Run**:
```bash
node scripts/setup-sek-packages.js
```

**Creates**:
- 100 tokens → 50 SEK
- 500 tokens → 200 SEK
- 1000 tokens → 350 SEK
- 5000 tokens → 1500 SEK

### 4. Storage Bucket Creation

**Check buckets exist**:
```bash
node scripts/check-storage-buckets.js
```

**If missing, create manually** (or via Supabase Dashboard):
```sql
-- SQL to create buckets (if needed)
SELECT storage.create_bucket('images', '{
  "public": true,
  "file_size_limit": 5242880,
  "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"]
}');

SELECT storage.create_bucket('attributes', '{
  "public": true,
  "file_size_limit": 2097152,
  "allowed_mime_types": ["image/jpeg", "image/png"]
}');

SELECT storage.create_bucket('media-library', '{
  "public": false,
  "file_size_limit": 10485760,
  "allowed_mime_types": ["image/jpeg", "image/png", "video/mp4"]
}');
```

### 5. Admin User Setup

**After first user signup**:
```bash
node add-admin-user.js your-email@example.com
```

### 6. Attribute Images Generation (Optional)

**Run**:
```bash
node scripts/generate-all-attribute-images.js
```

**Time**: 30-60 minutes  
**Cost**: ~500 tokens (Novita AI)

---

## ✅ VERIFICATION CHECKLIST

After migration, verify:

- [ ] User signup creates `user_tokens` record with 50 tokens
- [ ] Token deduction works (create character, generate image)
- [ ] Stripe webhook receives events
- [ ] Payment completion adds tokens
- [ ] Premium activation works
- [ ] Email sending works (welcome, payment confirmation)
- [ ] Admin dashboard accessible
- [ ] Character creation respects free plan limits (5 max)
- [ ] Image generation deducts tokens
- [ ] Refunds deduct tokens
- [ ] RLS policies prevent unauthorized access
- [ ] Cost tracking logs all actions
- [ ] Storage buckets accept uploads

---

## 🚨 TROUBLESHOOTING

### Tokens not created on signup
**Check**: Trigger `on_auth_user_created_tokens` exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_tokens';
```

### Stripe webhook failing
**Check**: Webhook secret matches
```sql
SELECT value FROM system_integrations WHERE key = 'stripe_webhook_secret';
```

### Email not sending
**Check**: Email config exists
```sql
SELECT key, value FROM system_integrations WHERE key LIKE 'email_%';
```

### Image generation failing
**Check**: Novita AI key valid
```bash
echo $NOVITA_API_KEY
```

### Admin access denied
**Check**: User in admin_users table
```sql
SELECT * FROM admin_users WHERE user_id = 'your-user-id';
```

### Character creation limit not enforced
**Check**: Premium status
```sql
SELECT * FROM premium_profiles WHERE user_id = 'user-id' AND status = 'active';
```

---

**End of Deep Implementation Review**

This document covers the complete technical architecture of dintyp.se. All critical systems have been reviewed and documented for the database migration from development to production.
