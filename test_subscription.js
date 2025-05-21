// Simple script to test the subscription activation function
// Run with: node test_subscription.js

const priceId = 'price_1RGYI5BAYVpTe3LyxrZuofBR'; // Unlimited tier price ID

// Get the URL from command line args or use default
const url = process.argv[2] || 'http://localhost:54321/functions/v1/activate-subscription';

// Get token from user input or env
const userToken = process.argv[3] || process.env.SUPABASE_AUTH_TOKEN;

if (!userToken) {
  console.error('Please provide an auth token as the third argument or set SUPABASE_AUTH_TOKEN env variable');
  process.exit(1);
}

async function testActivation() {
  console.log(`Testing subscription activation with:
- URL: ${url}
- PriceID: ${priceId}
- Token: ${userToken.substring(0, 10)}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ priceId })
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error testing activation:', error);
    return { success: false, error: error.message };
  }
}

testActivation(); 