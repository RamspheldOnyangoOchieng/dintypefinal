#!/bin/bash

# Quick status check for image regeneration

echo "🔍 Image Regeneration Status"
echo "=============================="
echo ""

# Check if process is running
if pgrep -f "generate-selection-images.js" > /dev/null; then
    echo "✅ Process is RUNNING"
    PID=$(pgrep -f "generate-selection-images.js")
    echo "   PID: $PID"
else
    echo "❌ Process is NOT running"
fi

echo ""
echo "📊 Database Progress:"
source .env
COUNT=$(psql "$POSTGRES_URL_NON_POOLING" -t -c "SELECT COUNT(*) FROM attribute_images;")
echo "   Images in database: $COUNT / 246"

echo ""
echo "📈 Completion: $(echo "scale=1; $COUNT * 100 / 246" | bc)%"

echo ""
echo "📂 Latest images:"
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT category, value, style, LEFT(image_url, 80) as url FROM attribute_images ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "📝 Last 10 log lines:"
tail -10 image-regeneration.log

echo ""
echo "💡 Commands:"
echo "   Watch log: tail -f image-regeneration.log"
echo "   Full status: ./scripts/check-regeneration-status.sh"
echo "   Stop process: pkill -f generate-selection-images.js"
