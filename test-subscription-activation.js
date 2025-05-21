#!/usr/bin/env node

/**
 * Test script for the activate-subscription-minimal Edge Function
 * 
 * Run with: node test-subscription-activation.js
 */

// Configuration - update these values as needed
const edgeFunctionUrl = 'http://localhost:54321/functions/v1/activate-subscription-minimal';
const userId = 'a3a0fd64-7c2b-4f2f-968c-5fc91e73d576'; // Your user ID
const priceId = 'price_1RGYI5BAYVpTe3LyxrZuofBR'; // Unlimited tier price ID
const apiKey = 'dev-only-key'; // Must match ACTIVATION_API_KEY in edge function's env

/**
 * Main function to test subscription activation
 */
async function testSubscriptionActivation() {
  console.log('Testing subscription activation via Edge Function...');
  console.log(`URL: ${edgeFunctionUrl}`);
  console.log(`User ID: ${userId}`);
  console.log(`Price ID: ${priceId}`);
  console.log('---');
  
  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        priceId,
        apiKey
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', response.status);
      console.log('Operation:', result.operation);
      console.log('Message:', result.message);
      console.log('---');
      console.log('Response data:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ Error:', response.status);
      console.error('Error message:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Network or parsing error:');
    console.error(error.message);
  }
}

// Run the test
testSubscriptionActivation().catch(console.error); 