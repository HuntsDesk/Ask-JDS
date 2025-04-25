#!/usr/bin/env node

/**
 * Edge Function Test Script
 * 
 * This script tests the deployed Edge Functions to verify they are working correctly
 * after the Supabase JS upgrade from 2.38.0 to 2.39.3.
 * 
 * Usage:
 * node test-edge-functions.js
 */

const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test cases for each function
const tests = [
  {
    name: 'create-payment-intent',
    endpoint: `${BASE_URL}/functions/v1/create-payment-intent`,
    method: 'POST',
    body: { 
      course_id: 'test-course',
      payment_method_types: ['card']
    },
    validateResponse: (res) => {
      return res.client_secret && res.id;
    }
  },
  {
    name: 'create-checkout-session',
    endpoint: `${BASE_URL}/functions/v1/create-checkout-session`,
    method: 'POST',
    body: { 
      course_id: 'test-course',
      price_id: 'price_123'
    },
    validateResponse: (res) => {
      return res.url && res.url.includes('checkout.stripe.com');
    }
  }
];

async function runTests() {
  console.log('🧪 Testing Edge Functions with Supabase JS 2.39.3...\n');
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      
      const response = await fetch(test.endpoint, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      
      if (response.ok && (test.validateResponse ? test.validateResponse(data) : true)) {
        console.log(`✅ ${test.name}: Success`);
      } else {
        console.log(`❌ ${test.name}: Failed`);
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error`, error.message);
    }
    
    console.log('---');
  }
  
  console.log('\n🏁 All tests completed.');
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
}); 