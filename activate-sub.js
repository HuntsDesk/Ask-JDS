// Script to manually activate a subscription
// Run with: node activate-sub.js

const userId = 'a3a0fd64-7c2b-4f2f-968c-5fc91e73d576';
const priceId = 'price_1RGYI5BAYVpTe3LyxrZuofBR';

async function activateSubscription() {
  console.log(`Activating subscription for user ${userId} with price ${priceId}`);
  
  // Get API key from env
  const apiKey = process.env.SUPABASE_ANON_KEY || '';
  if (!apiKey) {
    console.error('No API key found in environment');
    return;
  }
  
  console.log('Using API key (first 10 chars):', apiKey.substring(0, 10) + '...');
  
  try {
    // First check if a subscription already exists
    const checkResponse = await fetch(`https://prbbuxgirnecbkpdpgcb.supabase.co/rest/v1/user_subscriptions?user_id=eq.${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      console.error('Failed to check existing subscriptions:', checkResponse.status, errorText);
      return;
    }
    
    const existingSubscriptions = await checkResponse.json();
    console.log('Found existing subscriptions:', existingSubscriptions.length);
    
    if (existingSubscriptions.length > 0) {
      // Update the existing subscription
      const subId = existingSubscriptions[0].id;
      console.log(`Updating existing subscription with ID: ${subId}`);
      
      const updateResponse = await fetch(`https://prbbuxgirnecbkpdpgcb.supabase.co/rest/v1/user_subscriptions?id=eq.${subId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'active',
          price_id: priceId,
          updated_at: new Date().toISOString()
        })
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update subscription:', updateResponse.status, errorText);
        return;
      }
      
      const updatedData = await updateResponse.json();
      console.log('Subscription updated successfully:', updatedData);
    } else {
      // Create a new subscription
      const createResponse = await fetch('https://prbbuxgirnecbkpdpgcb.supabase.co/rest/v1/user_subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          subscription_id: `manual_activation_${Date.now()}`,
          price_id: priceId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Failed to create subscription:', createResponse.status, errorText);
        return;
      }
      
      const createdData = await createResponse.json();
      console.log('Subscription created successfully:', createdData);
    }
  } catch (error) {
    console.error('Error activating subscription:', error);
  }
}

activateSubscription().catch(console.error); 