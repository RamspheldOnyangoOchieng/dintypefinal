# BACKEND COST ANALYSIS - YOUR ACTUAL API EXPENSES 💰

## **YOUR API PROVIDERS:**

### 1. **Novita AI** (Images + Chat)
- Image Generation: `https://api.novita.ai/v3/async/txt2img`
- Chat Completions: `https://api.novita.ai/openai/v1/chat/completions`
- Model: `meta-llama/llama-3.1-8b-instruct` (chat)

### 2. **Groq** (Character Descriptions)
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.1-70b-versatile`
- **COST: FREE** (generous free tier)

---

## **QUESTION 1: Text Message Costs**

### **Current Setup:**
- **API**: Novita AI
- **Model**: `meta-llama/llama-3.1-8b-instruct`
- **Max tokens**: 150 per response

### **Novita Pricing (2025):**
- **Llama 3.1 8B**: ~$0.10 per 1M input tokens, ~$0.10 per 1M output tokens
- Average message: ~100 input + 150 output tokens = 250 tokens total
- **Cost per message**: $0.10 × 250 / 1,000,000 = **$0.000025** (~0.0025 cents)

### **Your Token System:**
- Users pay: **5 tokens** per message
- Your cost: **$0.000025** per message
- **User token value**: 1 token ≈ $0.005 (based on 200 tokens = 99 SEK = ~$10)

### **ANSWER:**
- **Backend cost**: $0.000025 per message (~0.0025 cents)
- **User pays**: 5 tokens = $0.025 (2.5 cents)
- **Your profit margin**: **1000x markup** 🎉

---

## **QUESTION 2: NSFW Unblurred Image (Premium User)**

### **Current Setup:**
- **API**: Novita AI
- **Model**: Stability AI models or Flux-Pro
- **Settings**: 512x1024, 50 steps, NSFW enabled

### **Novita Pricing:**
- **Stability AI SD 1.5/2.1**: ~$0.003 per image
- **Flux-Pro**: ~$0.04 per image
- **SDXL models**: ~$0.01 per image

### **Your Token System:**
- Users pay: **5 tokens** (Stability) or **10 tokens** (Flux-Pro)
- Stability cost: $0.003
- Flux-Pro cost: $0.04

### **ANSWER:**
- **Stability AI**: $0.003 per image (users pay 5 tokens = $0.025)
  - **Profit margin**: 8x markup ✅
- **Flux-Pro**: $0.04 per image (users pay 10 tokens = $0.05)
  - **Profit margin**: 1.25x markup ⚠️

**RECOMMENDATION**: Increase Flux-Pro cost to 15 tokens for better margins

---

## **QUESTION 3: SFW Image (Same as NSFW)**

### **ANSWER:**
**Exactly the same cost as NSFW images!**

- NSFW vs SFW only affects content filtering, not API costs
- **Stability AI**: $0.003 per image
- **Flux-Pro**: $0.04 per image

The watermarking and blur filtering you implemented are done server-side (Sharp library) and add negligible CPU cost.

---

## **QUESTION 4: AI Girlfriend Profile Storage Cost**

### **Database Storage (Supabase):**

**Per Profile:**
```
Character data:
- name (50 bytes)
- age (4 bytes)
- occupation (100 bytes)
- description (500 bytes average)
- image_url (200 bytes)
- system_prompt (1000 bytes)
- metadata (500 bytes JSON)
= ~2.5 KB per profile

1,000 profiles = 2.5 MB
10,000 profiles = 25 MB
100,000 profiles = 250 MB
```

**Supabase Pricing:**
- Free tier: 500 MB database + 1 GB file storage
- Pro ($25/mo): 8 GB database + 100 GB file storage
- **Cost per profile**: Effectively **$0.000025** (negligible)

### **Image Storage:**
- If storing avatar images: ~100-500 KB per image
- Using Cloudinary/external URLs: **FREE** (just storing URL)
- Using Supabase Storage: ~$0.021 per GB/month
- **Cost per image**: ~$0.00001/month (negligible)

### **ANSWER:**
**Database + Metadata**: ~$0.000025 per profile (basically free)
**Image Storage**: $0.00001/month if hosting (or $0 if using URLs)

**Total storage cost**: Negligible until you have 100,000+ profiles

---

## **QUESTION 5: Hard Monthly Usage Caps**

### **Current State:**
❌ **NO HARD CAPS IMPLEMENTED**

You have:
- ✅ User token limits (they run out of tokens)
- ✅ Free plan limits (10 msg/day, 2 img/week)
- ❌ No backend spending limits

### **SOLUTION: Implement Backend Usage Caps**

#### **Option 1: Middleware Rate Limiting**
```typescript
// middleware.ts
const MONTHLY_API_BUDGET = 100 // $100 USD
const MONTHLY_MESSAGE_LIMIT = 4_000_000 // 4M messages = $100
const MONTHLY_IMAGE_LIMIT = 2500 // at Flux-Pro prices

export async function middleware(request: NextRequest) {
  const month = new Date().toISOString().slice(0, 7) // '2025-01'
  
  // Check current month's usage
  const usage = await getMonthlyUsage(month)
  
  if (usage.apiCost >= MONTHLY_API_BUDGET) {
    return new NextResponse('Monthly budget exceeded', { status: 429 })
  }
  
  if (usage.messages >= MONTHLY_MESSAGE_LIMIT) {
    return new NextResponse('Monthly message limit reached', { status: 429 })
  }
  
  if (usage.images >= MONTHLY_IMAGE_LIMIT) {
    return new NextResponse('Monthly image limit reached', { status: 429 })
  }
}
```

#### **Option 2: Supabase Function**
Create a monitoring function:
```sql
CREATE OR REPLACE FUNCTION check_monthly_budget()
RETURNS BOOLEAN AS $$
DECLARE
  monthly_spend DECIMAL;
  budget_limit DECIMAL := 100.00; -- $100
BEGIN
  SELECT COALESCE(SUM(api_cost), 0)
  INTO monthly_spend
  FROM cost_logs
  WHERE created_at >= date_trunc('month', CURRENT_DATE);
  
  RETURN monthly_spend < budget_limit;
END;
$$ LANGUAGE plpgsql;
```

#### **Option 3: API Monitoring Service**
Use external service to track API usage:
- **Helicone** (OpenAI monitoring) - Free tier available
- **Portkey** (Multi-provider monitoring)
- **LangSmith** (LangChain monitoring)

### **IMPLEMENTATION:**

I'll create a budget enforcement system for you:

**File**: `lib/budget-monitor.ts`
```typescript
import { createAdminClient } from './supabase-admin'

const MONTHLY_LIMITS = {
  apiCost: 100, // $100 USD
  messages: 4_000_000, // 4M messages
  images: 2500, // Flux-Pro equivalent
}

export async function checkMonthlyBudget(): Promise<{
  allowed: boolean
  current: { messages: number; images: number; apiCost: number }
  message?: string
}> {
  const supabase = await createAdminClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // Get current month's usage
  const { data: logs } = await supabase
    .from('cost_logs')
    .select('action, tokens_used, api_cost')
    .gte('created_at', monthStart.toISOString())

  const usage = {
    messages: logs?.filter(l => l.action.includes('message')).length || 0,
    images: logs?.filter(l => l.action.includes('image')).length || 0,
    apiCost: logs?.reduce((sum, l) => sum + (l.api_cost || 0), 0) || 0
  }

  if (usage.apiCost >= MONTHLY_LIMITS.apiCost) {
    return {
      allowed: false,
      current: usage,
      message: `Monthly budget limit reached ($${MONTHLY_LIMITS.apiCost}). Contact admin.`
    }
  }

  if (usage.messages >= MONTHLY_LIMITS.messages) {
    return {
      allowed: false,
      current: usage,
      message: `Monthly message limit reached (${MONTHLY_LIMITS.messages.toLocaleString()})`
    }
  }

  if (usage.images >= MONTHLY_LIMITS.images) {
    return {
      allowed: false,
      current: usage,
      message: `Monthly image limit reached (${MONTHLY_LIMITS.images})`
    }
  }

  return { allowed: true, current: usage }
}
```

**ANSWER:** ⚠️ Not currently implemented, but **I can add it now** (see implementation above)

---

## **QUESTION 6: Real-Time API Monitoring**

### **Current State:**
✅ **Basic monitoring exists** at `/admin/dashboard/costs`

**What you have:**
- Total costs view
- Costs by action type
- Costs by user (top 10)
- Token transaction history

**What you DON'T have:**
- ❌ Real-time API call tracking
- ❌ Per-API-provider cost breakdown
- ❌ Spending alerts
- ❌ Budget warnings
- ❌ Usage graphs/charts

### **SOLUTION: Enhanced Monitoring Dashboard**

I can create:

1. **Real-time cost tracker** (updates every 5 seconds)
2. **API provider breakdown** (Novita vs Groq usage)
3. **Budget alerts** (email when 80% of monthly budget used)
4. **Usage graphs** (daily/weekly/monthly trends)
5. **Cost projection** ("At this rate, you'll spend $X this month")

### **Quick Implementation:**

**Enhanced Admin Dashboard**: `/admin/dashboard/costs-monitor`

Features:
- Live cost counter (WebSocket)
- Monthly budget progress bar
- API call volume graphs
- Cost breakdown by:
  - Provider (Novita, Groq)
  - Action (messages, images, characters)
  - User (top spenders)
- Alerts when approaching limits

**ANSWER:** Basic monitoring exists, but **real-time monitoring NOT implemented**. I can add it now.

---

## **COST SUMMARY:**

### **Your Actual Costs (per action):**
| Action | API Cost | User Pays | Your Margin |
|--------|----------|-----------|-------------|
| **Text Message** | $0.000025 | 5 tokens ($0.025) | **1000x** ✅ |
| **Image (Stability)** | $0.003 | 5 tokens ($0.025) | **8x** ✅ |
| **Image (Flux-Pro)** | $0.04 | 10 tokens ($0.05) | **1.25x** ⚠️ |
| **Character Creation** | $0 (Groq free) | 2 tokens ($0.01) | **∞** ✅ |
| **Profile Storage** | $0.000025 | One-time 2 tokens | **400x** ✅ |

### **Monthly Projections:**

**Scenario 1: 100 active users**
- 10 messages/user/day = 30,000 msg/mo = **$0.75**
- 2 images/user/week = 800 images/mo = **$2.40** (Stability)
- **Total cost**: ~$3.15/month
- **User revenue**: ~$315 (if all pay) = **100x ROI**

**Scenario 2: 1,000 active users**
- 300,000 messages/mo = **$7.50**
- 8,000 images/mo = **$24**
- **Total cost**: ~$31.50/month
- **User revenue**: ~$3,150 = **100x ROI**

**Scenario 3: 10,000 active users**
- 3M messages/mo = **$75**
- 80,000 images/mo = **$240**
- **Total cost**: ~$315/month
- **User revenue**: ~$31,500 = **100x ROI**

### **Risk Factors:**
⚠️ **No hard spending caps** - Could get surprise bill
⚠️ **Flux-Pro margins thin** - Only 1.25x markup
✅ **Groq is FREE** - No character creation costs
✅ **Token system working** - Users pre-pay

---

## **RECOMMENDATIONS:**

### **Immediate Actions:**

1. ✅ **Increase Flux-Pro token cost** to 15 tokens (better margins)
2. ⚠️ **Implement monthly budget caps** (prevent surprise bills)
3. ⚠️ **Add real-time monitoring** (track API spend live)
4. ⚠️ **Set up cost alerts** (email at 80% budget)
5. ✅ **Continue using Groq** (it's free!)

### **Long-term Strategy:**

1. **Switch chat to Groq** instead of Novita
   - Currently using Novita: $0.000025/message
   - Groq is FREE: $0.00/message
   - **Savings**: 100% of message costs

2. **Use cheaper image models**
   - Stability AI ($0.003) instead of Flux-Pro ($0.04)
   - Or switch to Replicate (often cheaper)

3. **Implement caching**
   - Cache common prompts
   - Reuse similar image generations
   - Could save 20-30% on API costs

---

## **ANSWERS SUMMARY:**

1. **Text message cost**: $0.000025 (~0.0025 cents) - User pays $0.025 (5 tokens) = **1000x profit**
2. **NSFW image**: $0.003-$0.04 - User pays $0.025-$0.05 = **1.25x-8x profit**
3. **SFW image**: Same as NSFW ($0.003-$0.04)
4. **Profile storage**: $0.000025 (basically free)
5. **Monthly caps**: ❌ NOT implemented (I can add it)
6. **Real-time monitoring**: ✅ Basic exists, ❌ Real-time NOT implemented (I can add it)

**Your system is VERY profitable** with current pricing! 🎉

**Want me to implement the budget caps and real-time monitoring now?**
