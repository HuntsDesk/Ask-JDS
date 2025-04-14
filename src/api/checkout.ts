/**
 * Stripe checkout API endpoint
 */
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';

// Define request schema for validation
const checkoutSchema = z.object({
  courseId: z.string().uuid().optional(),
  isRenewal: z.boolean().default(false),
  subscriptionType: z.enum(['unlimited']).optional(),
  interval: z.enum(['month', 'year']).optional()
});

// ENV validation
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Create Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Create a supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API handler for checkout
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1]);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate request body
    const validationResult = checkoutSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.format() 
      });
    }
    
    const { courseId, isRenewal, subscriptionType, interval } = validationResult.data;
    
    // Generate idempotency key
    const idempotencyKey = `checkout_${user.id}_${Date.now()}`;
    
    let sessionData;
    
    // Handle course purchase or renewal
    if (courseId) {
      sessionData = await handleCoursePurchase(user.id, courseId, isRenewal, idempotencyKey);
    }
    // Handle subscription
    else if (subscriptionType === 'unlimited' && interval) {
      sessionData = await handleSubscription(user.id, interval, idempotencyKey);
    }
    // Invalid combination
    else {
      return res.status(400).json({ error: 'Invalid checkout parameters' });
    }
    
    return res.status(200).json(sessionData);
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Return sanitized error
    return res.status(500).json({ 
      error: 'An error occurred during checkout',
      message: error.message
    });
  }
}

/**
 * Handle course purchase or renewal
 */
async function handleCoursePurchase(userId, courseId, isRenewal, idempotencyKey) {
  // Get course details
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, price, days_of_access')
    .eq('id', courseId)
    .single();
    
  if (error || !course) {
    throw new Error(`Course not found: ${error?.message || 'Unknown error'}`);
  }
  
  // Check if user already has access to this course
  if (isRenewal) {
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (enrollmentError || !enrollment) {
      throw new Error('No active enrollment found for renewal');
    }
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: isRenewal 
              ? `Renew Access: ${course.title}` 
              : course.title,
            description: `${course.days_of_access} days of access`,
          },
          unit_amount: Math.round(course.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.APP_URL}/courses/${courseId}?checkout_success=true`,
    cancel_url: `${process.env.APP_URL}/courses/${courseId}?checkout_canceled=true`,
    customer_email: user.email,
    metadata: {
      userId,
      courseId,
      isRenewal: isRenewal ? 'true' : 'false',
      daysOfAccess: course.days_of_access.toString(),
    },
  }, {
    idempotencyKey
  });
  
  return {
    url: session.url,
    sessionId: session.id
  };
}

/**
 * Handle subscription creation
 */
async function handleSubscription(userId, interval, idempotencyKey) {
  // Check if user already has a subscription
  const { data: existingSubscription, error } = await supabase
    .from('user_subscriptions')
    .select('id, stripe_subscription_id, price_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  const isUpgrade = existingSubscription?.price_id === 'price_askjds_monthly';
  
  // Determine price ID
  const priceId = interval === 'month' 
    ? 'price_unlimited_monthly' 
    : 'price_unlimited_annual';
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.APP_URL}/dashboard?subscription_success=true`,
    cancel_url: `${process.env.APP_URL}/dashboard?subscription_canceled=true`,
    customer_email: user.email,
    metadata: {
      userId,
      subscriptionType: 'unlimited',
      interval,
      isUpgrade: isUpgrade ? 'true' : 'false',
      previousTier: isUpgrade ? 'askjds' : '',
    },
  }, {
    idempotencyKey
  });
  
  return {
    url: session.url,
    sessionId: session.id
  };
} 