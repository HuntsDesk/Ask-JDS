// Script to directly update subscriptions via REST API
// Run with: node direct-api.js

// Configuration - update these values as needed
const userId = 'a3a0fd64-7c2b-4f2f-968c-5fc91e73d576'; // Your user ID
const priceId = 'price_1RGYI5BAYVpTe3LyxrZuofBR'; // Unlimited tier price ID
const jwtToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlB0Z3hIdFNzU1d2L0dyaTciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3ByYmJ1eGdpcm5lY2JrcGRwZ2NiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhM2EwZmQ2NC03YzJiLTRmMmYtOTY4Yy01ZmM5MWU3M2Q1NzYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ3NjkwMzk4LCJpYXQiOjE3NDc2ODY3OTgsImVtYWlsIjoidXNlckB1c2VyLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzQ2NTQ2ODMwfV0sInNlc3Npb25faWQiOiJiMzE1NWNmZS1hNDM0LTRiZDUtOWJlMS03NTRmZjk2NDQ4M2YiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.c7HxVJOYQqWmwGZ-A7kbcU15eZt5ugERKUpk9nORnbw';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Define Supabase API details
const supabaseUrl = process.env.SUPABASE_URL || 'https://prbbuxgirnecbkpdpgcb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if we have credentials
if (!supabaseAnonKey) {
  console.error('Missing SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

// Function to check for existing subscription
async function checkExistingSubscription() {
  console.log(`Checking for existing subscription for user ${userId}...`);
  
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=id`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${jwtToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log('Existing subscription data:', JSON.stringify(data, null, 2));
    
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error checking for existing subscription:', error);
    return null;
  }
}

// Function to update existing subscription
async function updateSubscription(subId) {
  console.log(`Updating subscription with ID: ${subId}`);
  
  // Set end date to 1 month from now
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Try a simpler approach - use only basic fields that definitely exist
  const subscriptionData = {
    status: 'active',
    price_id: priceId,
    updated_at: new Date().toISOString()
  };
  
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${subId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${jwtToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(subscriptionData)
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log('Updated subscription:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return false;
  }
}

// Function to directly execute SQL
async function executeSql(query, params = {}) {
  console.log(`Executing SQL: ${query}`);
  console.log(`With parameters:`, params);
  
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          query,
          params
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`SQL execution failed with status ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log('SQL execution result:', result);
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

// Function to activate subscription via direct SQL
async function activateSubscriptionViaSQL() {
  try {
    // Check for existing subscription first
    const existingSub = await checkExistingSubscription();
    
    if (existingSub) {
      console.log(`Updating existing subscription with ID: ${existingSub.id}`);
      
      // Update via SQL directly
      const query = `
        UPDATE user_subscriptions 
        SET status = 'active', 
            price_id = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, price_id
      `;
      
      return await executeSql(query, {
        $1: priceId,
        $2: existingSub.id
      });
    } else {
      console.log('No existing subscription found');
      return false;
    }
  } catch (error) {
    console.error('Error activating subscription via SQL:', error);
    return false;
  }
}

// Main function to activate a subscription
async function activateSubscription() {
  try {
    // Check for existing subscription
    const existingSub = await checkExistingSubscription();
    
    if (!existingSub) {
      console.log('No subscription found to update');
      return false;
    }
    
    // Try simple update first
    try {
      const updateSuccess = await updateSubscription(existingSub.id);
      if (updateSuccess) {
        return true;
      }
    } catch (updateError) {
      console.log('Simple update failed, trying SQL approach...');
    }
    
    // If simple update fails, try SQL approach
    return await activateSubscriptionViaSQL();
  } catch (error) {
    console.error('Error in subscription activation:', error);
    return false;
  }
}

// Run the activation
activateSubscription()
  .then(success => {
    console.log(success ? 'Subscription activated successfully!' : 'Failed to activate subscription');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 