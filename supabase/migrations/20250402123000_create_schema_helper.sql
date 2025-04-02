-- Migration: Create schema inspection helper function
-- Description: Adds helper functions to inspect the current database schema state
-- Purpose: Provides a comprehensive way to view and analyze the database structure
-- Author: System
-- Date: 2025-04-02
--
-- This migration adds two database objects:
-- 1. get_database_schema() - A function that returns detailed schema information
-- 2. schema_overview - A view that provides a simplified table-centric overview
--
-- The schema information includes:
-- - Tables and their columns
-- - Indexes and their definitions
-- - Constraints and their types
-- - RLS policies and their conditions
-- - Functions and their properties
-- - Triggers and their definitions

-- First create the schema helper function
CREATE OR REPLACE FUNCTION public.get_database_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    result jsonb;
BEGIN
    WITH schema_info AS (
        -- Tables and Columns: Get structure of all public tables
        SELECT 
            jsonb_build_object(
                'tables',
                (SELECT jsonb_object_agg(table_name, columns)
                FROM (
                    SELECT 
                        t.table_name,
                        jsonb_agg(
                            jsonb_build_object(
                                'column_name', c.column_name,
                                'data_type', c.data_type,
                                'is_nullable', c.is_nullable,
                                'column_default', c.column_default,
                                'identity_generation', c.identity_generation
                            ) ORDER BY c.ordinal_position
                        ) as columns
                    FROM information_schema.tables t
                    JOIN information_schema.columns c 
                         ON t.table_name = c.table_name 
                         AND t.table_schema = c.table_schema
                    WHERE t.table_schema = 'public' 
                    AND t.table_type = 'BASE TABLE'
                    GROUP BY t.table_name
                ) t),

                -- Indexes: Get all indexes including their OIDs for uniqueness
                'indexes',
                (SELECT jsonb_object_agg(
                    schemaname || '.' || tablename || '.' || indexname,
                    jsonb_build_object(
                        'definition', indexdef,
                        'oid', i.oid::text
                    )
                )
                FROM pg_indexes idx
                JOIN pg_class i ON i.relname = idx.indexname
                WHERE idx.schemaname = 'public'),

                -- Constraints: Get all table constraints with their definitions
                'constraints',
                (SELECT jsonb_object_agg(
                    table_name || '.' || constraint_name,
                    jsonb_build_object(
                        'constraint_type', constraint_type,
                        'definition', pg_get_constraintdef(pg_constraint.oid)
                    )
                )
                FROM (
                    SELECT 
                        tc.table_name,
                        tc.constraint_name,
                        tc.constraint_type,
                        c.oid
                    FROM information_schema.table_constraints tc
                    JOIN pg_constraint c ON tc.constraint_name = c.conname
                    WHERE tc.table_schema = 'public'
                ) sub),

                -- RLS Policies: Get all row level security policies
                'policies',
                (SELECT jsonb_object_agg(
                    tablename || '.' || policyname,
                    jsonb_build_object(
                        'permissive', permissive,
                        'roles', roles,
                        'command', cmd,
                        'using', CASE WHEN qual IS NOT NULL 
                                    THEN pg_get_expr(qual, table_id::regclass) 
                                    ELSE null END,
                        'with_check', CASE WHEN with_check IS NOT NULL 
                                         THEN pg_get_expr(with_check, table_id::regclass) 
                                         ELSE null END
                    )
                )
                FROM pg_policies
                WHERE schemaname = 'public'),

                -- Functions: Get all functions with their properties and arguments
                'functions',
                (SELECT jsonb_object_agg(
                    proname || '_' || p.oid::text,
                    jsonb_build_object(
                        'name', proname,
                        'language', l.lanname,
                        'security', CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END,
                        'volatility', CASE p.provolatile 
                                     WHEN 'i' THEN 'IMMUTABLE'
                                     WHEN 's' THEN 'STABLE'
                                     ELSE 'VOLATILE' END,
                        'definition', pg_get_functiondef(p.oid),
                        'argument_types', pg_get_function_arguments(p.oid)
                    )
                )
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                JOIN pg_language l ON p.prolang = l.oid
                WHERE n.nspname = 'public'),

                -- Triggers: Get all trigger definitions
                'triggers',
                (SELECT jsonb_object_agg(
                    trigger_name,
                    jsonb_build_object(
                        'table', event_object_table,
                        'timing', condition_timing,
                        'event', event_manipulation,
                        'definition', action_statement
                    )
                )
                FROM information_schema.triggers
                WHERE trigger_schema = 'public')
            ) as schema_info
    )
    SELECT schema_info INTO result FROM schema_info;

    RETURN result;
END;
$$;

-- Create a simplified view for common schema checks
CREATE OR REPLACE VIEW public.schema_overview AS
WITH schema_data AS (
    SELECT get_database_schema() as schema
),
table_info AS (
    SELECT 
        t.key as table_name,
        t.value -> 'columns' as columns,
        COALESCE(
            (SELECT jsonb_agg(policy_key) 
             FROM schema_data s,
                  jsonb_object_keys(s.schema->'policies') policy_key 
             WHERE policy_key LIKE t.key || '.%'
             GROUP BY t.key),
            '[]'::jsonb
        ) as policies,
        COALESCE(
            (SELECT jsonb_agg(constraint_key) 
             FROM schema_data s,
                  jsonb_object_keys(s.schema->'constraints') constraint_key 
             WHERE constraint_key LIKE t.key || '.%'
             GROUP BY t.key),
            '[]'::jsonb
        ) as constraints
    FROM schema_data s,
         jsonb_each(s.schema -> 'tables') t
)
SELECT * FROM table_info;

-- Add helpful comments
COMMENT ON FUNCTION public.get_database_schema() IS 
'Returns a comprehensive view of the database schema including tables, columns, indexes, constraints, policies, functions, and triggers';

COMMENT ON VIEW public.schema_overview IS
'Provides a simplified overview of tables with their columns, policies, and constraints'; 