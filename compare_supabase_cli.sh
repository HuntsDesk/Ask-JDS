#!/bin/bash

echo "Supabase Database Schema Comparison"
echo "==================================="
echo ""

# Get current linked project info
echo "Current linked project:"
supabase projects list | grep "●"
echo ""

# Prompt for production database password
echo "Enter the password for PROD database (yzlttnioypqmkhachfor):"
read -s PROD_PASSWORD
echo ""

# Create temporary directory for comparison
TEMP_DIR="/tmp/supabase_comparison_$(date +%s)"
mkdir -p "$TEMP_DIR"

echo "Creating temporary directory: $TEMP_DIR"
echo ""

# Pull current development schema (from linked project)
echo "1. Pulling DEV schema from linked project..."
supabase db pull --schema public > "$TEMP_DIR/dev_pull.log" 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ DEV schema pulled successfully"
    # Copy the generated migration file
    LATEST_DEV_MIGRATION=$(ls -t supabase/migrations/*.sql | head -1)
    if [ -f "$LATEST_DEV_MIGRATION" ]; then
        cp "$LATEST_DEV_MIGRATION" "$TEMP_DIR/dev_schema.sql"
        echo "   📄 DEV schema saved to: $TEMP_DIR/dev_schema.sql"
    fi
else
    echo "   ❌ Failed to pull DEV schema"
    cat "$TEMP_DIR/dev_pull.log"
fi

echo ""

# Pull production schema
echo "2. Pulling PROD schema..."
PROD_URL="postgresql://postgres:${PROD_PASSWORD}@db.yzlttnioypqmkhachfor.supabase.co:5432/postgres"

supabase db pull --db-url "$PROD_URL" --schema public > "$TEMP_DIR/prod_pull.log" 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ PROD schema pulled successfully"
    # Copy the generated migration file
    LATEST_PROD_MIGRATION=$(ls -t supabase/migrations/*.sql | head -1)
    if [ -f "$LATEST_PROD_MIGRATION" ]; then
        cp "$LATEST_PROD_MIGRATION" "$TEMP_DIR/prod_schema.sql"
        echo "   📄 PROD schema saved to: $TEMP_DIR/prod_schema.sql"
    fi
else
    echo "   ❌ Failed to pull PROD schema"
    cat "$TEMP_DIR/prod_pull.log"
fi

echo ""

# Compare the schemas if both were pulled successfully
if [ -f "$TEMP_DIR/dev_schema.sql" ] && [ -f "$TEMP_DIR/prod_schema.sql" ]; then
    echo "3. Comparing schemas..."
    echo "======================"
    echo ""
    
    # Get file sizes
    DEV_SIZE=$(wc -l < "$TEMP_DIR/dev_schema.sql")
    PROD_SIZE=$(wc -l < "$TEMP_DIR/prod_schema.sql")
    
    echo "DEV schema:  $DEV_SIZE lines"
    echo "PROD schema: $PROD_SIZE lines"
    echo ""
    
    # Compare files
    if diff "$TEMP_DIR/dev_schema.sql" "$TEMP_DIR/prod_schema.sql" > "$TEMP_DIR/diff_output.txt"; then
        echo "✅ No differences found! The schemas are identical."
    else
        echo "❌ Differences found:"
        echo ""
        echo "Legend:"
        echo "  < = Only in DEV"
        echo "  > = Only in PROD"
        echo ""
        
        # Show first 50 lines of differences
        head -50 "$TEMP_DIR/diff_output.txt"
        
        DIFF_LINES=$(wc -l < "$TEMP_DIR/diff_output.txt")
        if [ $DIFF_LINES -gt 50 ]; then
            echo ""
            echo "... (showing first 50 lines of $DIFF_LINES total diff lines)"
            echo "Full diff saved to: $TEMP_DIR/diff_output.txt"
        fi
    fi
    
    echo ""
    echo "Schema files saved to:"
    echo "  DEV:  $TEMP_DIR/dev_schema.sql"
    echo "  PROD: $TEMP_DIR/prod_schema.sql"
    echo "  DIFF: $TEMP_DIR/diff_output.txt"
else
    echo "❌ Could not compare schemas - one or both pulls failed"
fi

echo ""
echo "Comparison complete!" 