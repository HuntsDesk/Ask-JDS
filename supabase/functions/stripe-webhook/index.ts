/// <reference lib="deno.ns" />
/// <reference lib="dom" />
/// <reference types="npm:@types/stripe" />

import { createClient } from "npm:@supabase/supabase-js@2.38.0";
import Stripe from "npm:stripe@17.7.0";

// Version marker to identify when this code is running
console.log("Stripe webhook function v2.1 - Enhanced async signature verification");

// CORS headers for public access
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Constants
const SKIP_DB_FOR_TEST_EVENTS = Deno.env.get('SKIP_DB_FOR_TEST_EVENTS') === 'true';
const isProd = () => Deno.env.get('ENVIRONMENT') === 'production';

// Initialize Stripe with appropriate key based on environment
const stripeSecretKey = isProd() 
  ? Deno.env.get('STRIPE_LIVE_SECRET_KEY') 
  : Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecretKey) {
  console.error('Missing Stripe API key');
  throw new Error('Missing Stripe API key');
}

// Create Stripe instance with API version explicitly set
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

// Get webhook signing secret based on environment
const webhookSecret = isProd()
  ? Deno.env.get('STRIPE_LIVE_WEBHOOK_SECRET')
  : Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET') || 'whsec_WdhE6lrlqHHN6IvjtukOhrK6rwFCgMNF';

if (!webhookSecret) {
  console.warn('Missing webhook secret - signature verification will be skipped');
}

// Log the environment and webhook configuration
console.log(`Stripe webhook function loaded in ${isProd() ? 'PRODUCTION' : 'TEST'} mode`);
console.log(`Webhook secret available: ${webhookSecret ? 'Yes' : 'No'}`);
console.log(`Using webhook secret: ${webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'None'}`);

// Database transaction helpers
async function beginTransaction(supabase) {
  try {
    await supabase.rpc('begin_transaction');
  } catch (error) {
    console.warn('Failed to use RPC for transaction, using direct SQL', error);
    await supabase.from('_transaction').select('begin').limit(1);
  }
}

async function commitTransaction(supabase) {
  try {
    await supabase.rpc('commit_transaction');
  } catch (error) {
    console.warn('Failed to use RPC for transaction, using direct SQL', error);
    await supabase.from('_transaction').select('commit').limit(1);
  }
}

async function rollbackTransaction(supabase) {
  try {
    await supabase.rpc('rollback_transaction');
  } catch (error) {
    console.warn('Failed to use RPC for transaction, using direct SQL', error);
    await supabase.from('_transaction').select('rollback').limit(1);
  }
}

// Error logging helper
async function logError(supabase, message, error, userId = null) {
  try {
    // Prepare error details - handle both Error objects and plain objects
    let errorDetails;
    let stackTrace = '';
    
    if (error instanceof Error) {
      errorDetails = error.toString();
      stackTrace = error.stack || '';
    } else {
      // For non-Error objects (like metadata), stringify for better logging
      try {
        errorDetails = JSON.stringify(error, null, 2);
      } catch (e) {
        // If JSON stringify fails, use basic toString
        errorDetails = String(error);
      }
    }
    
    await supabase
      .from('error_logs')
      .insert({
        message,
        error_details: errorDetails,
        stack_trace: stackTrace,
        user_id: userId,
      });
    console.error(`${message}:`, error);
  } catch (logErr) {
    // If error logging fails, output to console
    console.error('Failed to log error to database:', logErr);
    console.error('Original error:', message, error);
  }
}

// Test event helper
function isTestEvent(event) {
  return event?.livemode === false;
}

// Payment Intent Succeeded Handler
async function handlePaymentIntentSucceeded(paymentIntent, supabase) {
  console.log(`Processing payment intent: ${paymentIntent.id}`);
  
  try {
    // Begin a transaction
    await beginTransaction(supabase);
    
    const metadata = paymentIntent.metadata || {};
    // Check for both user_id and supabase_user_id in the metadata
    const userId = metadata.user_id || metadata.supabase_user_id;
    
    // Gracefully handle missing user_id
    if (!userId) {
      console.log(`Payment intent ${paymentIntent.id} missing user_id/supabase_user_id in metadata, checking if this is a test event`);
      
      // Check if this is a test payment intent (handle gracefully)
      if (isTestEvent(paymentIntent) || paymentIntent.id.startsWith('pi_test_')) {
        console.log('Test payment intent detected, skipping database operations');
        await commitTransaction(supabase);
        return true;
      }
      
      // Log the error but don't throw (prevents retries)
      console.warn(`Payment intent ${paymentIntent.id} missing user_id/supabase_user_id in metadata and is not a test event`);
      await logError(supabase, 'Missing user_id/supabase_user_id in payment intent metadata', { paymentIntentId: paymentIntent.id, metadata });
      await commitTransaction(supabase);
      return true; // Return success to prevent Stripe retries
    }
    
    // Special handling for test events with placeholder UUIDs
    const isTestUUID = userId.includes('00000000-0000-0000-0000-');
    if (isTestUUID) {
      console.log('Test UUID detected, skipping database operations');
      await commitTransaction(supabase);
      return true;
    }
    
    // Update the user's stripe_customer_id if available
    if (paymentIntent.customer) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: paymentIntent.customer })
        .eq('id', userId);
        
      if (profileUpdateError) {
        throw new Error(`Failed to update profile: ${profileUpdateError.message}`);
      }
    }
    
    // Handle course purchase
    if (metadata.purchase_type === 'course' || metadata.purchase_type === 'course_purchase') {
      const courseId = metadata.course_id;
      // Fix for "undefined" string in days_of_access
      console.log(`Original days_of_access value: "${metadata.days_of_access}" (type: ${typeof metadata.days_of_access})`);
      const daysOfAccessValue = metadata.days_of_access === "undefined" ? '365' : metadata.days_of_access;
      const daysOfAccess = parseInt(daysOfAccessValue || '365');
      console.log(`Parsed daysOfAccess: ${daysOfAccess}, isNaN: ${isNaN(daysOfAccess)}`);
      const isRenewal = metadata.is_renewal === 'true';
      
      if (!courseId) {
        console.warn(`Payment intent ${paymentIntent.id} missing course_id in metadata for course purchase`);
        await commitTransaction(supabase);
        return true; // Return success to prevent Stripe retries
      }
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysOfAccess);
      
      if (isRenewal) {
        // Update existing enrollment
        const { error: updateError } = await supabase
          .from('course_enrollments')
          .update({
            status: 'active',
            expires_at: expiresAt.toISOString(),
            renewed_at: new Date().toISOString(),
            notification_sent: false,
            stripe_price_id: metadata.price_id || null,
            stripe_payment_intent_id: paymentIntent.id,
            renewal_count: supabase.rpc('increment', { x: 1 })
          })
          .eq('user_id', userId)
          .eq('course_id', courseId);
          
        if (updateError) {
          throw new Error(`Failed to update course enrollment: ${updateError.message}`);
        }
      } else {
        // Create new enrollment
        const { error: createError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            status: 'active',
            enrolled_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            stripe_price_id: metadata.price_id || null,
            stripe_payment_intent_id: paymentIntent.id
          });
          
        if (createError) {
          throw new Error(`Failed to create course enrollment: ${createError.message}`);
        }
      }
    }
    
    // Commit the transaction
    await commitTransaction(supabase);
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await rollbackTransaction(supabase);
    await logError(supabase, 'Error processing payment intent succeeded', error, paymentIntent.metadata?.user_id);
    throw error;
  }
}

// Subscription Created Handler
async function handleSubscriptionCreated(subscription, supabase) {
  console.log(`Processing subscription created: ${subscription.id}`);
  
  try {
    // Begin a transaction
    await beginTransaction(supabase);
    
    const metadata = subscription.metadata || {};
    let userId = metadata.user_id;
    
    // If user_id is not in metadata, try to find it from the customer
    if (!userId && subscription.customer) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', subscription.customer)
        .limit(1);
        
      if (profileError || !profiles || profiles.length === 0) {
        throw new Error(`Failed to find user for customer: ${subscription.customer}`);
      }
      
      userId = profiles[0].id;
    }
    
    if (!userId) {
      throw new Error('Could not determine user_id for subscription');
    }
    
    // Special handling for test events with placeholder UUIDs
    const isTestUUID = userId.includes('00000000-0000-0000-0000-');
    if (isTestUUID) {
      console.log('Test UUID detected, skipping database operations');
      await commitTransaction(supabase);
      return true;
    }
    
    // Get price ID from the first subscription item
    const priceId = subscription.items.data[0]?.price?.id;
    
    if (!priceId) {
      throw new Error('No price ID found in subscription');
    }
    
    console.log(`Creating subscription record for user ${userId} with price ${priceId}`);
    
    // Insert subscription record
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        price_id: priceId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (subscriptionError) {
      throw new Error(`Failed to create subscription record: ${subscriptionError.message}`);
    }
    
    // Update profile with customer ID if needed
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: subscription.customer })
      .eq('id', userId);
    
    // Commit the transaction
    await commitTransaction(supabase);
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await rollbackTransaction(supabase);
    await logError(supabase, 'Error processing subscription created', error, subscription.metadata?.user_id);
    throw error;
  }
}

// Subscription Updated Handler
async function handleSubscriptionUpdated(subscription, supabase) {
  console.log(`Processing subscription updated: ${subscription.id}`);
  
  try {
    // Begin a transaction
    await beginTransaction(supabase);
    
    // Get price ID from the first subscription item
    const priceId = subscription.items.data[0]?.price?.id;
    
    if (!priceId) {
      throw new Error('No price ID found in subscription');
    }
    
    // Handle test data - if this is a test subscription ID, just return success
    if (subscription.id.startsWith('sub_test_') || isTestEvent(subscription)) {
      console.log('Test subscription detected, skipping database operations');
      await commitTransaction(supabase);
      return true;
    }
    
    console.log(`Updating subscription record for subscription ${subscription.id} with price ${priceId}`);
    
    // Update subscription record
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        price_id: priceId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription.id);
      
    if (subscriptionError) {
      throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
    }
    
    // Commit the transaction
    await commitTransaction(supabase);
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await rollbackTransaction(supabase);
    await logError(supabase, 'Error processing subscription updated', error);
    throw error;
  }
}

// Subscription Deleted Handler
async function handleSubscriptionDeleted(subscription, supabase) {
  console.log(`Processing subscription deleted: ${subscription.id}`);
  
  try {
    // Handle test data - if this is a test subscription ID, just return success
    if (subscription.id.startsWith('sub_test_') || isTestEvent(subscription)) {
      console.log('Test subscription detected, skipping database operations');
      return true;
    }
    
    console.log(`Marking subscription ${subscription.id} as canceled`);
    
    // Update subscription record
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription.id);
      
    if (subscriptionError) {
      throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
    }
    
    return true;
  } catch (error) {
    await logError(supabase, 'Error processing subscription deleted', error);
    throw error;
  }
}

// Invoice Payment Succeeded Handler
async function handleInvoicePaymentSucceeded(invoice, supabase) {
  console.log(`Processing invoice payment succeeded: ${invoice.id}`);
  
  try {
    // If this is not a subscription invoice, skip
    if (!invoice.subscription) {
      console.log('Invoice is not for a subscription, skipping');
      return true;
    }
    
    // Handle test data - if this is a test invoice, just return success
    if (invoice.id.startsWith('in_test_') || isTestEvent(invoice)) {
      console.log('Test invoice detected, skipping database operations');
      return true;
    }
    
    // Begin a transaction
    await beginTransaction(supabase);
    
    // Get the subscription item and price ID
    const priceId = invoice.lines?.data[0]?.price?.id;
    const periodEnd = invoice.lines?.data[0]?.period?.end;
    
    console.log(`Updating subscription ${invoice.subscription} after successful payment`);
    
    // Update subscription record
    const updateData: {
      status: string; 
      updated_at: string;
      price_id?: string;
      current_period_end?: string;
    } = {
      status: 'active',
      updated_at: new Date().toISOString()
    };
    
    if (priceId) {
      updateData.price_id = priceId;
    }
    
    if (periodEnd) {
      updateData.current_period_end = new Date(periodEnd * 1000).toISOString();
    }
    
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('subscription_id', invoice.subscription);
      
    if (subscriptionError) {
      throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
    }
    
    // Commit the transaction
    await commitTransaction(supabase);
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await rollbackTransaction(supabase);
    await logError(supabase, 'Error processing invoice payment succeeded', error);
    throw error;
  }
}

// Invoice Payment Failed Handler
async function handleInvoicePaymentFailed(invoice, supabase) {
  console.log(`Processing invoice payment failed: ${invoice.id}`);
  
  try {
    // If this is not a subscription invoice, skip
    if (!invoice.subscription) {
      console.log('Invoice is not for a subscription, skipping');
      return true;
    }
    
    // Handle test data - if this is a test invoice, just return success
    if (invoice.id.startsWith('in_test_') || isTestEvent(invoice)) {
      console.log('Test invoice detected, skipping database operations');
      return true;
    }
    
    console.log(`Marking subscription ${invoice.subscription} as past_due due to failed payment`);
    
    // Update subscription record to past_due
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', invoice.subscription);
      
    if (subscriptionError) {
      throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
    }
    
    return true;
  } catch (error) {
    await logError(supabase, 'Error processing invoice payment failed', error);
    throw error;
  }
}

// Checkout Session Completed Handler
async function handleCheckoutSessionCompleted(session, supabase) {
  console.log(`Processing checkout session completed: ${session.id}`);
  
  try {
    // Extract relevant information
    const metadata = session.metadata || {};
    const userId = metadata.user_id;
    const priceId = metadata.target_stripe_price_id || metadata.price_id;
    const tier = metadata.tier;
    
    if (!userId) {
      throw new Error('Missing user_id in checkout session metadata');
    }
    
    // Log the metadata for debugging
    console.log('Checkout session metadata:', metadata);
    console.log('Checkout session mode:', session.mode);
    console.log('Checkout session tier:', tier);
    console.log('Checkout session price ID:', priceId);
    
    // Update the user's stripe_customer_id if available
    if (session.customer) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: session.customer })
        .eq('id', userId);
    }
    
    // If this is a subscription and we have a price ID, create or update the subscription record
    if (session.mode === 'subscription' && priceId) {
      console.log(`Creating subscription from checkout session for user ${userId} with price ${priceId}`);
      
      // Calculate period end (1 month from now)
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      // Check if a subscription already exists
      const { data: existingSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId);
      
      if (existingSubscriptions && existingSubscriptions.length > 0) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            price_id: priceId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscriptions[0].id);
          
        if (updateError) {
          console.error(`Failed to update subscription from checkout: ${updateError.message}`);
        } else {
          console.log(`Updated existing subscription for user ${userId}`);
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            subscription_id: `cs_${session.id}`, // Use checkout session ID as placeholder
            stripe_customer_id: session.customer,
            price_id: priceId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error(`Failed to create subscription from checkout: ${insertError.message}`);
        } else {
          console.log(`Created new subscription for user ${userId}`);
        }
      }
    } else {
      console.log('Checkout session is not for a subscription or missing price ID');
    }
    
    return true;
  } catch (error) {
    await logError(supabase, 'Error processing checkout session completed', error, session.metadata?.user_id);
    throw error;
  }
}

// Event handler with proper error handling
async function handleStripeEvent(event, supabase) {
  // Log event for debugging
  console.log(`Processing event: ${event.type} (${event.id})`);
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Log additional details for debugging
        const paymentIntent = event.data.object;
        console.log(`Payment intent details - ID: ${paymentIntent.id}, Amount: ${paymentIntent.amount}, Has metadata: ${!!paymentIntent.metadata}, User ID in metadata: ${paymentIntent.metadata?.user_id || paymentIntent.metadata?.supabase_user_id || 'MISSING'}`);
        await handlePaymentIntentSucceeded(paymentIntent, supabase);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, supabase);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, supabase);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    console.log(`Successfully processed event: ${event.type} (${event.id})`);
    return true;
  } catch (error) {
    await logError(supabase, `Error processing event ${event.type}`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        ...corsHeaders,
        'Allow': 'POST, OPTIONS',
      },
    });
  }

  console.log("Received POST request");

  try {
    // IMPORTANT: Clone the request before reading the body
    // This ensures we have access to the raw, unmodified body for signature verification
    const clonedReq = req.clone();
    
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing Stripe signature header');
      return new Response(
        JSON.stringify({ error: 'Missing Stripe signature header' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get the raw request body as text without any processing
    const rawBody = await clonedReq.text();
    
    // Check if this is a test mode event based on headers
    const mode = isProd() ? 'LIVE' : 'TEST';
    console.log(`Event mode: ${mode}`);
    console.log('Webhook secret available:', webhookSecret ? 'Yes' : 'No');
    console.log('Signature available:', signature ? 'Yes' : 'No');
    
    // Verify the signature if webhook secret is available
    let event;
    if (webhookSecret && signature) {
      try {
        console.log("Starting signature verification...");
        console.log("Raw body length:", rawBody.length);
        // Use explicit async verification with the raw body
        event = await stripe.webhooks.constructEventAsync(
          rawBody,
          signature,
          webhookSecret
        );
        console.log(`Event signature verified successfully: ${event.type} (${event.id})`);
      } catch (err) {
        console.error(`Webhook signature verification failed:`, err);
        // Log more detailed error information
        console.error(`Verification details:
          - Secret available: ${webhookSecret ? 'Yes' : 'No'}
          - Signature available: ${signature ? 'Yes' : 'No'}
          - Error name: ${err.name}
          - Error message: ${err.message}
        `);
        
        return new Response(
          JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } else {
      // No secret or signature, parse body directly (not recommended for production)
      try {
        event = JSON.parse(rawBody);
        console.warn('Webhook signature verification skipped - missing secret or signature');
      } catch (err) {
        console.error('Error parsing webhook body:', err);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Skip DB operations for test events if configured
    if (isTestEvent(event) && SKIP_DB_FOR_TEST_EVENTS) {
      console.log('Test event - skipping database operations');
      return new Response(
        JSON.stringify({ success: true, message: 'Test event received - database operations skipped' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Process the event
    const success = await handleStripeEvent(event, supabase);

    // Return a success response
    return new Response(
      JSON.stringify({ success, message: `Webhook processed: ${event.type}` }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('Unhandled webhook error:', err);
    
    return new Response(
      JSON.stringify({ error: `Webhook error: ${err.message}` }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}); 