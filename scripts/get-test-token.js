// Script to get a valid JWT token for testing Supabase Edge Functions
// Run with: node scripts/get-test-token.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

/**
 * This script extracts a JWT token from local storage for testing Edge Functions.
 * 
 * Instructions:
 * 1. Open your website and log in
 * 2. Open browser developer tools and go to Application -> Local Storage
 * 3. Find the item with key 'ask-jds-auth-storage'
 * 4. Copy that item's value to a file called 'token.json' in the root of your project
 * 5. Run this script to extract the JWT token
 */

try {
  // Check if token.json exists
  if (!fs.existsSync(path.join(cwd, 'token.json'))) {
    console.error('Error: token.json file not found');
    console.log('\nTo use this script:');
    console.log('1. Log in to your website');
    console.log('2. Open DevTools (F12) and go to Application -> Local Storage');
    console.log('3. Find the item with key "ask-jds-auth-storage"');
    console.log('4. Copy that item\'s value to a file called "token.json" in the root of your project');
    console.log('5. Run this script again');
    process.exit(1);
  }

  // Read token.json
  const tokenData = JSON.parse(fs.readFileSync(path.join(cwd, 'token.json'), 'utf8'));
  
  if (!tokenData || !tokenData.access_token) {
    console.error('Error: Invalid token data, missing access_token');
    process.exit(1);
  }
  
  // Extract token
  const token = tokenData.access_token;
  
  // Print out the token and curl examples
  console.log('\n=== JWT TOKEN FOR TESTING ===\n');
  console.log(token);
  console.log('\n=== CURL EXAMPLE FOR CHECKOUT SESSION ===\n');
  console.log(`curl -i --request POST 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/create-checkout-session' \\
  --header 'Content-Type: application/json' \\
  --header 'Authorization: Bearer ${token}' \\
  --data '{"mode":"subscription","subscriptionTier":"unlimited","interval":"month"}'`);
  
  console.log('\n=== CURL EXAMPLE FOR WEBHOOK TEST ===\n');
  console.log(`curl -i --request POST 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/stripe-webhook' \\
  --header 'Content-Type: application/json' \\
  --header 'Stripe-Signature: t=1234567890,v1=dummy_signature' \\
  --data '{"id":"evt_test_webhook","object":"event","type":"checkout.session.completed","livemode":false,"data":{"object":{"id":"cs_test_webhook","object":"checkout.session","metadata":{"userId":"test-user-id","purchaseType":"subscription","subscriptionTier":"unlimited","interval":"month"},"subscription":"sub_test123"}}}'`);
  
  // Create a .env.test file for GitHub Actions
  fs.writeFileSync(
    path.join(cwd, '.env.test'),
    `SUPABASE_JWT=${token}\n`,
    'utf8'
  );
  console.log('\nCreated .env.test file with JWT token for CI/CD use');
  
} catch (error) {
  console.error('Error processing token:', error);
  process.exit(1);
} 