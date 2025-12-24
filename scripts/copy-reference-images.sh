#!/bin/bash

# Script to copy existing images from reference directory
# Usage: ./scripts/copy-reference-images.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📸 Image Copy Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Source and destination directories
SOURCE_DIR="/home/ramspheld/Projects/Ramspheld/DINTYP.SE-2025-master(1)/DINTYP.SE-2025-master"
DEST_DIR="/home/ramspheld/Projects/Ramspheld/DINTYP-SE-2025-backup"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Source directory not found:${NC}"
    echo "   $SOURCE_DIR"
    echo ""
    echo -e "${YELLOW}💡 You may need to adjust the SOURCE_DIR variable in this script.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Source directory found${NC}"
echo ""

# Check if destination directory exists
if [ ! -d "$DEST_DIR" ]; then
    echo -e "${RED}❌ Destination directory not found:${NC}"
    echo "   $DEST_DIR"
    exit 1
fi

echo -e "${GREEN}✅ Destination directory found${NC}"
echo ""

# Function to copy directory with confirmation
copy_directory() {
    local source="$1"
    local dest="$2"
    local name="$3"
    
    echo -e "${BLUE}──────────────────────────────────────${NC}"
    echo -e "${YELLOW}📁 Copying: ${name}${NC}"
    echo -e "${BLUE}──────────────────────────────────────${NC}"
    
    if [ ! -d "$source" ]; then
        echo -e "${YELLOW}⚠️  Source not found: $source${NC}"
        echo ""
        return
    fi
    
    # Count files
    file_count=$(find "$source" -type f | wc -l)
    echo -e "   Files to copy: ${file_count}"
    echo -e "   From: $source"
    echo -e "   To:   $dest"
    echo ""
    
    # Ask for confirmation
    read -p "   Copy these files? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create destination directory if it doesn't exist
        mkdir -p "$(dirname "$dest")"
        
        # Copy files
        cp -r "$source" "$dest"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✅ Copied successfully!${NC}"
        else
            echo -e "${RED}   ❌ Copy failed!${NC}"
        fi
    else
        echo -e "${YELLOW}   ⏭️  Skipped${NC}"
    fi
    echo ""
}

# Main menu
echo -e "${BLUE}What would you like to copy?${NC}"
echo ""
echo "1. Character Creation images (all)"
echo "2. Personality images only"
echo "3. Relationship images only"
echo "4. Public directory (entire)"
echo "5. Custom path"
echo "6. Exit"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}📸 Copying all character creation images...${NC}"
        echo ""
        copy_directory \
            "$SOURCE_DIR/public/character creation" \
            "$DEST_DIR/public/character creation" \
            "Character Creation Images"
        ;;
    
    2)
        echo ""
        echo -e "${GREEN}📸 Copying personality images...${NC}"
        echo ""
        
        # Try multiple possible paths
        if [ -d "$SOURCE_DIR/public/character creation/personality" ]; then
            copy_directory \
                "$SOURCE_DIR/public/character creation/personality" \
                "$DEST_DIR/public/character creation/personality" \
                "Personality Images"
        else
            echo -e "${YELLOW}⚠️  Personality directory not found in expected location${NC}"
            echo -e "${YELLOW}   Searching for personality images...${NC}"
            echo ""
            
            find "$SOURCE_DIR" -type d -name "*personality*" | while read -r dir; do
                echo -e "   Found: $dir"
            done
        fi
        ;;
    
    3)
        echo ""
        echo -e "${GREEN}📸 Copying relationship images...${NC}"
        echo ""
        
        # Try multiple possible paths
        if [ -d "$SOURCE_DIR/public/character creation/relationship" ]; then
            copy_directory \
                "$SOURCE_DIR/public/character creation/relationship" \
                "$DEST_DIR/public/character creation/relationship" \
                "Relationship Images"
        else
            echo -e "${YELLOW}⚠️  Relationship directory not found in expected location${NC}"
            echo -e "${YELLOW}   Searching for relationship images...${NC}"
            echo ""
            
            find "$SOURCE_DIR" -type d -name "*relationship*" | while read -r dir; do
                echo -e "   Found: $dir"
            done
        fi
        ;;
    
    4)
        echo ""
        echo -e "${GREEN}📸 Copying entire public directory...${NC}"
        echo ""
        copy_directory \
            "$SOURCE_DIR/public" \
            "$DEST_DIR/public-old" \
            "Public Directory"
        ;;
    
    5)
        echo ""
        echo -e "${BLUE}Enter custom source path:${NC}"
        read -p "Source: " custom_source
        echo -e "${BLUE}Enter custom destination path:${NC}"
        read -p "Destination: " custom_dest
        
        copy_directory \
            "$custom_source" \
            "$custom_dest" \
            "Custom Copy"
        ;;
    
    6)
        echo ""
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    
    *)
        echo ""
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Script complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
