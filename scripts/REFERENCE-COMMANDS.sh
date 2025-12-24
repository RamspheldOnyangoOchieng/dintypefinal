#!/bin/bash

# Commands to explore the reference create-character directory
# Run these commands in your terminal

echo "
╔════════════════════════════════════════════════════════════════╗
║  Exploration Commands for Reference Directory                  ║
╚════════════════════════════════════════════════════════════════╝
"

echo "📋 Copy and paste these commands one by one:"
echo ""
echo "# 1. Navigate to reference directory"
echo "cd '/home/ramspheld/Projects/Ramspheld/DINTYP.SE-2025-master(1)/DINTYP.SE-2025-master'"
echo ""

echo "# 2. List main directory structure"
echo "ls -la"
echo ""

echo "# 3. Find all create-character related files"
echo "find . -type f -path '*create-character*' -name '*.tsx' -o -path '*create-character*' -name '*.ts' | head -20"
echo ""

echo "# 4. List public/character creation directory"
echo "ls -lah 'public/character creation/'"
echo ""

echo "# 5. Find personality directories"
echo "find 'public/character creation' -type d -name '*personality*'"
echo ""

echo "# 6. Find relationship directories"  
echo "find 'public/character creation' -type d -name '*relationship*'"
echo ""

echo "# 7. Count personality images"
echo "find 'public/character creation' -type f -path '*personality*' | wc -l"
echo ""

echo "# 8. Count relationship images"
echo "find 'public/character creation' -type f -path '*relationship*' | wc -l"
echo ""

echo "# 9. Show personality image structure"
echo "tree -L 3 'public/character creation/personality' 2>/dev/null || find 'public/character creation' -path '*personality*' -type f | head -10"
echo ""

echo "# 10. Show relationship image structure"
echo "tree -L 3 'public/character creation/relationship' 2>/dev/null || find 'public/character creation' -path '*relationship*' -type f | head -10"
echo ""

echo "# 11. Copy personality images to backup project"
echo "cp -rv 'public/character creation/personality' '/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup/public/character creation/'"
echo ""

echo "# 12. Copy relationship images to backup project"
echo "cp -rv 'public/character creation/relationship' '/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup/public/character creation/'"
echo ""

echo "# 13. Copy entire character creation directory"
echo "cp -rv 'public/character creation' '/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup/public/'"
echo ""

echo "# 14. Compare create-character page.tsx files"
echo "diff 'app/create-character/page.tsx' '/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup/app/create-character/page.tsx' | head -50"
echo ""

echo "
╔════════════════════════════════════════════════════════════════╗
║  Quick Copy Command (All at once)                              ║
╚════════════════════════════════════════════════════════════════╝
"

echo "# Copy all character creation images in one command:"
echo "cd '/home/ramspheld/Projects/Ramspheld/DINTYP.SE-2025-master(1)/DINTYP.SE-2025-master' && cp -rv 'public/character creation' '/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup/public/' && echo '✅ Copy complete!'"
