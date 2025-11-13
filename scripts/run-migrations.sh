#!/bin/bash

# Migration Runner Script
# Purpose: Apply all pending database migrations to Supabase
# Created: 2025-11-09

set -e  # Exit on error

echo "🚀 Starting database migrations..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: supabase/migrations directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

echo "📁 Found migration directory: supabase/migrations"
echo ""

# List new migrations
echo "📝 New migrations to apply:"
echo "  1. 20251109120000_create_admin_users_table.sql"
echo "  2. 20251109120001_create_banned_users_table.sql"
echo "  3. 20251109120002_create_cost_logs_table.sql"
echo "  4. 20251109120003_create_payment_disputes_table.sql"
echo ""

# Confirm before proceeding
read -p "Do you want to apply these migrations? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔄 Applying migrations..."
echo ""

# Apply migrations using Supabase CLI
supabase db push

echo ""
echo "✅ All migrations applied successfully!"
echo ""
echo "📊 New tables created:"
echo "  ✓ admin_users - Track admin privileges"
echo "  ✓ banned_users - Track banned users"
echo "  ✓ cost_logs - Track token usage costs"
echo "  ✓ payment_disputes - Track refunds and disputes"
echo ""
echo "🔧 New functions created:"
echo "  ✓ is_admin(user_uuid) - Check if user is admin"
echo "  ✓ is_user_banned(user_uuid) - Check if user is banned"
echo "  ✓ log_token_cost(...) - Log token usage"
echo "  ✓ get_user_total_cost(user_id) - Get total user costs"
echo "  ✓ get_cost_breakdown(...) - Get cost analytics"
echo "  ✓ create_refund_dispute(...) - Create refund record"
echo "  ✓ get_dispute_stats(...) - Get dispute statistics"
echo ""
echo "🎉 Database is now ready with all admin features!"
echo ""
echo "Next steps:"
echo "  1. Verify tables in Supabase Dashboard"
echo "  2. Add your first admin user (see instructions below)"
echo "  3. Test admin features at /admin/dashboard"
echo ""
echo "To add your first admin user, run this SQL in Supabase:"
echo "  INSERT INTO admin_users (user_id)"
echo "  VALUES ('your-user-uuid');"
echo ""
