import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Input validation schema for course purchase
const coursePurchaseSchema = z.object({
  courseId: z.string().uuid(),
  isRenewal: z.boolean().optional().default(false),
  daysOfAccess: z.number().optional().default(30),
});

// Input validation schema for subscription
const subscriptionSchema = z.object({
  tier: z.enum(['unlimited']),
  isUpgrade: z.boolean().optional().default(false),
  previousTier: z.string().optional(),
});

// Combined schema for checkout
const checkoutSchema = z.object({
  type: z.enum(['course', 'subscription']),
  course: coursePurchaseSchema.optional(),
  subscription: subscriptionSchema.optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabaseAuthClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request
    const body = await req.json();
    const validationResult = checkoutSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error },
        { status: 400 }
      );
    }
    
    const { type, course, subscription } = validationResult.data;
    
    // Get the user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userProfile?.email) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Generate idempotency key for this request
    const idempotencyKey = `checkout_${user.id}_${uuidv4()}`;
    
    // Create origin URL for success and cancel
    const origin = req.headers.get('origin') || process.env.APP_URL || 'https://localhost:3000';
    
    if (type === 'course' && course) {
      // Handle course purchase checkout
      return await handleCoursePurchase(
        user.id, 
        userProfile.email, 
        course.courseId, 
        origin, 
        idempotencyKey,
        course.isRenewal,
        course.daysOfAccess
      );
    } else if (type === 'subscription' && subscription) {
      // Handle subscription checkout
      return await handleSubscription(
        user.id,
        userProfile.email,
        subscription.tier,
        origin,
        idempotencyKey,
        subscription.isUpgrade,
        subscription.previousTier
      );
    } else {
      return NextResponse.json(
        { error: 'Missing required data for the selected checkout type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

async function handleCoursePurchase(
  userId: string,
  email: string,
  courseId: string,
  origin: string,
  idempotencyKey: string,
  isRenewal: boolean = false,
  daysOfAccess: number = 30
): Promise<NextResponse> {
  try {
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, price')
      .eq('id', courseId)
      .single();
      
    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create(
      {
        customer_email: email,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${isRenewal ? 'Renewal: ' : ''}${course.title}`,
                description: `${daysOfAccess} days of access`,
              },
              unit_amount: course.price ? Math.round(course.price * 100) : 0,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/courses/${courseId}?checkout_cancelled=true`,
        metadata: {
          userId,
          courseId,
          isRenewal: isRenewal ? 'true' : 'false',
          daysOfAccess: daysOfAccess.toString(),
        },
      },
      {
        idempotencyKey,
      }
    );
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating course checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create course checkout session' },
      { status: 500 }
    );
  }
}

async function handleSubscription(
  userId: string,
  email: string,
  tier: string,
  origin: string,
  idempotencyKey: string,
  isUpgrade: boolean = false,
  previousTier?: string
): Promise<NextResponse> {
  try {
    // Determine which price to use
    let priceId: string | undefined;
    
    if (tier === 'unlimited') {
      priceId = process.env.STRIPE_UNLIMITED_PRICE_ID;
    }
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create(
      {
        customer_email: email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/unlimited?checkout_cancelled=true`,
        metadata: {
          userId,
          subscriptionType: tier,
          isUpgrade: isUpgrade ? 'true' : 'false',
          previousTier: previousTier || '',
        },
        subscription_data: {
          metadata: {
            userId,
          },
        },
      },
      {
        idempotencyKey,
      }
    );
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription checkout session' },
      { status: 500 }
    );
  }
} 