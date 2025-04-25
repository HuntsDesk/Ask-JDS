// Test script for Edge Function
const testEdgeFunction = async () => {
  try {
    console.log('Testing Edge Function...');
    const response = await fetch('https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/create-checkout-session', {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    const text = await response.text();
    console.log('Response:', text);
    
    return response.ok;
  } catch (error) {
    console.error('Error testing Edge Function:', error);
    return false;
  }
};

// Run the test
testEdgeFunction().then(success => {
  console.log('Test completed. Edge Function is', success ? 'accessible' : 'not accessible');
}); 