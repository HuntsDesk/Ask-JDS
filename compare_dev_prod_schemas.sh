#!/bin/bash

# Database connection details from .env
DEV_HOST="db.prbbuxgirnecbkpdpgcb.supabase.co"
PROD_HOST="db.yzlttnioypqmkhachfor.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Prompt for database passwords
echo "Enter the password for DEV database (prbbuxgirnecbkpdpgcb):"
read -s DEV_PASSWORD

echo "Enter the password for PROD database (yzlttnioypqmkhachfor):"
read -s PROD_PASSWORD

echo ""
echo "Comparing schemas between DEV and PROD databases..."
echo "=================================================="

# Create temporary files for the results
DEV_SCHEMA_FILE="/tmp/dev_schema.csv"
PROD_SCHEMA_FILE="/tmp/prod_schema.csv"

# Run schema comparison query on DEV database
echo "Querying DEV database schema..."
PGPASSWORD="$DEV_PASSWORD" psql -h "$DEV_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY (
  SELECT 
    object_type,
    schemaname,
    object_name,
    column_name,
    data_type,
    is_nullable
  FROM (
    -- Tables
    SELECT 
      'TABLE' as object_type,
      schemaname,
      tablename as object_name,
      NULL as column_name,
      NULL as data_type,
      NULL as is_nullable
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

    UNION ALL

    -- Columns
    SELECT 
      'COLUMN' as object_type,
      table_schema as schemaname,
      table_name as object_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

    UNION ALL

    -- Functions
    SELECT 
      'FUNCTION' as object_type,
      n.nspname as schemaname,
      p.proname as object_name,
      NULL as column_name,
      pg_get_function_result(p.oid) as data_type,
      NULL as is_nullable
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

    UNION ALL

    -- RLS Policies
    SELECT 
      'RLS_POLICY' as object_type,
      schemaname,
      tablename as object_name,
      policyname as column_name,
      cmd as data_type,
      permissive::text as is_nullable
    FROM pg_policies
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')
  ) AS combined_schema
  ORDER BY object_type, schemaname, object_name, column_name
) TO STDOUT WITH CSV HEADER;" > "$DEV_SCHEMA_FILE"

# Run schema comparison query on PROD database
echo "Querying PROD database schema..."
PGPASSWORD="$PROD_PASSWORD" psql -h "$PROD_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY (
  SELECT 
    object_type,
    schemaname,
    object_name,
    column_name,
    data_type,
    is_nullable
  FROM (
    -- Tables
    SELECT 
      'TABLE' as object_type,
      schemaname,
      tablename as object_name,
      NULL as column_name,
      NULL as data_type,
      NULL as is_nullable
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

    UNION ALL

    -- Columns
    SELECT 
      'COLUMN' as object_type,
      table_schema as schemaname,
      table_name as object_name,
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

    UNION ALL

    -- Functions
    SELECT 
      'FUNCTION' as object_type,
      n.nspname as schemaname,
      p.proname as object_name,
      NULL as column_name,
      pg_get_function_result(p.oid) as data_type,
      NULL as is_nullable
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

    UNION ALL

    -- RLS Policies
    SELECT 
      'RLS_POLICY' as object_type,
      schemaname,
      tablename as object_name,
      policyname as column_name,
      cmd as data_type,
      permissive::text as is_nullable
    FROM pg_policies
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')
  ) AS combined_schema
  ORDER BY object_type, schemaname, object_name, column_name
) TO STDOUT WITH CSV HEADER;" > "$PROD_SCHEMA_FILE"

echo ""
echo "Schema comparison complete!"
echo ""

# Show file sizes for verification
echo "DEV schema file size: $(wc -l < "$DEV_SCHEMA_FILE") lines"
echo "PROD schema file size: $(wc -l < "$PROD_SCHEMA_FILE") lines"
echo ""

# Use diff to compare the files
echo "DIFFERENCES BETWEEN DEV AND PROD:"
echo "=================================="
echo ""

if diff "$DEV_SCHEMA_FILE" "$PROD_SCHEMA_FILE" > /dev/null; then
    echo "✅ No differences found! The schemas are identical."
else
    echo "❌ Differences found:"
    echo ""
    echo "Legend:"
    echo "  < = Only in DEV"
    echo "  > = Only in PROD"
    echo ""
    diff "$DEV_SCHEMA_FILE" "$PROD_SCHEMA_FILE"
fi

echo ""
echo "Schema files saved to:"
echo "  DEV:  $DEV_SCHEMA_FILE"
echo "  PROD: $PROD_SCHEMA_FILE"
echo ""
echo "You can also manually compare these files with your preferred diff tool." 