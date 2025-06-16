import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useSubscriptionWithTier } from '@/hooks/useSubscription';
import { PricingTopBar } from '@/components/pricing/PricingTopBar';
import { createCheckoutSession } from '@/lib/subscription';
import { StripeCheckoutDialog } from '@/components/stripe/StripeCheckoutDialog';
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { masterFeatures, pricingTiers } from '@/lib/pricingData';

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tierName, isActive: hasActiveSubscription } = useSubscriptionWithTier();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentTierName, setCurrentTierName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setClientSecret(null);
    setCurrentTierName(null);
  };

  const initiateSubscription = async (tierName: string) => {
    try {
      setIsLoading(true);
      setCurrentTierName(tierName);
      
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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
                              <li key={`${tier.name}-${feature.id}-note`} className="flex items-start gap-2.5 text-xs">
                                  <ArrowRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-orange-100' : 'text-orange-500 dark:text-orange-400'}`} />
                                  <span className={`${tier.highlight ? 'text-orange-50' : 'text-gray-500 dark:text-gray-400'}`}>
                                      {feature.displayName}
                                  </span>
                              </li>
                            );
                          } else {
                            return null; // Don't show this note for other tiers
                          }
                        }

                        // For chat messages feature, display the complete text with limits included
                        if (feature.id === 'chat_messages') {
                          return (
                            <li key={`${tier.name}-${feature.id}`} className="flex items-start gap-2.5">
                              {tierFeatureInfo?.included ? (
                                <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-white' : 'text-green-500'}`} />
                              ) : (
                                <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`} />
                              )}
                              <span className={`${tier.highlight ? 'text-white/95' : 'text-gray-700 dark:text-gray-200'} ${!tierFeatureInfo?.included ? 'line-through opacity-60' : ''}`}>
                                {tier.name === 'Free' ? '10 Ask JDS chat messages per month' : 'Unlimited Ask JDS chat messages'}
                              </span>
                            </li>
                          );
                        }

                        // Regular feature rendering for all other features
                        return (
                          <li key={`${tier.name}-${feature.id}`} className="flex items-start gap-2.5">
                            {tierFeatureInfo?.included ? (
                              <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-white' : 'text-green-500'}`} />
                            ) : (
                              <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`} />
                            )}
                            <span className={`${tier.highlight ? 'text-white/95' : 'text-gray-700 dark:text-gray-200'} ${!tierFeatureInfo?.included ? 'line-through opacity-60' : ''}`}>
                              {feature.displayName}
                              {/* Only show value in parentheses for non-chat features that have a specified value */}
                              {feature.id !== 'chat_messages' && tierFeatureInfo?.value && tierFeatureInfo.value !== 'Unlimited' && 
                                <span className={`ml-1 text-xs opacity-80 ${tier.highlight ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                  ({tierFeatureInfo.value})
                                </span>
                              }
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                                      <Button
                    onClick={() => handleSubscribe(tier.name)}
                    variant={tier.buttonVariant as any}
                    size="lg"
                    className={`w-full mt-auto ${ 
                      tier.highlight 
                        ? 'bg-white text-orange-600 hover:bg-gray-100 dark:bg-gray-100 dark:hover:bg-gray-200' 
                        : tier.name === 'Free'
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                          : 'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700'
                    }`}
                      disabled={isCurrentTier || (tier.name === 'Free') || isLoading}
                  >
                      {isLoading && currentTierName === tier.name.toLowerCase() ? (
                        <LoadingSpinner className="h-5 w-5 mr-2" />
                      ) : null}
                    {isCurrentTier || tier.name === 'Free' ? 'Current Plan' : tier.buttonText}
                  </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Payment modal */}
      {showPaymentModal && (
        <StripeCheckoutDialog
          open={showPaymentModal}
          onClose={handleClosePaymentModal}
          clientSecret={clientSecret || 'loading'} // Use 'loading' as placeholder when no client secret yet
          title={`Complete your ${currentTierName} subscription`}
          description="This will give you access to Ask JDS premium features."
          tier={currentTierName}
          onError={(error) => {
            console.error('Payment error:', error);
            toast({
              title: "Error",
              description: error.message || 'Payment failed',
              variant: "destructive",
            });
          }}
        />
      )}
    </div>
  );
} 