# Premium & Token System - Complete Flow

## Overview
Your premium and token system now works end-to-end with proper tracking and display.

## Key Changes Made

### 1. Fixed Premium Status Detection
**File**: `app/api/check-premium-status/route.ts`
- Now correctly queries the `premium_profiles` table (source of truth)
- Checks if premium hasn't expired
- Returns both `isPremium` status AND `tokenBalance`
- Syncs status with `profiles.is_premium` column
- Implements caching (1 minute) for performance

### 2. Updated Stripe Webhook  
**File**: `app/api/stripe-webhook/route.ts`
- **Premium Purchase**: Creates entry in `premium_profiles` + grants 100 bonus tokens
- **Token Purchase**: Adds tokens to `user_tokens` table
- All transactions are logged in `token_transactions` table
- Sends confirmation emails with purchase details

### 3. Enhanced Premium Page
**File**: `app/premium/page.tsx`
- **Status Display**: Shows Premium badge + Token balance at top
- **Conditional UI**: 
  - Non-premium users see "Become Premium" button
  - Premium users see "You are Premium!" badge
  - Token purchase section only visible to premium users
- **Real-time Balance**: Displays current token count

## Complete Purchase Flow

### Becoming Premium

1. User clicks "Bli Premium Nu" button
2. Redirected to Stripe checkout (110 SEK)
3. **After successful payment**:
   - Stripe webhook fires
   - Entry created in `premium_profiles` (expires in 1 month)
   - 100 bonus tokens added to `user_tokens`
   - Transaction logged in `token_transactions`
   - User redirected to success page
4. **On premium page refresh**:
   - `check-premium-status` API detects active premium
   - Shows premium badge + 100 token balance
   - Token purchase section becomes available

### Buying Tokens (Premium Users Only)

1. Premium user selects token package (e.g., 200 tokens for 99 kr)
2. Clicks "Gå till betalning"
3. **After successful payment**:
   - Webhook adds purchased tokens to balance
   - Transaction logged
   - New balance displayed
4. **Example**: Had 100 tokens → Buy 200 → Now have 300 tokens

## Database Tables

### `premium_profiles`
```sql
user_id (uuid, primary key)
expires_at (timestamptz)
plan_id (text)
created_at, updated_at
```

### `user_tokens`
```sql
user_id (uuid, primary key)
balance (integer)
updated_at
```

### `token_transactions`
```sql
id (uuid, primary key)
user_id (uuid)
amount (integer) -- positive for additions, negative for deductions
type (text) -- 'purchase', 'bonus', 'usage', 'refund'
description (text)
created_at
```

## Token Usage Flow (Future)

When user performs an action (e.g., sends message, generates image):

1. Check `user_tokens.balance` >= cost
2. If yes:
   - Deduct tokens: `UPDATE user_tokens SET balance = balance - cost`
   - Log transaction: `INSERT INTO token_transactions (amount: -cost, type: 'usage')`
3. If no: Show "Insufficient tokens" message

## Prices & Costs

### Premium Subscription
- **Price**: 11 EUR / 110 SEK per month
- **Bonus**: 100 free tokens
- **Benefits**: Unlimited features + ability to buy tokens

### Token Packages (Premium Only)
- 200 tokens: 9.99 EUR / 99 kr
- 550 tokens: 24.99 EUR / 249 kr
- 1,550 tokens: 49.99 EUR / 499 kr
- 5,800 tokens: 149.99 EUR / 1,499 kr

### Token Costs
- Text message: 5 tokens
- Create AI girlfriend: 2 tokens
- Create image: 5-10 tokens (Stability: 5, Flux: 10)

## Testing Checklist

✅ **Premium Purchase**:
1. Buy premium subscription
2. Check webhook logs for "✅ Created premium profile"
3. Check webhook logs for "✅ Granted 100 bonus tokens"
4. Refresh `/premium` page → See premium badge + 100 tokens

✅ **Token Purchase** (requires premium first):
1. Become premium (see above)
2. Select token package
3. Complete payment
4. Check webhook logs for "✅ Added [X] tokens"
5. Refresh page → See increased balance

✅ **Token Usage** (implement this next):
- Deduct tokens on actions
- Display updated balance immediately
- Log all transactions

## Next Steps

To complete the system, implement token deduction in:
- Chat message sending
- Character creation
- Image generation

Example implementation:
```typescript
// Before action
const { data: tokens } = await supabase
  .from('user_tokens')
  .select('balance')
  .eq('user_id', userId)
  .single()

if (tokens.balance < COST) {
  throw new Error('Insufficient tokens')
}

// Perform action...

// Deduct tokens
await supabase.rpc('deduct_tokens', { 
  user_id: userId, 
  amount: COST,
  description: 'Action description'
})
```

## Troubleshooting

**Tokens not showing after purchase?**
- Check Stripe webhook logs in Vercel
- Verify webhook secret is correct
- Check `user_tokens` table in Supabase

**Premium status not updating?**
- Wait ~30 seconds for webhook to process
- Clear cache: wait 1 minute and refresh
- Check `premium_profiles` table for entry

**Can't buy tokens?**
- Verify you have active premium (not expired)
- Check `check-premium-status` API response
