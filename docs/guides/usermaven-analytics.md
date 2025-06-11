# Usermaven Analytics Integration Guide

This guide explains how to use Usermaven analytics in the Ask JDS application.

## Overview

Usermaven is a privacy-focused analytics platform that helps track user behavior without sacrificing privacy. It offers:

- Cookieless tracking option
- GDPR compliance
- First-party data collection
- Custom event tracking
- User identification
- Cross-domain tracking

## Setup

The Usermaven integration is already set up in the application with the following components:

1. **Configuration**: Environment variables in `.env` file
2. **Provider**: `UsermavenAnalyticsProvider` in `src/contexts/UsermavenContext.tsx`
3. **Hook**: `useAnalytics` in `src/hooks/use-analytics.ts`
4. **Utils**: Helper functions in `src/lib/analytics/usermaven.ts`

## Environment Variables

Usermaven requires two environment variables:

```
# Usermaven Analytics
VITE_USERMAVEN_KEY=your-usermaven-key
VITE_USERMAVEN_TRACKING_HOST=https://a.jdsimplified.com
```

- `VITE_USERMAVEN_KEY`: Your workspace key from Usermaven dashboard
- `VITE_USERMAVEN_TRACKING_HOST`: Our custom tracking domain for white-labeled Usermaven

> **Note**: We're using a custom tracking domain (`a.jdsimplified.com`) rather than the default Usermaven endpoint. This custom domain is managed through our Usermaven white-label setup.

## Basic Usage

### Tracking Events

Use the `useAnalytics` hook to track custom events:

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('button_click', {
      button_name: 'signup_button',
      page: 'homepage'
    });
  };
  
  return <button onClick={handleClick}>Sign Up</button>;
}
```

### Tracking Conversions

For important conversion events, use the `trackConversion` method:

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

function SubscriptionPage() {
  const { trackConversion } = useAnalytics();
  
  const handleSubscribe = () => {
    // Process subscription
    
    // Track the conversion
    trackConversion('subscription', {
      plan: 'premium',
      price: 49.99,
      currency: 'USD'
    });
  };
  
  return <button onClick={handleSubscribe}>Subscribe Now</button>;
}
```

### Identifying Users

When a user logs in or signs up, identify them:

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

function LoginForm() {
  const { identify } = useAnalytics();
  
  const handleLogin = async (email, password) => {
    const user = await loginUser(email, password);
    
    // Identify the user
    identify({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      first_name: user.first_name,
      last_name: user.last_name,
      custom: {
        subscription_plan: user.subscription_plan
      }
    });
    
    // Continue with login process
  };
  
  return <form onSubmit={handleLogin}>...</form>;
}
```

## Common Events to Track

Here are some important events you should track throughout the application:

### User Lifecycle Events

- `signed_up`: When a user creates an account
- `logged_in`: When a user logs in
- `logged_out`: When a user logs out
- `account_updated`: When a user updates their profile

### Subscription Events

- `subscription_started`: When a user starts a subscription
- `subscription_renewed`: When a subscription renews
- `subscription_canceled`: When a user cancels their subscription
- `subscription_changed`: When a user changes their subscription plan

### Content Engagement

- `course_started`: When a user starts a course
- `course_completed`: When a user completes a course
- `lesson_completed`: When a user completes a lesson
- `flashcard_created`: When a user creates a flashcard
- `flashcard_studied`: When a user studies a flashcard

### Chat Interactions

- `chat_started`: When a user starts a new chat
- `chat_message_sent`: When a user sends a message
- `chat_response_received`: When the AI responds to a message

## Best Practices

1. **Be Consistent**: Use consistent event names and property structures
2. **Use Semantic Names**: Event names should be past tense verbs (e.g., `button_clicked`, not `button_click`)
3. **Include Context**: Always include relevant context (page, component, etc.)
4. **Don't Track PII**: Never track personally identifiable information in event properties
5. **Error Handling**: Always wrap tracking calls in try/catch blocks

## Example Implementation

See `src/components/ExampleTrackingComponent.tsx` for a complete example of tracking different types of events.

## Debugging

To verify that events are being tracked properly:

1. Open your browser's developer tools
2. Go to the Network tab
3. Filter for requests to `a.jdsimplified.com` (our custom tracking domain)
4. Perform the action you want to track
5. You should see a request to the tracking endpoint with your event data

You can also check the Usermaven dashboard to see if events are being received.

## Troubleshooting

### Events Not Showing Up

1. Check that `VITE_USERMAVEN_KEY` is set correctly in your `.env` file
2. Verify that `UsermavenAnalyticsProvider` is properly wrapped around your application
3. Make sure you're using the `useAnalytics` hook correctly
4. Check the browser console for any errors

### CORS Issues

If you see CORS errors in the console, make sure your domain is allowed in the Usermaven dashboard.

### Content Security Policy

If you have a Content Security Policy (CSP), make sure to allow:

- `connect-src`: `https://a.jdsimplified.com` (our custom tracking domain)
- `script-src`: `https://cdn.usermaven.com` (for loading the Usermaven script)

> **Note**: Our CloudFront distribution's security headers have been updated to include the necessary CSP directives for the custom tracking domain.

## Further Resources

- [Usermaven Documentation](https://usermaven.com/docs)
- [React SDK Documentation](https://usermaven.com/docs/integrations/react)
- [Usermaven API Reference](https://usermaven.com/docs/api/introduction) 