import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserContext } from '@/context/UserContext';
import { createUnlimitedSubscriptionCheckout } from '@/lib/stripe/checkout';
import { trackEvent, AnalyticsEventType } from '@/lib/flotiq/analytics';

interface SubscriptionTierProps {
  title: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  currentTier?: boolean;
}

export const SubscriptionTier: React.FC<SubscriptionTierProps> = ({
  title,
  description,
  monthlyPrice,
  yearlyPrice,
  features,
  popular = false,
  currentTier = false
}) => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [isMonthly, setIsMonthly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const priceDisplay = isMonthly ? (
    <div>
      <span className="text-3xl font-bold">${monthlyPrice}</span>
      <span className="text-gray-500">/month</span>
    </div>
  ) : (
    <div>
      <span className="text-3xl font-bold">${yearlyPrice}</span>
      <span className="text-gray-500">/year</span>
      <div className="text-sm text-green-600 font-medium mt-1">
        Save ${monthlyPrice * 12 - yearlyPrice}
      </div>
    </div>
  );
  
  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login?redirectTo=' + encodeURIComponent('/subscribe'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Track subscription initiation
      trackEvent(
        AnalyticsEventType.CHECKOUT_INITIATED,
        user.id,
        {
          checkout_type: 'subscription',
          subscription_type: title.toLowerCase(),
          plan_interval: isMonthly ? 'month' : 'year',
          price: isMonthly ? monthlyPrice : yearlyPrice
        }
      );
      
      const checkoutResponse = await createUnlimitedSubscriptionCheckout(
        user.id, 
        isMonthly ? 'month' : 'year'
      );
      
      // Redirect to checkout
      window.location.href = checkoutResponse.url;
    } catch (error) {
      console.error('Error creating subscription checkout:', error);
      
      // Track error
      if (user) {
        trackEvent(
          AnalyticsEventType.CHECKOUT_FAILED,
          user.id,
          {
            checkout_type: 'subscription',
            subscription_type: title.toLowerCase(),
            plan_interval: isMonthly ? 'month' : 'year',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className={`w-full ${popular ? 'border-primary shadow-lg' : ''}`}>
      {popular && (
        <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-center space-x-4 mb-4">
            <div 
              className={`cursor-pointer py-1 px-3 rounded ${isMonthly ? 'bg-primary text-primary-foreground' : 'text-gray-500'}`}
              onClick={() => setIsMonthly(true)}
            >
              Monthly
            </div>
            <div 
              className={`cursor-pointer py-1 px-3 rounded ${!isMonthly ? 'bg-primary text-primary-foreground' : 'text-gray-500'}`}
              onClick={() => setIsMonthly(false)}
            >
              Yearly
            </div>
          </div>
          {priceDisplay}
        </div>
        
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {currentTier ? (
          <Button 
            className="w-full" 
            variant="outline" 
            disabled
          >
            Current Plan
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : `Subscribe Now`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export const SubscriptionCheckout: React.FC = () => {
  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Get unlimited access to all courses and features with our subscription plans. Choose the option that works best for you.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <SubscriptionTier
          title="Free"
          description="Basic access to get you started"
          monthlyPrice={0}
          yearlyPrice={0}
          features={[
            "10 messages per month",
            "Preview course content",
            "Community forum access"
          ]}
        />
        
        <SubscriptionTier
          title="Premium"
          description="Enhanced features for serious learners"
          monthlyPrice={9.99}
          yearlyPrice={99.99}
          popular={true}
          features={[
            "Unlimited messages",
            "Premium support",
            "Enhanced AI features",
            "Study tools and flashcards",
            "No course access"
          ]}
        />
        
        <SubscriptionTier
          title="Unlimited"
          description="Full platform access and benefits"
          monthlyPrice={19.99}
          yearlyPrice={199.99}
          features={[
            "Everything in Premium",
            "Access to all courses",
            "Early access to new content",
            "Downloadable resources",
            "Priority support"
          ]}
        />
      </div>
    </div>
  );
};

export default SubscriptionCheckout; 