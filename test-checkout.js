// Test script for checkout flow
const testCheckout = async () => {
  const supabaseUrl = 'https://prbbuxgirnecbkpdpgcb.supabase.co';
  
  try {
    console.log('Step 1: Getting user auth token...');
    // You'll need to modify this with a valid token for testing
    const userToken = ''; // Insert a valid token here for testing
    
    if (!userToken) {
      console.error('No user token provided. Please add a valid token to test-checkout.js');
      return;
    }
    
    console.log('Step 2: Calling checkout edge function...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        courseId: '12345', // Use a valid course ID from your database
        userId: 'current-user-id', // Will be extracted from the token
        isRenewal: false,
        origin: 'http://localhost:5173'
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    if (!response.ok) {
      console.error('Checkout failed with status:', response.status);
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        const textResponse = await response.text();
        console.error('Error response text:', textResponse);
      }
      return;
    }
    
    const data = await response.json();
    console.log('Checkout response:', data);
    
    if (data.url) {
      console.log('Checkout URL:', data.url);
    } else {
      console.error('No checkout URL returned');
    }
    
  } catch (error) {
    console.error('Error testing checkout:', error);
  }
};

// You'll need to run this in a browser context with a valid auth token
console.log('Run this script in a browser console after logging in to test the checkout flow.'); 