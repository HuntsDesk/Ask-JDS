// Script to manually activate a subscription
// Run with: node manual-activate.js

const userId = 'a3a0fd64-7c2b-4f2f-968c-5fc91e73d576'; // Your user ID
const priceId = 'price_1RGYI5BAYVpTe3LyxrZuofBR'; // Unlimited tier price ID

// Function to manually activate subscription by direct database update
async function directActivateSubscription() {
  console.log(`Directly activating subscription for user ${userId} with price ${priceId}`);
  
  // Create Supabase client with service key
  const { createClient } = await import('@supabase/supabase-js');
  
  // Get Supabase credentials from environment (.env file)
  const dotenv = await import('dotenv');
  dotenv.config();
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    console.error('Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
    return false;
  }
  
  // Create client with service role key for direct database access
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Set end date to 1 month from now
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    // Check if subscription already exists
    console.log('Checking for existing subscription...');
    const { data: existingSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (subError) {
      console.error('Error checking for existing subscription:', subError);
      return false;
    }
    
    console.log('Existing subscription:', existingSub?.id || 'None');
    
    // Create or update subscription record
    if (existingSub) {
      // Update existing subscription
      console.log(`Updating existing subscription: ${existingSub.id}`);
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          user_id: userId,
          subscription_id: `manual_activation_${Date.now()}`,
          price_id: priceId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);
        
      if (updateError) {
        console.error('Failed to update subscription:', updateError);
        return false;
      }
      
      console.log('Successfully updated subscription');
    } else {
      // Create new subscription
      console.log('Creating new subscription...');
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_id: `manual_activation_${Date.now()}`,
          price_id: priceId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          quantity: 1
        });
        
      if (insertError) {
        console.error('Failed to create subscription:', insertError);
        return false;
      }
      
      console.log('Successfully created new subscription');
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error activating subscription:', error);
    return false;
  }
}

// Execute the function
directActivateSubscription()
  .then(success => {
    console.log(success ? 'Subscription activated successfully!' : 'Failed to activate subscription');
    // Make sure to exit properly when done
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(err => {
    console.error('Error in activation script:', err);
    process.exit(1);
  }); 