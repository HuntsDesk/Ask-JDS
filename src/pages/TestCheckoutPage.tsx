import { useState } from 'react';
import { createSubscriptionCheckout, createCourseCheckout, createUnlimitedSubscriptionCheckout } from '../lib/stripe/checkout';
import { createCustomerPortalSession } from '../lib/subscription';
import { useAuth } from '../lib/auth';
import { toast } from '../hooks/use-toast';

export default function TestCheckoutPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testUnlimitedSubscription = async () => {
    setLoading(true);
    setStatus('Testing unlimited subscription checkout...');
    try {
      const result = await createUnlimitedSubscriptionCheckout('month');
      if (result.url) {
        setStatus(`Success! Redirecting to checkout...`);
        window.location.href = result.url;
      } else if (result.error) {
        setStatus(`Error: ${result.error}`);
        toast({
          title: 'Checkout Error',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error testing unlimited subscription:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testSubscription = async () => {
    setLoading(true);
    setStatus('Testing subscription checkout...');
    try {
      const result = await createSubscriptionCheckout({
        tier: 'unlimited',
        interval: 'month'
      });
      if (result.url) {
        setStatus(`Success! Redirecting to checkout...`);
        window.location.href = result.url;
      } else if (result.error) {
        setStatus(`Error: ${result.error}`);
        toast({
          title: 'Checkout Error',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error testing subscription:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testCourseCheckout = async () => {
    setLoading(true);
    setStatus('Testing course checkout...');
    try {
      // Use a real course ID from your database - Civil Procedure
      const result = await createCourseCheckout('78b1d8b7-3cb6-4cc5-8dcc-8cf4ac498b66');
      if (result.url) {
        setStatus(`Success! Redirecting to checkout...`);
        window.location.href = result.url;
      } else if (result.error) {
        setStatus(`Error: ${result.error}`);
        toast({
          title: 'Checkout Error',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error testing course checkout:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testCustomerPortal = async () => {
    setLoading(true);
    setStatus('Testing customer portal...');
    try {
      if (!user?.id) {
        setStatus('Error: User not authenticated');
        toast({
          title: 'Error',
          description: 'You must be logged in to access the customer portal',
          variant: 'destructive'
        });
        return;
      }
      
      const url = await createCustomerPortalSession(user.id);
      if (url) {
        setStatus(`Success! Redirecting to portal...`);
        window.location.href = url;
      } else {
        setStatus('Error: Could not create customer portal session');
        toast({
          title: 'Portal Error',
          description: 'Could not create customer portal session',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error testing customer portal:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Portal Error',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Test Stripe Integration</h1>
      
      {!user && (
        <div className="bg-yellow-100 p-4 rounded mb-4 text-yellow-800 border border-yellow-300">
          You must be logged in to test checkout functions.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-lg shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Subscription Tests</h2>
          <button 
            onClick={testUnlimitedSubscription} 
            disabled={loading || !user}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50 transition-colors"
          >
            Test Unlimited Subscription
          </button>

          <button 
            onClick={testSubscription} 
            disabled={loading || !user}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50 transition-colors"
          >
            Test Subscription API
          </button>
        </div>

        <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-lg shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Course & Portal Tests</h2>
          <button 
            onClick={testCourseCheckout} 
            disabled={loading || !user}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50 transition-colors"
          >
            Test Course Checkout
          </button>

          <button 
            onClick={testCustomerPortal} 
            disabled={loading || !user}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded disabled:opacity-50 transition-colors"
          >
            Test Customer Portal
          </button>
        </div>
      </div>

      {loading && (
        <div className="animate-pulse bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
          <p className="text-blue-800 font-medium">Processing...</p>
        </div>
      )}

      {status && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Status:</h3>
          <pre className="whitespace-pre-wrap bg-white p-3 rounded border text-sm">{status}</pre>
        </div>
      )}
    </div>
  );
} 