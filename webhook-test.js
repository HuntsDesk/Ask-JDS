import crypto from 'crypto';

// Configuration
const webhookUrl = 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/stripe-webhook';
const webhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTkzNjIsImV4cCI6MjA2NDAzNTM2Mn0.WFvJN-61K6z7RHwjiybC7kq1zVIK6DgvhKlXWCzbnh8';

if (!webhookSecret) {
  console.error('Error: STRIPE_TEST_WEBHOOK_SECRET environment variable is not set');
  console.error('Please set it by running: export STRIPE_TEST_WEBHOOK_SECRET=your_webhook_secret');
  process.exit(1);
}

// Simple payment intent succeeded event
const testEvent = {
  id: 'evt_test_webhook_' + Math.floor(Math.random() * 1000000),
  object: 'event',
  api_version: '2025-03-31.basil',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_' + Math.floor(Math.random() * 1000000),
      object: 'payment_intent',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        user_id: '00000000-0000-0000-0000-000000000000',
        purchase_type: 'course',
        course_id: '00000000-0000-0000-0000-000000000001',
        days_of_access: '365',
        is_renewal: 'false',
      },
      customer: 'cus_' + Math.floor(Math.random() * 1000000),
    }
  },
  livemode: false,
  type: 'payment_intent.succeeded'
};

// Convert event to string
const payload = JSON.stringify(testEvent);

// Create signature
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto.createHmac('sha256', webhookSecret)
  .update(signedPayload)
  .digest('hex');

// Construct the signature header
const stripeSignature = `t=${timestamp},v1=${signature}`;

// Make request
console.log('Sending webhook request...');
fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': stripeSignature,
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: payload
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(text => {
  try {
    const json = JSON.parse(text);
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('Raw response:', text);
  }
})
.catch(error => {
  console.error('Error:', error);
}); 