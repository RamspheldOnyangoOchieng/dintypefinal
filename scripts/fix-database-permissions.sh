#!/bin/bash

# Quick script to apply the attribute_images RLS fix

echo "🔧 Applying attribute_images RLS fix to Supabase..."
echo ""

# Read the SQL file
SQL_FILE="supabase/diagnostics/fix_attribute_images_rls.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found: $SQL_FILE"
    exit 1
fi

echo "📄 SQL file found: $SQL_FILE"
echo ""
echo "🎯 OPTION 1: Apply via Supabase Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
echo "2. Click 'New Query'"
echo "3. Copy the contents of: $SQL_FILE"
echo "4. Paste into the SQL editor"
echo "5. Click 'Run'"
echo ""

echo "🎯 OPTION 2: Apply via Command Line (if psql installed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "psql postgresql://postgres:[YOUR-PASSWORD]@db.qfjptqdkthmejxpwbmvq.supabase.co:5432/postgres -f $SQL_FILE"
echo ""

echo "🎯 OPTION 3: Use the execute-sql API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "This will apply the SQL via your existing /api/execute-sql endpoint:"
echo ""

read -p "Apply via API? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Load environment
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Read SQL file
    SQL_CONTENT=$(cat "$SQL_FILE")
    
    # Call API
    echo "📡 Sending SQL to /api/execute-sql..."
    
    curl -X POST "http://localhost:3000/api/execute-sql" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}" \
        2>/dev/null | jq .
    
    echo ""
    echo "✅ SQL executed via API"
else
    echo "⏭️  Skipped API execution"
    echo ""
    echo "📋 Manual steps:"
    echo "1. Copy the SQL from: $SQL_FILE"
    echo "2. Run it in Supabase SQL Editor"
fi

echo ""
echo "🎉 After applying the SQL, re-run the image generation script:"
echo "   node scripts/generate-all-character-images.js"
