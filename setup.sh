#!/bin/bash

set -e

echo "===== Installing Homebrew ====="
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

echo "===== Installing core CLI tools ====="
brew update

# Node and NPM (via nvm for better version control)
brew install nvm
export NVM_DIR="$HOME/.nvm"
mkdir -p $NVM_DIR
source $(brew --prefix nvm)/nvm.sh
nvm install 18
nvm use 18

echo "===== Installing Deno ====="
brew install deno

echo "===== Installing Supabase CLI ====="
brew install supabase/tap/supabase

echo "===== Installing Google Cloud CLI ====="
brew install --cask google-cloud-sdk

echo "===== Installing Stripe CLI (optional, but recommended) ====="
brew install stripe/stripe-cli/stripe

echo "===== Installing Git, jq, curl, and Zsh enhancements ====="
brew install git jq curl zsh-autosuggestions zsh-syntax-highlighting

echo "===== Installing NPM packages ====="
npm install

echo "===== Setting up environment variables ====="
cp .env.template .env
echo "# IMPORTANT: Edit .env and set your real credentials!"

echo "===== Logging in to Supabase CLI ====="
supabase login
echo "# Linking to Supabase project..."
supabase link --project-ref prbbuxgirnecbkpdpgcb

echo "===== Set secrets for Edge Functions ====="
npx supabase secrets set --env-file .env

echo "===== Google Cloud Auth ====="
echo "Run: gcloud init"
echo "Then: gcloud auth application-default login"

echo "===== Checking versions ====="
node --version
npm --version
deno --version
supabase --version
gcloud --version
git --version
stripe --version

echo "===== Done! ====="
echo "To start the dev server:"
echo "npm run dev:askjds"
echo "or"
echo "npm run dev:jds"
echo "or"
echo "npm run dev:admin" 