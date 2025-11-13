# Character Creation Token Billing System

## Overview
Character creation in DINTYP now includes a token-based billing system, similar to image generation. This ensures fair usage and monetization of AI-powered features.

## Token Costs

### Character Creation: 2 Tokens
**What's Included:**
- AI-powered character description generation (GROQ API - llama-3.1-70b-versatile)
- Character data storage in database
- System prompt generation
- Character metadata processing

### Image Generation (Separate Cost)
**Before Character Creation:**
- **Stability AI Model**: 5 tokens per image
- **FLUX Model**: 10 tokens per image
- Multiple images multiply the cost (e.g., 3 images = 15 tokens for Stability)

### Total Cost for Full Character Creation
**Example with Stability AI (1 image):**
- Image Generation: 5 tokens
- Character Creation: 2 tokens
- **Total: 7 tokens**

**Example with FLUX (1 image):**
- Image Generation: 10 tokens
- Character Creation: 2 tokens
- **Total: 12 tokens**

## Implementation Details

### Backend: `/app/api/save-character/route.ts`

**Features:**
1. ✅ Token balance check before processing
2. ✅ Automatic token deduction (2 tokens)
3. ✅ Automatic refund on failure
4. ✅ Transaction logging with metadata
5. ✅ Detailed error responses

**Token Deduction Flow:**
```typescript
1. Check user token balance
   └─ If balance < 2 tokens → Return 402 error with details
   
2. Deduct 2 tokens
   └─ Record transaction: "Character creation: {name}"
   └─ Store metadata: character_name, operation type, included features
   
3. Process character creation
   ├─ Download/upload image to Supabase Storage
   ├─ Generate AI description via GROQ
   ├─ Build system prompt
   └─ Save to database
   
4. On Success:
   └─ Return character data + tokens_used
   
5. On Failure:
   └─ Automatic refund of 2 tokens
   └─ Log refund reason in transaction
```

**Error Handling:**
- **Insufficient Tokens (402)**: Returns current balance, required amount, detailed message
- **Database Error (500)**: Refunds tokens, returns error with refund confirmation
- **Unexpected Error (500)**: Emergency refund with error details

### Frontend: `/components/create-character-grouped.tsx`

**Features:**
1. ✅ Token cost display (2 tokens notification)
2. ✅ Insufficient token error handling
3. ✅ User-friendly error messages
4. ✅ Optional redirect to token purchase

**User Experience:**
```
1. User completes character attributes
2. Generates image (5-10 tokens deducted)
3. Enters character name
   └─ Sees "Cost: 2 tokens" notice
4. Clicks "Start Chat"
   ├─ If tokens available → Character created, redirects to chat
   └─ If insufficient → Alert with balance info + purchase suggestion
```

**Error Messages:**
- Clear indication of required vs available tokens
- Explanation of what the tokens cover
- Guidance to purchase more tokens

## Database Schema

### Tables Used

**user_tokens:**
```sql
- user_id: UUID (FK to auth.users)
- balance: INTEGER (current token count)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**token_transactions:**
```sql
- id: UUID
- user_id: UUID
- amount: INTEGER (negative for usage, positive for purchase/refund)
- type: TEXT ('usage', 'purchase', 'refund', 'bonus')
- description: TEXT (e.g., "Character creation: Alice")
- metadata: JSONB (detailed operation info)
- created_at: TIMESTAMP
```

### Transaction Metadata Example
```json
{
  "character_name": "Alice",
  "operation": "create_character",
  "includes": [
    "ai_description_generation",
    "character_storage"
  ]
}
```

### Refund Metadata Example
```json
{
  "character_name": "Alice",
  "error_message": "Database insertion failed",
  "refund_reason": "Database insertion failed"
}
```

## Token Costs Summary

| Action | Base Cost | Variables | Total Cost Range |
|--------|-----------|-----------|------------------|
| Image Gen (Stability) | 5 tokens | × number of images | 5-25 tokens |
| Image Gen (FLUX) | 10 tokens | × number of images | 10-50 tokens |
| Character Creation | 2 tokens | Fixed | 2 tokens |
| **Full Flow (Stability)** | **7 tokens** | **+4 per extra image** | **7-27 tokens** |
| **Full Flow (FLUX)** | **12 tokens** | **+9 per extra image** | **12-52 tokens** |

## API Response Examples

### Successful Creation
```json
{
  "success": true,
  "character": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Alice",
    "image_url": "https://supabase.co/storage/...",
    "description": "Alice is a vibrant young woman...",
    ...
  },
  "tokens_used": 2
}
```

### Insufficient Tokens
```json
{
  "success": false,
  "error": "Insufficient tokens",
  "details": "Character creation requires 2 tokens. Your current balance: 0 tokens",
  "required_tokens": 2,
  "current_balance": 0
}
```
**HTTP Status:** 402 Payment Required

### Failed with Refund
```json
{
  "success": false,
  "error": "Database insertion failed",
  "refunded": true
}
```
**HTTP Status:** 500 Internal Server Error

## Testing Checklist

### Test Cases
- [ ] User with sufficient tokens creates character successfully
- [ ] User with 0 tokens gets proper error message
- [ ] User with 1 token (insufficient) gets proper error message
- [ ] Character creation failure triggers refund
- [ ] Token transaction appears in user history
- [ ] Refund transaction appears with proper metadata
- [ ] Frontend displays token cost before creation
- [ ] Frontend handles 402 error gracefully
- [ ] Token balance updates immediately after creation
- [ ] Multiple character creations deduct correctly

### Database Verification
```sql
-- Check user token balance
SELECT balance FROM user_tokens WHERE user_id = 'USER_ID';

-- View token transaction history
SELECT * FROM token_transactions 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC;

-- Verify refunds
SELECT * FROM token_transactions 
WHERE type = 'refund' 
AND description LIKE '%character creation%';
```

## Future Enhancements

### Potential Features
1. **Tiered Pricing**: Different costs based on character complexity
2. **Bulk Discounts**: Reduced rate for creating multiple characters
3. **Premium Features**: Optional add-ons (voice, extended description) for extra tokens
4. **Token Packages**: Bundle character creation with image generation
5. **Free Trial**: 1-2 free character creations for new users
6. **Referral Bonus**: Extra tokens for referring friends

### Configuration Options
Consider making token costs configurable via admin settings:
```sql
CREATE TABLE feature_costs (
  feature_name TEXT PRIMARY KEY,
  token_cost INTEGER NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO feature_costs VALUES 
  ('character_creation', 2, 'Create a new AI character'),
  ('image_stability', 5, 'Generate image with Stability AI'),
  ('image_flux', 10, 'Generate image with FLUX model');
```

## Support & Troubleshooting

### Common Issues

**"Failed to deduct tokens"**
- Check if user_tokens record exists for the user
- Verify Supabase admin client is initialized
- Check database RLS policies

**"Token refund failed"**
- Check token_transactions insert permissions
- Verify user_id is valid
- Check server logs for detailed error

**"Tokens deducted but character not created"**
- Automatic refund should have occurred
- Check token_transactions for refund record
- If refund failed, manually add tokens via admin panel

### Monitoring
```typescript
// Log all token operations
console.log(`💰 Token cost: ${cost} tokens`);
console.log(`💳 Deducting tokens for user ${userId}...`);
console.log(`✅ Successfully deducted ${cost} tokens`);
console.log(`🔄 Refunding ${cost} tokens...`);
```

## Conclusion

The character creation token billing system provides:
- ✅ Fair usage tracking
- ✅ Automatic error handling with refunds
- ✅ Clear cost transparency for users
- ✅ Detailed transaction logging
- ✅ Seamless integration with existing image generation billing

This system ensures sustainable operation while providing users with a clear understanding of costs before they commit to creating a character.
