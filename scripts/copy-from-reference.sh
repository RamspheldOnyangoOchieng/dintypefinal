#!/bin/bash

# Script to copy files from reference directory
# This will copy the public/character creation directory structure

SOURCE="/home/ramspheld/Projects/Ramspheld/DINTYP.SE-2025-master(1)/DINTYP.SE-2025-master"
DEST="/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup"

echo "🔍 Checking source directory..."
if [ ! -d "$SOURCE" ]; then
    echo "❌ Source directory not found: $SOURCE"
    echo ""
    echo "Available directories in Projects/Ramspheld:"
    ls -la /home/ramspheld/Projects/Ramspheld/
    exit 1
fi

echo "✅ Source found: $SOURCE"
echo ""

echo "📂 Looking for character creation images..."
echo ""

# Find and list personality/relationship directories
echo "=== PERSONALITY DIRECTORIES ==="
find "$SOURCE" -type d -iname "*personality*" 2>/dev/null | head -10

echo ""
echo "=== RELATIONSHIP DIRECTORIES ==="
find "$SOURCE" -type d -iname "*relationship*" 2>/dev/null | head -10

echo ""
echo "=== CHARACTER CREATION DIRECTORIES ==="
find "$SOURCE" -type d -iname "*character*creation*" 2>/dev/null | head -10

echo ""
echo "📋 Would you like to copy these files? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Copying public/character creation directory..."
    
    if [ -d "$SOURCE/public" ]; then
        # Copy entire public directory
        cp -rv "$SOURCE/public/character creation" "$DEST/public/" 2>&1
        echo ""
        echo "✅ Copy complete!"
        echo ""
        echo "📊 Files copied:"
        find "$DEST/public/character creation" -type f | wc -l
    else
        echo "❌ Public directory not found in source"
    fi
else
    echo "❌ Copy cancelled"
fi

echo ""
echo "🔍 Searching for image-fetching code files..."
echo ""

# Search for files that might contain image fetching logic
echo "=== TypeScript/JavaScript files with 'personality' or 'relationship' ==="
find "$SOURCE" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -exec grep -l "personality\|relationship" {} \; 2>/dev/null | grep -E "(create|character|generate)" | head -20

echo ""
echo "✅ Script complete!"
