# Sentry Integration Guide

## Why Sentry?

Sentry provides real-time error tracking for production applications, helping you:
- Catch errors before users report them
- Get detailed stack traces with source maps
- Monitor performance and slow queries
- Track error rates and trends
- Get alerts for critical issues

## Quick Setup

### 1. Install Sentry

```bash
npm install @sentry/react
```

### 2. Create Sentry Account

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (React)
3. Copy your DSN from the project settings

### 3. Add to Environment Variables

```bash
# .env
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_ENVIRONMENT=production
```

### 4. Initialize Sentry

Create `src/lib/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";
import { logger } from "./logger";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    logger.warn("Sentry DSN not configured");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      return event;
    },
  });
}
```

### 5. Update Error Boundary

Update `src/components/ErrorBoundary.tsx`:

```typescript
import * as Sentry from "@sentry/react";

componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  logger.error('Error caught by boundary:', error, errorInfo);
  
  // Report to Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}
```

### 6. Add to Main Entry Point

Update `src/main.tsx`:

```typescript
import { initSentry } from '@/lib/sentry';

// Initialize Sentry before React
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 7. Add to GitHub Secrets

Add these secrets for CI/CD:
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`

### 8. Track Custom Events

```typescript
import * as Sentry from "@sentry/react";

// Track custom errors
Sentry.captureException(new Error("Payment failed"), {
  tags: {
    section: "checkout",
  },
  extra: {
    priceId,
    userId,
  },
});

// Track custom messages
Sentry.captureMessage("User encountered rate limit", "warning");

// Track performance
const transaction = Sentry.startTransaction({
  name: "chat-message-send",
});
// ... do work
transaction.finish();
```

## Best Practices

1. **Filter Noise**: Use `beforeSend` to filter out non-critical errors
2. **PII Protection**: Enable `maskAllText` in replay integration
3. **Performance**: Use low sample rates in production (0.1 = 10%)
4. **Environments**: Separate dev/staging/production environments
5. **Source Maps**: Upload source maps for better stack traces

## Monitoring Dashboard

Once integrated, you'll see:
- Real-time error feed
- Error trends and patterns
- Performance metrics
- User session replays (on errors)
- Release tracking

## Cost Considerations

- Free tier: 5K errors/month
- Team tier: $26/month for 50K errors
- Scale as needed 