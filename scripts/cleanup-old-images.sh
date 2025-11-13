#!/bin/bash

# Script to clean up old attribute images and prepare for regeneration

echo "🗑️  Cleaning up old attribute selection images..."

# Source environment variables
source .env

# Delete all records from attribute_images table
echo "📊 Deleting database records..."
psql "$POSTGRES_URL_NON_POOLING" -c "DELETE FROM attribute_images;"

echo "✅ Database cleaned!"

# Note: Storage files will be automatically overwritten by the x-upsert: true header
echo "📦 Storage files will be overwritten during regeneration"

echo ""
echo "✅ Cleanup complete! Ready to regenerate images."
echo "Run: node scripts/generate-selection-images.js"
