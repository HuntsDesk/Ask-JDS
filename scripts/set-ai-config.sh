#!/bin/bash

# Script to set Supabase secrets for AI model configuration
# This script sets the environment variables for AI model configuration

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed or not in the PATH."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Set development model configuration
echo "Setting AI model configuration for development environment..."
supabase secrets set AI_MODEL_PRIMARY_DEV=jds-titan
supabase secrets set AI_MODEL_SECONDARY_DEV=jds-flash
supabase secrets set AI_MODELS_LOGGING=true

# Set production model configuration 
echo "Setting AI model configuration for production environment..."
supabase secrets set AI_MODEL_PRIMARY_PROD=jds-titan
supabase secrets set AI_MODEL_SECONDARY_PROD=jds-flash
supabase secrets set AI_MODELS_LOGGING=false

echo "AI model configuration has been set successfully."
echo ""
echo "These code names map to the following actual models:"
echo "- jds-titan → gemini-2.5-pro-preview-05-06 (primary, premium model for chat responses)"
echo "- jds-flash → gemini-1.5-flash-8b (secondary, economical model for thread titles)"
echo ""
echo "This configuration ensures optimal performance while maintaining security through obfuscation." 