#!/bin/bash

# Load environment variables
source .env

MIGRATION_FILE="supabase/migrations/20241109_add_image_url_column.sql"

echo "🚀 Running database migration..."
echo ""

# Read the SQL file
SQL=$(cat "$MIGRATION_FILE")

# Use curl to execute SQL via Supabase REST API
# Note: This uses the PostgREST API which may not support all SQL commands
# For full SQL support, use the Supabase dashboard SQL editor

echo "📋 Migration SQL ready. Choose your method:"
echo ""
echo "Option 1: Copy the SQL and paste it into Supabase SQL Editor"
echo "   URL: https://qfjptqdkthmejxpwbmvq.supabase.co/project/qfjptqdkthmejxpwbmvq/sql"
echo ""
echo "Option 2: View the SQL below and run manually"
echo ""
echo "================================================"
cat "$MIGRATION_FILE"
echo "================================================"
echo ""
echo "✅ Copy the SQL above and run it in your Supabase SQL Editor"
