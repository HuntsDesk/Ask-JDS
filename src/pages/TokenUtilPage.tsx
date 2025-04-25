import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';

export default function TokenUtilPage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Extract token from local storage
    try {
      const authStorage = localStorage.getItem('ask-jds-auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        if (authData?.access_token) {
          setToken(authData.access_token);
        }
      }
    } catch (error) {
      console.error('Error extracting token:', error);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const checkoutCurlCommand = token ? 
    `curl -i --request POST 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/create-checkout-session' \\
  --header 'Content-Type: application/json' \\
  --header 'Authorization: Bearer ${token}' \\
  --data '{"mode":"subscription","subscriptionTier":"unlimited","interval":"month"}'` : '';

  const webhookCurlCommand = token ?
    `curl -i --request POST 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/stripe-webhook' \\
  --header 'Content-Type: application/json' \\
  --header 'Stripe-Signature: t=1234567890,v1=dummy_signature' \\
  --data '{"id":"evt_test_webhook","object":"event","type":"checkout.session.completed","livemode":false,"data":{"object":{"id":"cs_test_webhook","object":"checkout.session","metadata":{"userId":"test-user-id","purchaseType":"subscription","subscriptionTier":"unlimited","interval":"month"},"subscription":"sub_test123"}}}'` : '';

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">JWT Token Utility</h1>
      
      {!user && (
        <div className="bg-yellow-100 p-4 rounded mb-4 text-yellow-800 border border-yellow-300">
          You must be logged in to access your JWT token.
        </div>
      )}

      {user && token && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold mb-2">Your JWT Token</h2>
            <div className="relative">
              <pre className="bg-white p-3 rounded border text-sm overflow-x-auto whitespace-pre-wrap mb-2">{token}</pre>
              <button 
                onClick={() => copyToClipboard(token)}
                className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold mb-2">Checkout Session cURL Command</h2>
            <div className="relative">
              <pre className="bg-white p-3 rounded border text-sm overflow-x-auto whitespace-pre-wrap mb-2">{checkoutCurlCommand}</pre>
              <button 
                onClick={() => copyToClipboard(checkoutCurlCommand)}
                className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold mb-2">Webhook Test cURL Command</h2>
            <div className="relative">
              <pre className="bg-white p-3 rounded border text-sm overflow-x-auto whitespace-pre-wrap mb-2">{webhookCurlCommand}</pre>
              <button 
                onClick={() => copyToClipboard(webhookCurlCommand)}
                className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {user && !token && (
        <div className="bg-red-100 p-4 rounded mb-4 text-red-800 border border-red-300">
          No JWT token found in your local storage. Please try logging out and logging in again.
        </div>
      )}
    </div>
  );
} 