import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Input validation schema
const portalRequestSchema = z.object({
  subscription_id: z.string(),
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
    const validationResult = portalRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error },
        { status: 400 }
      );
    }
    
    const { subscription_id } = validationResult.data;
    
    // Get subscription from the database
    const { data: subscriptionData, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription_id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (subError || !subscriptionData) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // Get Stripe customer ID
    const customerId = subscriptionData.stripe_customer_id;
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID not found' },
        { status: 404 }
      );
    }
    
    // Create return URL based on the origin
    const origin = req.headers.get('origin') || process.env.APP_URL || 'http://localhost:3000';
    const returnUrl = `${origin}/account`;
    
    // Create Stripe portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
} 