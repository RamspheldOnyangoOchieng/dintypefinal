# 🚀 BUDGET MONITORING - QUICK SETUP

## **5-Minute Setup Guide**

### **Step 1: Run Database Migration** ⚙️

```bash
# In your terminal
cd /home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup

# Apply the migration to create cost_logs table
supabase migration up
```

Or manually run in Supabase SQL Editor:
```sql
-- Copy/paste contents of:
supabase/migrations/20250110_create_cost_logs.sql
```

---

### **Step 2: Verify Installation** ✅

Test the budget monitor API:

```bash
# Start your dev server
pnpm dev

# In another terminal, test the endpoint
curl http://localhost:3000/api/admin/budget-status
```

Expected response:
```json
{
  "budget": {
    "allowed": true,
    "current": {
      "messages": 0,
      "images": 0,
      "characters": 0,
      "apiCost": 0,
      "tokenRevenue": 0
    },
    "limits": {
      "apiCost": 100,
      "messages": 4000000,
      "images": 2500
    },
    "percentUsed": {
      "cost": 0,
      "messages": 0,
      "images": 0
    }
  }
}
```

---

### **Step 3: Access the Dashboard** 🎯

1. **Login as admin**
2. **Navigate to**: `http://localhost:3000/admin/dashboard/monitor`
3. **You should see**:
   - API Costs widget
   - Token Revenue widget
   - Messages counter
   - Images counter
   - Monthly projection
   - Cost breakdown

---

### **Step 4: Test Budget Enforcement** 🧪

**Option A: Lower the limit temporarily**

Edit `lib/budget-monitor.ts`:
```typescript
const MONTHLY_LIMITS = {
  apiCost: 0.01,  // Set very low for testing
  messages: 10,
  images: 1,
}
```

Then try:
1. Send a chat message → Should work
2. Send 10 more messages → Should get blocked
3. Check dashboard → Should show "SERVICE DISABLED" alert

**Option B: Mock data in cost_logs**

```sql
-- Insert test data
INSERT INTO cost_logs (action, tokens_used, api_cost, created_at)
VALUES 
  ('Chat message', 5, 0.000025, NOW()),
  ('Image generation', 10, 0.04, NOW()),
  ('Chat message', 5, 0.000025, NOW() - INTERVAL '1 day');
```

---

### **Step 5: Restore Production Limits** 🔧

Reset `lib/budget-monitor.ts` to production values:
```typescript
const MONTHLY_LIMITS = {
  apiCost: 100,       // $100/month
  messages: 4_000_000, // 4M messages
  images: 2500,        // 2.5K images
}
```

---

## **🎉 YOU'RE DONE!**

**What you can do now**:

✅ **View real-time costs**: `/admin/dashboard/monitor`
✅ **Check budget status**: API auto-enforces limits
✅ **Track profitability**: See token revenue vs API costs
✅ **Forecast spending**: Monthly projections
✅ **Prevent surprise bills**: Service auto-blocks at limit

---

## **💡 PRO TIPS**

### **Increase Budget Limit**:
```typescript
// lib/budget-monitor.ts
const MONTHLY_LIMITS = {
  apiCost: 500,  // Increase to $500/month
  ...
}
```

### **View Cost Logs Directly**:
```sql
-- In Supabase SQL Editor
SELECT * FROM cost_logs 
ORDER BY created_at DESC 
LIMIT 100;
```

### **Get Top Spending Users**:
```sql
SELECT 
  user_id,
  COUNT(*) as actions,
  SUM(api_cost) as total_cost
FROM cost_logs
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY user_id
ORDER BY total_cost DESC
LIMIT 10;
```

### **Reset Monthly Stats** (new month):
```sql
-- Cost logs automatically reset each month
-- Or manually delete if needed:
DELETE FROM cost_logs 
WHERE created_at < date_trunc('month', CURRENT_DATE);
```

---

## **🔍 TROUBLESHOOTING**

### **Dashboard shows $0.00**:
- ✅ Normal if no messages/images sent yet
- ✅ Send a test message to populate data

### **"Service disabled" error**:
- ⚠️ Monthly budget exceeded
- ✅ Increase limit in `lib/budget-monitor.ts`
- ✅ Or wait until next month

### **cost_logs table not found**:
- ❌ Migration not applied
- ✅ Run: `supabase migration up`
- ✅ Or manually run SQL migration

### **Costs not logging**:
- ⚠️ Check `logApiCost()` is called in endpoints
- ✅ Verify `cost_logs` table exists
- ✅ Check browser console for errors

---

## **📊 WHAT GETS TRACKED**

### **Chat Messages**:
- ✅ User tokens charged: **5 tokens**
- ✅ Actual API cost: **~$0.000025**
- ✅ Logged in: `cost_logs` table

### **Image Generation**:
- ✅ User tokens charged: **5-10 tokens**
- ✅ Actual API cost: **$0.003-$0.04**
- ✅ Logged in: `cost_logs` table

### **Character Creation**:
- ✅ User tokens charged: **2 tokens**
- ✅ Actual API cost: **$0.00** (Groq is free!)
- ✅ Logged in: `cost_logs` table

---

## **🎯 NEXT STEPS**

1. ✅ **Monitor for 1 week** - See actual usage patterns
2. ✅ **Adjust limits** - Based on real data
3. ✅ **Set up alerts** - Email notifications at 80%
4. ✅ **Optimize costs** - Switch to cheaper models if needed

---

**Need help?** Check `BUDGET_MONITORING_COMPLETE.md` for full documentation.
