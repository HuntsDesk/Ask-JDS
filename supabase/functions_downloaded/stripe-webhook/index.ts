/// <reference lib="deno.ns" />
/// <reference lib="dom" />
/// <reference types="npm:@types/stripe" />
/// <reference types="stripe" />
// @deno-types="npm:@types/stripe"
// deno-lint-ignore-file no-explicit-any
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.38.0";
import { METADATA_KEYS, ERROR_CODES, isProd } from "../_shared/constants.ts";
// Skip database operations for test events - now configurable via env var
const SKIP_DB_FOR_TEST_EVENTS = Deno.env.get('SKIP_DB_FOR_TEST_EVENTS') === 'true';
// Start the server
console.info('Stripe webhook server started');
// Initialize Stripe with appropriate key based on environment
const stripeSecretKey = isProd() ? Deno.env.get('STRIPE_LIVE_SECRET_KEY') : Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  console.error('Missing Stripe API key');
  throw new Error('Missing Stripe API key');
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil'
});
// Log which mode we're running in
console.log(`Stripe mode: ${isProd() ? 'PRODUCTION' : 'TEST'}`);
console.log('Stripe webhook function loaded');
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Helper function to check if a webhook event has already been processed
async function checkEventProcessed(eventId) {
  const { data, error } = await supabase.from('webhook_events').select('id, is_processed').eq('stripe_event_id', eventId).maybeSingle();
  if (error) {
    console.error('Error checking webhook event processing:', error);
    return false;
  }
  return data?.is_processed === true;
}
// Helper function to record webhook event
async function recordWebhookEvent(event, sessionId, subscriptionId) {
  return await supabase.from('webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    stripe_session_id: sessionId,
    stripe_subscription_id: subscriptionId,
    is_livemode: event.livemode,
    raw_event: event
  });
}
// Helper function to mark webhook event as processed
async function markEventProcessed(eventId) {
  const { error } = await supabase.from('webhook_events').update({
    is_processed: true,
    processed_at: new Date().toISOString()
  }).eq('stripe_event_id', eventId);
  if (error) {
    console.error('Error marking webhook event as processed:', error);
  }
}
// Helper function to update checkout session status
async function updateCheckoutSession(sessionId, isCompleted) {
  const { error } = await supabase.from('checkout_sessions').update({
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null
  }).eq('stripe_session_id', sessionId);
  if (error) {
    console.error('Error updating checkout session:', error);
  }
}
// Helper function to record webhook processing error
async function recordWebhookError(eventId, errorMessage) {
  const { error } = await supabase.from('webhook_events').update({
    error_message: errorMessage,
    retry_count: supabase.rpc('increment', {
      x: 1
    })
  }).eq('stripe_event_id', eventId);
  if (error) {
    console.error('Error recording webhook error:', error);
  }
}
// Validate required metadata
function validateMetadata(metadata, requiredKeys) {
  if (!metadata) return false;
  for (const key of requiredKeys){
    if (metadata[key] === undefined || metadata[key] === null) {
      return false;
    }
  }
  return true;
}
const handler = async (req)=>{
  // Handle CORS preflight request
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  try {
    console.log(`Received ${req.method} request`);
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No stripe-signature header found');
      return new Response(JSON.stringify({
        error: 'No signature found',
        code: ERROR_CODES.WEBHOOK_INVALID
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const body = await req.text();
    // First try to parse the event to determine if it's test or live
    const rawEvent = JSON.parse(body);
    const isLiveMode = rawEvent.livemode;
    console.log(`Event mode: ${isLiveMode ? 'LIVE' : 'TEST'}`);
    // Get the appropriate webhook secret based on mode
    const webhookSecret = isLiveMode ? Deno.env.get('STRIPE_LIVE_WEBHOOK_SECRET') : Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error(`Missing webhook secret for ${isLiveMode ? 'live' : 'test'} mode`);
      return new Response(JSON.stringify({
        error: 'Configuration error',
        code: ERROR_CODES.WEBHOOK_INVALID
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Successfully constructed event: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err);
      return new Response(JSON.stringify({
        error: 'Invalid signature',
        code: ERROR_CODES.WEBHOOK_INVALID
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if event has already been processed (idempotency check)
    const isProcessed = await checkEventProcessed(event.id);
    if (isProcessed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(JSON.stringify({
        received: true,
        processed: false,
        reason: 'already_processed'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Record the webhook event in the database
    let sessionId;
    let subscriptionId;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      sessionId = session.id;
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      subscriptionId = subscription.id;
    }
    const { error: recordError } = await recordWebhookEvent(event, sessionId, subscriptionId);
    if (recordError) {
      console.error('Error recording webhook event:', recordError);
    }
    // Process the event based on its type
    try {
      switch(event.type){
        case 'checkout.session.completed':
          {
            const session = event.data.object;
            console.log('Processing checkout.session.completed:', session.id);
            // Skip database operations for test events if configured
            if (SKIP_DB_FOR_TEST_EVENTS && !event.livemode) {
              console.log('Skipping database operations for test event');
              await markEventProcessed(event.id);
              break;
            }
            // Update checkout session record
            await updateCheckoutSession(session.id, true);
            // Parse metadata with standard keys
            const metadata = session.metadata;
            // Handle course purchases
            if (metadata[METADATA_KEYS.COURSE_ID] && metadata[METADATA_KEYS.IS_RENEWAL] !== 'true') {
              // Validate required metadata
              const requiredKeys = [
                METADATA_KEYS.USER_ID,
                METADATA_KEYS.COURSE_ID,
                METADATA_KEYS.DAYS_OF_ACCESS
              ];
              if (!validateMetadata(metadata, requiredKeys)) {
                console.error('Missing required metadata for course purchase:', metadata);
                await recordWebhookError(event.id, 'Missing required metadata for course purchase');
                break;
              }
              const userId = metadata[METADATA_KEYS.USER_ID];
              const courseId = metadata[METADATA_KEYS.COURSE_ID];
              const daysOfAccess = parseInt(metadata[METADATA_KEYS.DAYS_OF_ACCESS] || '30', 10);
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysOfAccess);
              // Create enrollment
              const { data: enrollment, error: enrollmentError } = await supabase.from('course_enrollments').insert({
                user_id: userId,
                course_id: courseId,
                status: 'active',
                enrolled_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                payment_id: session.id
              }).select().single();
              if (enrollmentError) {
                console.error('Error creating enrollment:', enrollmentError);
                await recordWebhookError(event.id, `Error creating enrollment: ${enrollmentError.message}`);
                throw enrollmentError;
              }
              // Track analytics
              await supabase.from('analytics_events').insert({
                event_type: 'course_purchase',
                user_id: userId,
                properties: {
                  courseId,
                  source: metadata[METADATA_KEYS.SOURCE] || 'checkout',
                  session_id: session.id
                },
                created_at: new Date().toISOString()
              });
            } else if (metadata[METADATA_KEYS.COURSE_ID] && metadata[METADATA_KEYS.IS_RENEWAL] === 'true') {
              // Validate required metadata
              const requiredKeys = [
                METADATA_KEYS.USER_ID,
                METADATA_KEYS.COURSE_ID,
                METADATA_KEYS.DAYS_OF_ACCESS
              ];
              if (!validateMetadata(metadata, requiredKeys)) {
                console.error('Missing required metadata for course renewal:', metadata);
                await recordWebhookError(event.id, 'Missing required metadata for course renewal');
                break;
              }
              const userId = metadata[METADATA_KEYS.USER_ID];
              const courseId = metadata[METADATA_KEYS.COURSE_ID];
              const daysOfAccess = parseInt(metadata[METADATA_KEYS.DAYS_OF_ACCESS] || '30', 10);
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysOfAccess);
              // Update existing enrollment
              const { error: updateError } = await supabase.from('course_enrollments').update({
                status: 'active',
                expires_at: expiresAt.toISOString(),
                renewed_at: new Date().toISOString(),
                notification_sent: false,
                renewal_payment_id: session.id,
                renewal_count: supabase.rpc('increment', {
                  x: 1
                })
              }).match({
                user_id: userId,
                course_id: courseId
              });
              if (updateError) {
                console.error('Error updating enrollment:', updateError);
                await recordWebhookError(event.id, `Error updating enrollment: ${updateError.message}`);
                throw updateError;
              }
              // Track analytics
              await supabase.from('analytics_events').insert({
                event_type: 'course_renewal',
                user_id: userId,
                properties: {
                  courseId,
                  source: metadata[METADATA_KEYS.SOURCE] || 'checkout',
                  session_id: session.id
                },
                created_at: new Date().toISOString()
              });
            } else if (session.subscription) {
              // Validate required metadata
              const requiredKeys = [
                METADATA_KEYS.USER_ID
              ];
              if (!validateMetadata(metadata, requiredKeys)) {
                console.error('Missing required metadata for subscription:', metadata);
                await recordWebhookError(event.id, 'Missing required metadata for subscription');
                break;
              }
              const userId = metadata[METADATA_KEYS.USER_ID];
              if (!userId) {
                console.error('No userId found in session metadata');
                await recordWebhookError(event.id, 'No userId found in session metadata');
                break;
              }
              const subscription = await stripe.subscriptions.retrieve(session.subscription);
              // Create or update subscription record
              const { error: subscriptionError } = await supabase.from('user_subscriptions').upsert({
                user_id: userId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: session.customer,
                status: subscription.status,
                tier: metadata[METADATA_KEYS.SUBSCRIPTION_TIER] || 'unlimited',
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              if (subscriptionError) {
                console.error('Error upserting subscription:', subscriptionError);
                await recordWebhookError(event.id, `Error upserting subscription: ${subscriptionError.message}`);
                throw subscriptionError;
              }
              // Determine event type for analytics
              const isUpgrade = metadata.isUpgrade === 'true';
              const analyticsEventType = isUpgrade ? 'subscription_upgrade' : 'subscription_purchase';
              // Track analytics
              await supabase.from('analytics_events').insert({
                event_type: analyticsEventType,
                user_id: userId,
                properties: {
                  tier: metadata[METADATA_KEYS.SUBSCRIPTION_TIER] || 'unlimited',
                  source: metadata[METADATA_KEYS.SOURCE] || 'checkout',
                  session_id: session.id
                },
                created_at: new Date().toISOString()
              });
            }
            break;
          }
        case 'customer.subscription.updated':
          {
            const subscription = event.data.object;
            console.log('Processing customer.subscription.updated:', subscription.id);
            if (SKIP_DB_FOR_TEST_EVENTS && !event.livemode) {
              console.log('Skipping database operations for test event');
              await markEventProcessed(event.id);
              break;
            }
            // Update subscription record
            const { error: updateError } = await supabase.from('user_subscriptions').update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString()
            }).match({
              stripe_subscription_id: subscription.id
            });
            if (updateError) {
              console.error('Error updating subscription:', updateError);
              await recordWebhookError(event.id, `Error updating subscription: ${updateError.message}`);
              throw updateError;
            }
            break;
          }
        case 'customer.subscription.deleted':
          {
            const subscription = event.data.object;
            console.log('Processing customer.subscription.deleted:', subscription.id);
            if (SKIP_DB_FOR_TEST_EVENTS && !event.livemode) {
              console.log('Skipping database operations for test event');
              await markEventProcessed(event.id);
              break;
            }
            // Update subscription record
            const { error: updateError } = await supabase.from('user_subscriptions').update({
              status: 'canceled',
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
              ended_at: new Date().toISOString()
            }).match({
              stripe_subscription_id: subscription.id
            });
            if (updateError) {
              console.error('Error updating subscription:', updateError);
              await recordWebhookError(event.id, `Error updating subscription: ${updateError.message}`);
              throw updateError;
            }
            break;
          }
        case 'payment_intent.succeeded':
          {
            const paymentIntent = event.data.object;
            console.log('Processing payment_intent.succeeded:', paymentIntent.id);
            // Skip database operations for test events if configured
            if (SKIP_DB_FOR_TEST_EVENTS && !event.livemode) {
              console.log('Skipping database operations for test event');
              await markEventProcessed(event.id);
              break;
            }
            // Update checkout session record if exists
            await updateCheckoutSession(paymentIntent.id, true);
            // Get metadata
            const metadata = paymentIntent.metadata;
            // Skip if missing required metadata
            if (!metadata[METADATA_KEYS.USER_ID]) {
              console.error('Missing user ID in payment intent metadata');
              await recordWebhookError(event.id, 'Missing user ID in payment intent metadata');
              break;
            }
            const userId = metadata[METADATA_KEYS.USER_ID];
            // Handle course purchases
            if (metadata[METADATA_KEYS.COURSE_ID] && metadata[METADATA_KEYS.IS_RENEWAL] !== 'true' && metadata[METADATA_KEYS.PURCHASE_TYPE] === 'course') {
              // Validate required metadata
              const requiredKeys = [
                METADATA_KEYS.USER_ID,
                METADATA_KEYS.COURSE_ID,
                METADATA_KEYS.DAYS_OF_ACCESS
              ];
              if (!validateMetadata(metadata, requiredKeys)) {
                console.error('Missing required metadata for course purchase:', metadata);
                await recordWebhookError(event.id, 'Missing required metadata for course purchase');
                break;
              }
              const courseId = metadata[METADATA_KEYS.COURSE_ID];
              const daysOfAccess = parseInt(metadata[METADATA_KEYS.DAYS_OF_ACCESS] || '30', 10);
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysOfAccess);
              // Create enrollment
              const { data: enrollment, error: enrollmentError } = await supabase.from('course_enrollments').insert({
                user_id: userId,
                course_id: courseId,
                status: 'active',
                enrolled_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                payment_id: paymentIntent.id
              }).select().single();
              if (enrollmentError) {
                console.error('Error creating enrollment:', enrollmentError);
                await recordWebhookError(event.id, `Error creating enrollment: ${enrollmentError.message}`);
                break;
              }
              // Track analytics
              await supabase.from('analytics_events').insert({
                event_type: 'course_purchase',
                user_id: userId,
                properties: {
                  courseId,
                  source: metadata[METADATA_KEYS.SOURCE] || 'checkout',
                  payment_id: paymentIntent.id,
                  is_embedded: true
                },
                created_at: new Date().toISOString()
              });
            } else if (metadata[METADATA_KEYS.COURSE_ID] && metadata[METADATA_KEYS.IS_RENEWAL] === 'true' && metadata[METADATA_KEYS.PURCHASE_TYPE] === 'course') {
              // Validate required metadata
              const requiredKeys = [
                METADATA_KEYS.USER_ID,
                METADATA_KEYS.COURSE_ID,
                METADATA_KEYS.DAYS_OF_ACCESS
              ];
              if (!validateMetadata(metadata, requiredKeys)) {
                console.error('Missing required metadata for course renewal:', metadata);
                await recordWebhookError(event.id, 'Missing required metadata for course renewal');
                break;
              }
              const courseId = metadata[METADATA_KEYS.COURSE_ID];
              const daysOfAccess = parseInt(metadata[METADATA_KEYS.DAYS_OF_ACCESS] || '30', 10);
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysOfAccess);
              // Update existing enrollment
              const { error: updateError } = await supabase.from('course_enrollments').update({
                status: 'active',
                expires_at: expiresAt.toISOString(),
                renewed_at: new Date().toISOString(),
                notification_sent: false,
                renewal_payment_id: paymentIntent.id,
                renewal_count: supabase.rpc('increment', {
                  x: 1
                })
              }).match({
                user_id: userId,
                course_id: courseId
              });
              if (updateError) {
                console.error('Error updating enrollment:', updateError);
                await recordWebhookError(event.id, `Error updating enrollment: ${updateError.message}`);
                break;
              }
              // Track analytics
              await supabase.from('analytics_events').insert({
                event_type: 'course_renewal',
                user_id: userId,
                properties: {
                  courseId,
                  source: metadata[METADATA_KEYS.SOURCE] || 'checkout',
                  payment_id: paymentIntent.id,
                  is_embedded: true
                },
                created_at: new Date().toISOString()
              });
            } else if (metadata[METADATA_KEYS.SUBSCRIPTION_TIER] && metadata[METADATA_KEYS.INTERVAL] && metadata[METADATA_KEYS.PURCHASE_TYPE] === 'subscription') {
              // Get the customer and price info from metadata
              const subscriptionTier = metadata[METADATA_KEYS.SUBSCRIPTION_TIER];
              const interval = metadata[METADATA_KEYS.INTERVAL];
              const priceId = metadata.price_id;
              const customerId = paymentIntent.customer;
              if (!customerId) {
                console.error('No customer ID found in payment intent');
                await recordWebhookError(event.id, 'No customer ID found in payment intent');
                break;
              }
              // Create the subscription using the PaymentIntent's payment method
              try {
                // Get the payment method from the payment intent
                const paymentMethod = paymentIntent.payment_method;
                if (!paymentMethod) {
                  console.error('No payment method found in payment intent');
                  await recordWebhookError(event.id, 'No payment method found in payment intent');
                  break;
                }
                // Create the subscription
                const subscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [
                    {
                      price: priceId
                    }
                  ],
                  default_payment_method: paymentMethod,
                  metadata: {
                    user_id: userId,
                    subscription_tier: subscriptionTier,
                    interval: interval
                  }
                });
                // Create or update subscription record
                const { error: subscriptionError } = await supabase.from('user_subscriptions').upsert({
                  user_id: userId,
                  stripe_subscription_id: subscription.id,
                  stripe_customer_id: customerId,
                  status: subscription.status,
                  tier: subscriptionTier,
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  cancel_at_period_end: subscription.cancel_at_period_end,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                if (subscriptionError) {
                  console.error('Error upserting subscription:', subscriptionError);
                  await recordWebhookError(event.id, `Error upserting subscription: ${subscriptionError.message}`);
                  break;
                }
                // Track analytics
                await supabase.from('analytics_events').insert({
                  event_type: 'subscription_purchase',
                  user_id: userId,
                  properties: {
                    tier: subscriptionTier,
                    interval: interval,
                    source: metadata[METADATA_KEYS.SOURCE] || 'checkout',
                    payment_id: paymentIntent.id,
                    subscription_id: subscription.id,
                    is_embedded: true
                  },
                  created_at: new Date().toISOString()
                });
              } catch (error) {
                console.error('Error creating subscription:', error);
                await recordWebhookError(event.id, `Error creating subscription: ${error.message}`);
                break;
              }
            } else {
              console.log('Unhandled payment intent metadata type:', metadata);
            }
            // Mark event as processed
            await markEventProcessed(event.id);
            break;
          }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      // Mark event as processed
      await markEventProcessed(event.id);
    } catch (error) {
      console.error('Error processing event:', error);
      await recordWebhookError(event.id, error instanceof Error ? error.message : 'Error processing event');
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Error processing event',
        code: ERROR_CODES.WEBHOOK_PROCESSING
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Return success
    return new Response(JSON.stringify({
      received: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      code: ERROR_CODES.WEBHOOK_PROCESSING
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
};
// Start the server
Deno.serve(handler);
