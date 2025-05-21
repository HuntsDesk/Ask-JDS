import crypto from 'crypto';

// Configuration
const webhookUrl = 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/stripe-webhook';
const webhookSecret = 'whsec_ab5d2912178ddea7bf61e7da522e793d6c14f87a6c093f05b464eb0fdbb22a49';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjY1NTAsImV4cCI6MjA1NTA0MjU1MH0.tUE2nfjVbY2NCr0duUyhC5Rx-fe5TMBeCoWlkzAxxds';

// Base event template
const baseEventTemplate = {
  object: 'event',
  api_version: '2025-03-31.basil',
  created: Math.floor(Date.now() / 1000),
  livemode: false,
};

// Test data
const testUserId = '00000000-0000-0000-0000-000000000000';
const testCourseId = '00000000-0000-0000-0000-000000000001';
const testCustomerId = 'cus_test_' + Math.floor(Math.random() * 1000000);
const testSubscriptionId = 'sub_test_' + Math.floor(Math.random() * 1000000);
const testPaymentIntentId = 'pi_test_' + Math.floor(Math.random() * 1000000);
const testPriceId = 'price_test_' + Math.floor(Math.random() * 1000000);
const testInvoiceId = 'in_test_' + Math.floor(Math.random() * 1000000);
const testCheckoutSessionId = 'cs_test_' + Math.floor(Math.random() * 1000000);

// Create test events
const events = [
  // payment_intent.succeeded
  {
    ...baseEventTemplate,
    id: 'evt_test_pi_success_' + Math.floor(Math.random() * 1000000),
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: testPaymentIntentId,
        object: 'payment_intent',
        amount: 2000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          user_id: testUserId,
          purchase_type: 'course',
          course_id: testCourseId,
          days_of_access: '365',
          is_renewal: 'false',
        },
        customer: testCustomerId,
      }
    }
  },
  
  // customer.subscription.created
  {
    ...baseEventTemplate,
    id: 'evt_test_sub_created_' + Math.floor(Math.random() * 1000000),
    type: 'customer.subscription.created',
    data: {
      object: {
        id: testSubscriptionId,
        object: 'subscription',
        customer: testCustomerId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 days
        cancel_at_period_end: false,
        metadata: {
          user_id: testUserId,
        },
        items: {
          data: [
            {
              price: {
                id: testPriceId
              }
            }
          ]
        }
      }
    }
  },
  
  // customer.subscription.updated
  {
    ...baseEventTemplate,
    id: 'evt_test_sub_updated_' + Math.floor(Math.random() * 1000000),
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: testSubscriptionId,
        object: 'subscription',
        customer: testCustomerId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 days
        cancel_at_period_end: true, // changed
        metadata: {
          user_id: testUserId,
        },
        items: {
          data: [
            {
              price: {
                id: testPriceId
              }
            }
          ]
        }
      }
    }
  },
  
  // customer.subscription.deleted
  {
    ...baseEventTemplate,
    id: 'evt_test_sub_deleted_' + Math.floor(Math.random() * 1000000),
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: testSubscriptionId,
        object: 'subscription',
        customer: testCustomerId,
        status: 'canceled',
        current_period_start: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
        current_period_end: Math.floor(Date.now() / 1000) - 1,
        cancel_at_period_end: false,
        metadata: {
          user_id: testUserId,
        },
        items: {
          data: [
            {
              price: {
                id: testPriceId
              }
            }
          ]
        }
      }
    }
  },
  
  // invoice.payment_succeeded
  {
    ...baseEventTemplate,
    id: 'evt_test_invoice_success_' + Math.floor(Math.random() * 1000000),
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: testInvoiceId,
        object: 'invoice',
        customer: testCustomerId,
        subscription: testSubscriptionId,
        status: 'paid',
        lines: {
          data: [
            {
              period: {
                start: Math.floor(Date.now() / 1000),
                end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              },
              price: {
                id: testPriceId
              }
            }
          ]
        }
      }
    }
  },
  
  // invoice.payment_failed
  {
    ...baseEventTemplate,
    id: 'evt_test_invoice_failed_' + Math.floor(Math.random() * 1000000),
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: testInvoiceId,
        object: 'invoice',
        customer: testCustomerId,
        subscription: testSubscriptionId,
        status: 'open',
        attempt_count: 1,
        next_payment_attempt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      }
    }
  },
  
  // checkout.session.completed
  {
    ...baseEventTemplate,
    id: 'evt_test_checkout_completed_' + Math.floor(Math.random() * 1000000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: testCheckoutSessionId,
        object: 'checkout.session',
        customer: testCustomerId,
        metadata: {
          user_id: testUserId
        }
      }
    }
  }
];

// Function to send an event with proper signature
async function sendEvent(event) {
  console.log(`Sending ${event.type} event...`);
  
  // Convert event to string
  const payload = JSON.stringify(event);
  
  // Create signature
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex');
  
  // Construct the signature header
  const stripeSignature = `t=${timestamp},v1=${signature}`;
  
  // Make request
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': stripeSignature,
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: payload
  });
  
  const status = response.status;
  let result;
  try {
    const text = await response.text();
    result = JSON.parse(text);
  } catch (e) {
    result = { error: 'Failed to parse response' };
  }
  
  return { status, result };
}

// Process events sequentially
async function processEvents() {
  for (const event of events) {
    const result = await sendEvent(event);
    console.log(`${event.type} - Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.result, null, 2));
    console.log('-----------------------------------');
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Run the tests
console.log('Starting webhook tests for all event types...');
processEvents()
  .then(() => console.log('All tests completed'))
  .catch(error => console.error('Error running tests:', error)); 