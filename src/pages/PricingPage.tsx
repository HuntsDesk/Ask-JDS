import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSubscriptionWithTier } from '@/hooks/useSubscription';
import { PricingTopBar } from '@/components/pricing/PricingTopBar';
import { createCheckoutSession } from '@/lib/subscription';
import { StripeCheckoutDialog } from '@/components/stripe/StripeCheckoutDialog';
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useDynamicPricing } from '@/hooks/useDynamicPricing';

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackSubscription } = useAnalytics();
  const { tierName, isActive: hasActiveSubscription } = useSubscriptionWithTier();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentTierName, setCurrentTierName] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use dynamic pricing hook
  const { pricingTiers, masterFeatures, isLoading: isPricingLoading, error: pricingError } = useDynamicPricing();

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setClientSecret(null);
    setCurrentTierName(null);
  };

  const initiateSubscription = async (tierName: string) => {
    try {
      setIsLoading(true);
      setCurrentTierName(tierName);
      
      // Track checkout initiation
      const currentTier = pricingTiers.find(tier => tier.name.toLowerCase() === tierName.toLowerCase());
      if (currentTier) {
        trackSubscription.checkoutStarted(
          tierName.toLowerCase(),
          'month',
          currentTier.price || 0,
          {
            current_plan: hasActiveSubscription ? tierName : 'free',
            features_included: currentTier.features?.length || 0,
            is_upgrade: hasActiveSubscription && tierName !== 'free'
          }
        );
      }
      
      // Show modal immediately with loading state for better UX
      setShowPaymentModal(true);
      
      console.log(`Initiating subscription for tier: ${tierName}`);
      
      const redirectUrlOrClientSecret = await createCheckoutSession(user?.id, tierName.toLowerCase());
      console.log(`Response from createCheckoutSession:`, redirectUrlOrClientSecret);
      
      if (redirectUrlOrClientSecret) {
        // Check if the result is a URL or a client secret
        if (redirectUrlOrClientSecret.startsWith('/checkout-confirmation')) {
          console.log('Received checkout-confirmation URL, redirecting...');
          setShowPaymentModal(false); // Close modal before redirect
          window.location.href = redirectUrlOrClientSecret;
        } else if (redirectUrlOrClientSecret.startsWith('http')) {
          console.log('Received direct URL, redirecting...');
          setShowPaymentModal(false); // Close modal before redirect
          window.location.href = redirectUrlOrClientSecret;
        } else {
          console.log('Received client secret, updating modal...');
          setClientSecret(redirectUrlOrClientSecret);
          // Modal is already open, just update with client secret
        }
      } else {
        console.error('No response from createCheckoutSession');
        setShowPaymentModal(false); // Close modal on error
        toast({
          title: 'Error',
          description: 'Failed to create checkout session. Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      setShowPaymentModal(false); // Close modal on error
      
      // Show more detailed error to the user
      let errorMessage = 'Failed to create checkout session. Please try again later.';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: 'Checkout Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (tierName: string) => {
    if (!user) {
      navigate('/login?redirectTo=/pricing');
      return;
    }
    if (tierName === 'Free') {
      // For Free tier, no action needed as this is already their plan
      return;
    }
    // Call initiateSubscription instead of navigating to settings
    initiateSubscription(tierName);
  };

  return (
    <div className="flex flex-col h-screen">
      <PricingTopBar />
      <main className="flex-1 pt-[80px] overflow-hidden">
        <div className="h-full overflow-y-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Ask JDS. Smarter than your group chat, cheaper than a tutor.
              </p>
            </div>

            {/* Unified Card View for all screen sizes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
              {pricingTiers.map((tier) => {
                const TierIcon = tier.icon;
                const isCurrentTier = tierName === tier.name;
                return (
                  <div
                    key={tier.name}
                    className={`relative flex flex-col p-6 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.03] 
                      ${tier.highlight 
                        ? 'bg-orange-500 text-white ring-2 ring-orange-600 dark:ring-orange-400' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }
                    `}
                  >
                    {tier.highlight && (
                      <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                        <span className="bg-orange-600 dark:bg-orange-400 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <TierIcon className={`w-7 h-7 ${tier.highlight ? 'text-white' : 'text-orange-500 dark:text-orange-400'}`} />
                      <h3 className={`text-2xl font-bold ${tier.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier.name}</h3>
                    </div>
                    <div className="mb-4">
                      <span className={`text-3xl font-extrabold ${tier.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier.price}</span>
                      <span className={`text-sm ${tier.highlight ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>/month</span>
                    </div>
                    <p className={`text-sm mb-5 min-h-[60px] ${tier.highlight ? 'text-orange-50' : 'text-gray-600 dark:text-gray-300'}`}>
                      {tier.description}
                    </p>

                    <ul className="space-y-3 mb-6 flex-grow">
                      {masterFeatures.map((feature) => {
                        const tierFeatureInfo = tier.features[feature.id];
                        
                        // Handle the special note for Free tier
                        if (feature.id === 'sample_flashcards_note') {
                          if (tier.name === 'Free' && tierFeatureInfo?.noteOnly) {
                            return (
                              <li key={`${tier.name}-${feature.id}-note`