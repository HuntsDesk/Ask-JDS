import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate input with zod
const analyticsEventSchema = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  user_id: z.string().uuid().optional(),
  properties: z.record(z.any()),
  session_id: z.string().optional(),
  created_at: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate the input
    const validationResult = analyticsEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error },
        { status: 400 }
      );
    }
    
    const event = validationResult.data;
    
    // Insert event into analytics_events table
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([
        {
          id: event.id,
          event_type: event.event_type,
          user_id: event.user_id,
          properties: event.properties,
          session_id: event.session_id,
          created_at: event.created_at,
          processed: false,
        },
      ]);
      
    if (error) {
      console.error('Error inserting analytics event:', error);
      return NextResponse.json(
        { error: 'Failed to store analytics event' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, id: event.id });
  } catch (error) {
    console.error('Error processing analytics event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 