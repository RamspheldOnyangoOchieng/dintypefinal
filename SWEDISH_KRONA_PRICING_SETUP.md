# Swedish Krona (SEK) Pricing Implementation

## Date: November 10, 2025

---

## 💰 TOKEN PACKAGES - SWEDISH KRONA PRICING

### Pay-as-you-go Token Bundles:

| Package | Tokens | Images* | Price (SEK) | Price (EUR)** |
|---------|--------|---------|-------------|---------------|
| **Small** | 200 | ~40 | **99 kr** | ~€9.99 |
| **Medium** | 550 | ~110 | **249 kr** | ~€24.99 |
| **Large** | 1,550 | ~310 | **499 kr** | ~€49.99 |
| **Mega** | 5,800 | ~1,160 | **1,499 kr** | ~€149.99 |

*Based on 5 tokens per standard image  
**Approximate EUR equivalent at ~10 SEK/EUR exchange rate

---

## 📊 PREMIUM SUBSCRIPTION PRICING

### Monthly Subscription:
- **Price:** 119 SEK/month (€11/month)
- **Includes:** 100 tokens/month (~20 images)
- **Features:** Unlimited messages, 3 active companions, no watermarks, etc.

---

## 🔧 IMPLEMENTATION CHANGES

### 1. Database Migration
**File:** `supabase/migrations/20251110_update_token_packages_sek_pricing.sql`

**Changes:**
```sql
-- Update token package prices to SEK
UPDATE token_packages SET 
    price = 99 WHERE tokens = 200;    -- Was 9.99
UPDATE token_packages SET 
    price = 249 WHERE tokens = 550;   -- Was 24.99
UPDATE token_packages SET 
    price = 499 WHERE tokens = 1550;  -- Was 49.99
UPDATE token_packages SET 
    price = 1499 WHERE tokens = 5800; -- Was 149.99

-- Add currency field
ALTER TABLE token_packages ADD COLUMN currency VARCHAR(3) DEFAULT 'SEK';

-- Add display_price field
ALTER TABLE token_packages ADD COLUMN display_price VARCHAR(50);
UPDATE token_packages SET display_price = '99 kr' WHERE tokens = 200;
UPDATE token_packages SET display_price = '249 kr' WHERE tokens = 550;
UPDATE token_packages SET display_price = '499 kr' WHERE tokens = 1550;
UPDATE token_packages SET display_price = '1,499 kr' WHERE tokens = 5800;
```

### 2. Stripe Product Configuration

**Action Required:** Update Stripe products in Stripe Dashboard

**Products to Update:**

1. **Small Token Package**
   - Product ID: Create new or update existing
   - Price: 99.00 SEK
   - Currency: SEK
   - Description: 200 tokens (~40 images)

2. **Medium Token Package**
   - Product ID: Create new or update existing
   - Price: 249.00 SEK
   - Currency: SEK
   - Description: 550 tokens (~110 images)

3. **Large Token Package**
   - Product ID: Create new or update existing
   - Price: 499.00 SEK
   - Currency: SEK
   - Description: 1,550 tokens (~310 images)

4. **Mega Token Package**
   - Product ID: Create new or update existing
   - Price: 1,499.00 SEK
   - Currency: SEK
   - Description: 5,800 tokens (~1,160 images)

5. **Premium Subscription**
   - Product ID: Create new or update existing
   - Price: 119.00 SEK / month
   - Currency: SEK
   - Recurring: Monthly
   - Description: Premium membership with 100 tokens/month

---

## 🎯 STRIPE DASHBOARD SETUP

### Step 1: Create/Update Products

```bash
# Login to Stripe Dashboard
https://dashboard.stripe.com/

# Navigate to Products
Products > Add Product (or edit existing)

# For each token package:
1. Name: "Small Token Package" (or respective size)
2. Description: "200 tokens (~40 AI-generated images)"
3. Pricing:
   - One-time payment
   - Price: 99.00
   - Currency: SEK (Swedish Krona)
4. Save product
5. Copy Price ID for integration
```

### Step 2: Update Price IDs in Code

**File:** `app/api/create-checkout-session/route.ts` (or similar)

```typescript
const STRIPE_PRICE_IDS = {
  // Token packages (SEK)
  token_200: 'price_xxxxxxxxxxxxx',   // 99 kr
  token_550: 'price_xxxxxxxxxxxxx',   // 249 kr
  token_1550: 'price_xxxxxxxxxxxxx',  // 499 kr
  token_5800: 'price_xxxxxxxxxxxxx',  // 1,499 kr
  
  // Premium subscription (SEK)
  premium_monthly: 'price_xxxxxxxxxxxxx', // 119 kr/month
}
```

---

## 💳 PAYMENT INTEGRATION

### Currency Settings

**Stripe Checkout Session:**
```typescript
const session = await stripe.checkout.sessions.create({
  currency: 'sek', // Swedish Krona
  payment_method_types: ['card'],
  line_items: [{
    price: priceId, // Stripe Price ID for SEK pricing
    quantity: 1,
  }],
  // ...
})
```

**Supported Payment Methods for SEK:**
- Credit/Debit Cards (Visa, Mastercard, Amex)
- Swish (Swedish mobile payment - if enabled)
- Klarna (Swedish buy-now-pay-later - if enabled)

---

## 🌍 MULTI-CURRENCY CONSIDERATIONS

### Option 1: SEK Only (Recommended)
- Simple implementation
- No currency conversion issues
- Clear pricing for Swedish market
- **Current implementation**

### Option 2: Multi-Currency Support (Future)
If you want to support multiple currencies:

```typescript
// Detect user location/preference
const userCurrency = detectUserCurrency(); // 'SEK', 'EUR', 'USD', etc.

// Map to appropriate Stripe price IDs
const priceMapping = {
  'SEK': {
    token_200: 'price_sek_99',
    token_550: 'price_sek_249',
    // ...
  },
  'EUR': {
    token_200: 'price_eur_9_99',
    token_550: 'price_eur_24_99',
    // ...
  },
  'USD': {
    token_200: 'price_usd_10_99',
    token_550: 'price_usd_27_99',
    // ...
  }
}
```

---

## 🧮 PRICING STRATEGY ANALYSIS

### Token Value Per Krona

| Package | Price | Tokens | Kr/Token | Value |
|---------|-------|--------|----------|-------|
| Small | 99 kr | 200 | 0.495 kr | Baseline |
| Medium | 249 kr | 550 | 0.453 kr | **9% savings** |
| Large | 499 kr | 1,550 | 0.322 kr | **35% savings** |
| Mega | 1,499 kr | 5,800 | 0.258 kr | **48% savings** |

### Premium Subscription Value

**119 kr/month includes:**
- 100 tokens/month = 11.90 kr value at Small package rate
- Unlimited messages = priceless
- 3 active companions vs 1 = 3x value
- No watermarks = premium feature
- **Total value: ~400+ kr/month if purchased separately**

**ROI for user:** 236% value vs pay-as-you-go

---

## 📱 UI DISPLAY UPDATES

### Token Package Cards

**Before:**
```tsx
<div className="price">€9.99</div>
<div className="tokens">200 tokens</div>
```

**After:**
```tsx
<div className="price">99 kr</div>
<div className="tokens">200 tokens</div>
<div className="images">~40 images</div>
```

### Currency Formatting

```typescript
// Format Swedish Krona properly
const formatPrice = (amount: number, currency: string = 'SEK') => {
  if (currency === 'SEK') {
    // Swedish format: "99 kr" or "1 499 kr" (space as thousands separator)
    const formatted = new Intl.NumberFormat('sv-SE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    
    return `${formatted} kr`;
  }
  
  // Fallback for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Examples:
formatPrice(99, 'SEK')    // "99 kr"
formatPrice(1499, 'SEK')  // "1 499 kr"
formatPrice(249, 'SEK')   // "249 kr"
```

---

## ✅ DEPLOYMENT CHECKLIST

### Database:
- [ ] Run migration: `20251110_update_token_packages_sek_pricing.sql`
- [ ] Verify token_packages table updated
- [ ] Check currency field added
- [ ] Confirm display_price populated

### Stripe Dashboard:
- [ ] Create/update 4 token package products (SEK)
- [ ] Create/update Premium subscription (119 kr/month SEK)
- [ ] Copy all Price IDs
- [ ] Test in test mode first

### Code Updates:
- [ ] Update Stripe Price IDs in checkout code
- [ ] Update currency formatting functions
- [ ] Update UI to show "kr" instead of "€" or "$"
- [ ] Update any hardcoded prices in documentation

### Testing:
- [ ] Test Small package purchase (99 kr)
- [ ] Test Medium package purchase (249 kr)
- [ ] Test Large package purchase (499 kr)
- [ ] Test Mega package purchase (1,499 kr)
- [ ] Test Premium subscription (119 kr/month)
- [ ] Verify tokens credited correctly
- [ ] Test refunds work correctly

### Frontend:
- [ ] Update pricing page
- [ ] Update checkout flow
- [ ] Update success messages
- [ ] Update email templates with SEK prices
- [ ] Update invoice templates

---

## 🔄 CONVERSION RATES (Reference)

Current market rates (November 2025):
- 1 EUR ≈ 11.5 SEK
- 1 USD ≈ 10.5 SEK

**Pricing comparison:**
- €9.99 → 99 kr (better value: ~115 kr at market rate)
- €24.99 → 249 kr (better value: ~287 kr at market rate)
- €49.99 → 499 kr (better value: ~575 kr at market rate)
- €149.99 → 1,499 kr (better value: ~1,725 kr at market rate)

**Note:** Swedish pricing is more competitive than direct EUR conversion!

---

## 📊 EXPECTED OUTCOMES

### Customer Benefits:
- ✅ Lower effective prices than EUR conversion
- ✅ No currency conversion fees
- ✅ Familiar pricing in local currency
- ✅ Better value perception

### Business Benefits:
- ✅ Competitive Swedish market pricing
- ✅ Reduced cart abandonment
- ✅ Higher conversion rates
- ✅ Better Swedish market fit

---

## 🛠️ TECHNICAL NOTES

### Database Schema Changes:
```sql
-- New columns added to token_packages:
- currency VARCHAR(3) DEFAULT 'SEK'
- display_price VARCHAR(50) -- Formatted price like "99 kr"
```

### Stripe Integration:
- All prices must be created in Stripe Dashboard in SEK
- Checkout sessions must specify `currency: 'sek'`
- Webhooks will receive amounts in öre (1 kr = 100 öre)
- Example: 99 kr = 9900 öre in webhook data

### Invoice Display:
```typescript
// Webhook handling
if (event.data.object.currency === 'sek') {
  const amountInKr = event.data.object.amount / 100; // Convert öre to kr
  const displayAmount = `${amountInKr} kr`;
}
```

---

## 📞 SUPPORT REFERENCES

### Common Customer Questions:

**Q: Why Swedish Krona instead of EUR?**
A: We're based in Sweden and want to offer competitive local pricing without currency conversion fees.

**Q: Can I pay in EUR/USD?**
A: Currently we only accept SEK. This gives you better rates than currency conversion would.

**Q: Do tokens expire?**
A: No, purchased tokens never expire. Premium monthly tokens roll over if unused.

**Q: What if I cancel my subscription?**
A: Purchased tokens remain in your account. Monthly premium tokens are frozen but restore if you reactivate.

---

**Status:** Database migration ready, Stripe configuration required  
**Next Action:** Run migration and configure Stripe products in SEK
