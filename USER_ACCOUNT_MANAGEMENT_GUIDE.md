# 🔐 User Account Management Guide

## 📊 Where User Accounts Are Stored

### **Database System: Supabase (PostgreSQL)**

Your application uses **Supabase** as the authentication and database system. Supabase is built on PostgreSQL and provides:

- **Authentication service** (auth.users table)
- **User profiles** (profiles table)
- **Row Level Security (RLS)** for data protection
- **Admin API** for user management

---

## 🗄️ Database Tables

### 1. **auth.users** (Supabase Auth)
**Location:** Managed by Supabase Auth service

**Contains:**
- User ID (UUID)
- Email address
- Encrypted password
- Email confirmation status
- Account creation date
- Last sign-in date
- Metadata

**Access:** Via Supabase Admin API using `SUPABASE_SERVICE_ROLE_KEY`

### 2. **profiles** (Custom User Data)
**Location:** Your PostgreSQL database

**Contains:**
- User ID (links to auth.users)
- Username
- Display preferences
- Custom user data

**File:** Check schema in `/lib/supabase-admin.ts` and `/types/supabase.ts`

### 3. **banned_users** (User Restrictions)
**Contains:**
- User ID
- Ban status (is_active)
- Banned until date
- Ban reason
- Banned at timestamp

---

## 🔧 Configuration Files

### **Environment Variables** (.env.local)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Admin access
```

### **Admin Client Setup**
**File:** `/lib/supabase-admin.ts`

```typescript
import { createClient } from "@supabase/supabase-js"

export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })
}
```

---

## ✅ Can You Manually Reset or Block a User Account?

### **YES! You have THREE ways:**

---

## 1️⃣ Admin Dashboard (UI Method) ⭐ EASIEST

### **Access the Admin Panel**

**URL:** `http://localhost:3000/admin/dashboard/users`

**Steps:**
1. Login as an admin user
2. Navigate to **Admin Dashboard**
3. Click **"Manage Users"** card
4. You'll see a table of all users

### **Available Actions:**

#### 🚫 **Ban/Block User**
**Location:** User row → More Actions (⋮) → Ban User

**API Endpoint:** `/app/api/admin/block-user/route.ts`

**Features:**
- **Temporary Ban:** 1 day, 7 days, 30 days
- **Permanent Ban:** Until 2099
- **Custom Reason:** Add why they were banned
- **Unban Option:** Remove ban anytime

**Example Usage:**
```typescript
// POST /api/admin/block-user
{
  "userId": "user-uuid",
  "action": "ban",
  "reason": "Violated terms of service",
  "duration": "7days"  // or "1day", "30days", "permanent"
}

// To unban
{
  "userId": "user-uuid",
  "action": "unban"
}
```

#### 🔑 **Reset Password**
**Location:** User row → More Actions (⋮) → Reset Password

**API Endpoint:** `/app/api/admin/reset-user-password/route.ts`

**What it does:**
- Sets a new password for the user
- User can login immediately with new password
- No email confirmation required

**Example Usage:**
```typescript
// POST /api/admin/reset-user-password
{
  "userId": "user-uuid",
  "newPassword": "NewSecurePassword123!"
}
```

#### 🗑️ **Delete User Account**
**Location:** User row → More Actions (⋮) → Delete User

**API Endpoint:** `/app/api/admin/delete-user/route.ts`

**What it does:**
- Permanently deletes user from `auth.users`
- Cascading deletes remove associated data:
  - Profile data
  - Characters created
  - Chat history
  - Token balances
  - Subscriptions

**⚠️ WARNING:** This action is **PERMANENT** and cannot be undone!

**Example Usage:**
```typescript
// POST /api/admin/delete-user
{
  "userId": "user-uuid"
}
```

---

## 2️⃣ Direct Database Access (SQL Method)

### **Via Supabase Dashboard**

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Run SQL commands

### **Common SQL Operations:**

#### **Ban a User**
```sql
-- Insert into banned_users table
INSERT INTO banned_users (user_id, banned_at, banned_until, reason, is_active)
VALUES (
  'user-uuid-here',
  NOW(),
  '2025-12-31T00:00:00Z',  -- Ban until date
  'Violated community guidelines',
  true
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  is_active = true,
  banned_until = '2025-12-31T00:00:00Z',
  reason = 'Violated community guidelines';
```

#### **Unban a User**
```sql
UPDATE banned_users
SET is_active = false
WHERE user_id = 'user-uuid-here';
```

#### **Reset User Password** (via Supabase Auth)
```sql
-- This must be done via the Supabase Auth Admin API
-- Use the admin dashboard or API endpoint
```

#### **Delete User Account**
```sql
-- First delete from auth.users (Supabase Auth)
-- This requires admin privileges

-- Use the pre-built function:
SELECT delete_user('user-uuid-here');

-- OR manually delete related data first:
DELETE FROM profiles WHERE id = 'user-uuid-here';
DELETE FROM characters WHERE user_id = 'user-uuid-here';
DELETE FROM messages WHERE user_id = 'user-uuid-here';
-- Then delete from auth (requires service role access)
```

#### **Check User Status**
```sql
-- Get user details
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  p.username,
  p.is_admin
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'user@example.com';

-- Check if user is banned
SELECT *
FROM banned_users
WHERE user_id = 'user-uuid-here'
  AND is_active = true;
```

#### **List All Users**
```sql
SELECT 
  u.id,
  u.email,
  p.username,
  p.is_admin,
  u.created_at,
  u.last_sign_in_at,
  b.is_active as is_banned,
  b.banned_until
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN banned_users b ON u.id = b.user_id AND b.is_active = true
ORDER BY u.created_at DESC;
```

---

## 3️⃣ API Method (Programmatic)

### **Using cURL or API Client**

You need the `SUPABASE_SERVICE_ROLE_KEY` for these requests.

#### **Ban User**
```bash
curl -X POST http://localhost:3000/api/admin/block-user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "action": "ban",
    "reason": "Spam",
    "duration": "7days"
  }'
```

#### **Reset Password**
```bash
curl -X POST http://localhost:3000/api/admin/reset-user-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "newPassword": "NewPassword123!"
  }'
```

#### **Delete User**
```bash
curl -X POST http://localhost:3000/api/admin/delete-user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid"
  }'
```

#### **Check Ban Status**
```bash
curl http://localhost:3000/api/admin/block-user?userId=user-uuid
```

---

## 🛡️ Security & Permissions

### **Who Can Manage Users?**

Only users with **admin privileges** can:
- View all users
- Ban/unban users
- Reset passwords
- Delete accounts

### **Admin Check (Code)**
```typescript
// In auth-context.tsx
const user = {
  id: "...",
  email: "...",
  isAdmin: true  // Must be true
}

// Database check
SELECT is_admin FROM profiles WHERE id = 'user-id';
```

### **How to Make a User Admin?**

**Option 1: Direct Database**
```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';
```

**Option 2: Admin Signup Page**
```
http://localhost:3000/admin/signup
```

---

## 📋 User Management Checklist

### ✅ **Block a Problematic User**
1. [ ] Go to `/admin/dashboard/users`
2. [ ] Search for the user by email or username
3. [ ] Click More Actions (⋮) → Ban User
4. [ ] Select duration (1 day, 7 days, 30 days, permanent)
5. [ ] Add reason (optional but recommended)
6. [ ] Click "Ban User"
7. [ ] User is immediately blocked from access

### ✅ **Reset a User's Password**
1. [ ] Go to `/admin/dashboard/users`
2. [ ] Find the user
3. [ ] Click More Actions (⋮) → Reset Password
4. [ ] Enter new password (min 6 characters)
5. [ ] Click "Reset Password"
6. [ ] Provide new password to user securely

### ✅ **Permanently Delete a User**
1. [ ] ⚠️ Confirm this is what you want (irreversible!)
2. [ ] Go to `/admin/dashboard/users`
3. [ ] Find the user
4. [ ] Click More Actions (⋮) → Delete User
5. [ ] Confirm deletion in dialog
6. [ ] User and all their data is permanently removed

---

## 🔍 Finding User Information

### **Search Methods in Admin Dashboard**

1. **By Email:** Type full or partial email
2. **By Username:** Type username
3. **Filter by Role:** Admin / Regular User / All
4. **Sort:** By creation date, last login, etc.

### **Database Query Examples**

**Find user by email:**
```sql
SELECT * FROM auth.users WHERE email = 'user@example.com';
```

**Find user by username:**
```sql
SELECT u.*, p.username 
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.username = 'johndoe';
```

**Find all banned users:**
```sql
SELECT u.email, p.username, b.reason, b.banned_until
FROM banned_users b
JOIN auth.users u ON b.user_id = u.id
LEFT JOIN profiles p ON u.id = p.id
WHERE b.is_active = true;
```

**Find users created in last 7 days:**
```sql
SELECT email, created_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 🚨 Troubleshooting

### **"Failed to ban user" Error**
**Possible causes:**
- `banned_users` table doesn't exist
- Missing admin permissions
- Invalid user ID

**Solution:**
```sql
-- Create banned_users table if missing
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_at TIMESTAMP DEFAULT NOW(),
  banned_until TIMESTAMP,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### **"Only administrators can delete users" Error**
**Solution:**
```sql
-- Make yourself admin
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

### **Can't Access Admin Dashboard**
**Check:**
1. Are you logged in?
2. Is your account marked as admin in the database?
3. Check browser console for errors

```sql
-- Verify admin status
SELECT email, is_admin FROM profiles
JOIN auth.users ON profiles.id = auth.users.id
WHERE auth.users.email = 'your@email.com';
```

---

## 📞 Quick Reference

| Task | Method | URL/Endpoint |
|------|--------|-------------|
| View All Users | Admin UI | `/admin/dashboard/users` |
| Ban User | Admin UI or API | `/api/admin/block-user` |
| Reset Password | Admin UI or API | `/api/admin/reset-user-password` |
| Delete User | Admin UI or API | `/api/admin/delete-user` |
| Check Ban Status | API | `/api/admin/block-user?userId=...` |
| Direct DB Access | Supabase | [app.supabase.com](https://app.supabase.com) |

---

## ✅ Summary

### **Where are accounts stored?**
✅ **Supabase PostgreSQL database**
- `auth.users` table (managed by Supabase Auth)
- `profiles` table (your custom user data)
- `banned_users` table (ban records)

### **Can you manually reset or block accounts?**
✅ **YES! Three ways:**

1. **Admin Dashboard UI** (easiest) → `/admin/dashboard/users`
2. **Direct SQL** via Supabase Dashboard
3. **API calls** using admin endpoints

### **What you can do:**
✅ Ban users (temporary or permanent)
✅ Unban users
✅ Reset passwords
✅ Delete accounts (permanent!)
✅ View user activity
✅ Filter and search users

---

**Last Updated:** November 10, 2025  
**Database:** Supabase (PostgreSQL)  
**Auth System:** Supabase Auth  
**Admin UI:** `/admin/dashboard/users`
