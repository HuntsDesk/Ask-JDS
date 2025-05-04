#!/bin/bash
# Script to apply migrations to the local Supabase instance

echo "Applying Supabase migrations..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Apply migrations
supabase migration up

# Or if you're using a direct connection to the database:
# PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -p 54322 -f supabase/migrations/20240101000001_admin_setup.sql
# PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -p 54322 -f supabase/migrations/20240101000002_upgrade_to_admin_function.sql

echo "Migrations applied successfully!" 