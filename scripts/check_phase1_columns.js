#!/usr/bin/env node

// Script to check if Phase 1 columns already exist in the database
// Run with: node scripts/check_phase1_columns.js
// Requires: npm install @supabase/supabase-js dotenv

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking if Phase 1 columns exist in the database...');
  
  try {
    // Check user_subscriptions.stripe_price_id
    const { data: userSubsCols, error: userSubsError } = await supabase
      .rpc('check_column_exists', {
        p_table_name: 'user_subscriptions',
        p_column_name: 'stripe_price_id'
      });
    
    if (userSubsError) throw userSubsError;
    
    // Check course_enrollments.stripe_price_id
    const { data: courseEnrollPriceIdCols, error: courseEnrollPriceIdError } = await supabase
      .rpc('check_column_exists', {
        p_table_name: 'course_enrollments',
        p_column_name: 'stripe_price_id'
      });
    
    if (courseEnrollPriceIdError) throw courseEnrollPriceIdError;
    
    // Check course_enrollments.stripe_payment_intent_id
    const { data: courseEnrollPaymentIntentCols, error: courseEnrollPaymentIntentError } = await supabase
      .rpc('check_column_exists', {
        p_table_name: 'course_enrollments',
        p_column_name: 'stripe_payment_intent_id'
      });
    
    if (courseEnrollPaymentIntentError) throw courseEnrollPaymentIntentError;
    
    // Display results
    console.log('====== Phase 1 Column Verification ======');
    console.log(`user_subscriptions.stripe_price_id: ${userSubsCols ? 'EXISTS ✅' : 'MISSING ❌'}`);
    console.log(`course_enrollments.stripe_price_id: ${courseEnrollPriceIdCols ? 'EXISTS ✅' : 'MISSING ❌'}`);
    console.log(`course_enrollments.stripe_payment_intent_id: ${courseEnrollPaymentIntentCols ? 'EXISTS ✅' : 'MISSING ❌'}`);
    
    // Check has_course_access function
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'has_course_access')
      .limit(1);
    
    if (functionsError) throw functionsError;
    
    if (functions && functions.length > 0) {
      console.log(`\nhas_course_access function: EXISTS ✅`);
      
      // Check if function includes stripe_price_id check
      const functionCode = functions[0].prosrc;
      const checksStripePriceId = functionCode.includes('stripe_price_id');
      
      console.log(`has_course_access checks stripe_price_id: ${checksStripePriceId ? 'YES ✅' : 'NO ❌'}`);
    } else {
      console.log(`\nhas_course_access function: MISSING ❌`);
    }
    
    console.log('\nRecommendation:');
    if (!userSubsCols || !courseEnrollPriceIdCols || !courseEnrollPaymentIntentCols) {
      console.log('Some columns are missing. You should continue with Phase 1 implementation.');
    } else {
      console.log('All required columns already exist. You can proceed to Phase 2.');
    }
    
  } catch (error) {
    console.error('Error checking columns:', error);
  }
}

// First create the function to check if columns exist
async function createHelperFunction() {
  const { error } = await supabase.rpc('create_check_column_function');
  
  if (error) {
    // If the function doesn't exist, create it
    const { error: createError } = await supabase
      .rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION check_column_exists(p_table_name text, p_column_name text)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            column_exists boolean;
          BEGIN
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = p_table_name
              AND column_name = p_column_name
            ) INTO column_exists;
            
            RETURN column_exists;
          END;
          $$;
          
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
        `
      });
      
    if (createError) {
      console.error('Error creating helper functions:', createError);
      process.exit(1);
    }
  }
  
  await checkColumns();
}

createHelperFunction(); 