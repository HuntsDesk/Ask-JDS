# Ask JDS - AI-Powered Learning Platform

A modern React application built with Vite, TypeScript, and Supabase that provides AI-powered educational content and subscription-based access to premium features.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Deno (for Supabase Edge Functions)
- Supabase CLI
- Stripe CLI (for webhook testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HuntsDesk/Ask-JDS.git
   cd Ask-JDS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development (uses production database)**
   ```bash
   npm run dev
   ```

   **Note**: Development environment now uses the production database directly for a streamlined workflow.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18.2.0+, TypeScript, Vite 5.4.17, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Runtime**: Deno (Edge Functions), Node.js (Frontend)
- **Payments**: Stripe
- **Authentication**: Supabase Auth
- **State Management**: Tanstack React Query v5.17.19+

### Project Structure

```
├── src/                    # React frontend application
├── supabase/
│   ├── functions/         # Deno Edge Functions
│   ├── migrations/        # Database migrations (production sync)
│   └── config.toml        # Supabase configuration
├── readme/                # Detailed documentation
├── scripts/               # Deployment and utility scripts
└── public/                # Static assets
```

### Development Environment

**Streamlined Setup (January 2025):**
- ✅ **Development uses production database** - No local Supabase required
- ✅ **Simplified workflow** - One environment, no sync issues
- ✅ **Instant production readiness** - Development IS production
- ✅ **Real data testing** - See exactly what users see

**Environment Configuration:**
```bash
# Development now points to production for simplicity
SUPABASE_URL_DEV=https://prbbuxgirnecbkpdpgcb.supabase.co
VITE_SUPABASE_URL_DEV=https://prbbuxgirnecbkpdpgcb.supabase.co
```

## 🔐 Security & Environment

### Recent Security Updates (January 2025)

- ✅ **Removed hardcoded Stripe webhook secrets** from git history using `git filter-branch`
- ✅ **CRITICAL: Completely removed exposed Supabase service keys** from entire git history
  - Removed script files containing hardcoded service keys (`rls_policy_comparison.sh`, `quick_schema_check.sh`, `detailed_schema_comparison.sh`)
  - Removed `.env` and `.env.blank` files from git tracking to prevent future leaks
  - Used `git filter-branch` to eradicate all traces from git history
  - Force-pushed cleaned history to remote repository
  - **Verified**: No exposed keys remain in git history
- ✅ **Implemented secure environment variable handling** for all secrets
- ✅ **Updated Edge Functions** to follow latest Supabase best practices:
  - Uses `Deno.serve` instead of deprecated `serve` import
  - Uses `npm:` specifiers with pinned versions (`npm:@supabase/supabase-js@2.39.3`, `npm:stripe@14.21.0`)
  - Uses async webhook signature verification (`constructEventAsync`) for Deno compatibility
- ✅ **Force-pushed cleaned git history** to remove exposed credentials
- ✅ **Deployed and tested** updated webhook function successfully
- ✅ **Updated Supabase CLI** to latest version (v2.23.4)
- ✅ **Streamlined development workflow** to use production database directly

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase (Development now uses production)
SUPABASE_URL_DEV=https://prbbuxgirnecbkpdpgcb.supabase.co
SUPABASE_ANON_KEY_DEV=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_production_service_role_key

# Production (same as development for streamlined workflow)
SUPABASE_URL_PROD=https://prbbuxgirnecbkpdpgcb.supabase.co
SUPABASE_ANON_KEY_PROD=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY_PROD=your_production_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Application
ENVIRONMENT=development
PUBLIC_APP_URL_DEV=http://localhost:5173
PUBLIC_APP_URL_PROD=https://askjds.com
```

## 💳 Stripe Integration

### Webhook Security

The Stripe webhook function (`supabase/functions/stripe-webhook/index.ts`) implements:

- **Signature verification** using environment-specific webhook secrets
- **Environment-aware configuration** (test/production)
- **Secure error handling** without information leakage
- **Idempotent event processing** to handle webhook retries

### Supported Events

| Event Type | Purpose |
|------------|---------|
| `checkout.session.completed` | Process subscription creation |
| `invoice.payment_succeeded` | Confirm subscription renewals |
| `invoice.payment_failed` | Handle failed payments |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Handle cancellations |

### Testing Webhooks

1. **Set environment variable**:
   ```bash
   export STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_secret
   ```

2. **Run test script**:
   ```bash
   node webhook-test.js
   ```

3. **Test all events**:
   ```bash
   node webhook-test-all.js
   ```

## 🚀 Deployment

### Supabase Edge Functions

**Development vs Production:**
- **Development**: Uses production database directly - no local Supabase needed
- **Edge Functions**: Deploy to production with `supabase functions deploy <function-name>`
- **Secrets**: Set in production with `supabase secrets set`

Deploy the webhook function:
```bash
supabase functions deploy stripe-webhook
```

Set secrets (applies to production environment):
```bash
supabase secrets set STRIPE_TEST_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_TEST_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_LIVE_SECRET_KEY=sk_live_...
```

### Frontend Deployment

Build for production:
```bash
npm run build
```

The `dist/` directory contains the production build.

## 📚 Documentation

Detailed documentation is available in the `readme/` directory:

- **[Subscription Implementation](readme/subscriptions_implementation/)** - Complete subscription system docs
- **[Webhook Security](readme/subscriptions_implementation/phase3_stripe_webhook.md)** - Webhook implementation details
- **[Layout System](readme/layout-system.md)** - UI component architecture
- **[Supabase Patterns](readme/supabase-client-pattern.md)** - Database interaction patterns

## 🔧 Development

### Streamlined Development Workflow

**Start developing:**
```bash
npm run dev
```

**Benefits:**
- ✅ **No local Supabase setup required**
- ✅ **No database sync issues**
- ✅ **Instant production readiness**
- ✅ **Real data during development**
- ✅ **Single source of truth**

**Important Notes:**
- Development uses the production database directly
- Be careful with test data - use test email addresses
- Consider adding development flags to distinguish dev vs prod usage in UI

### Code Quality

- **ESLint** for code linting
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Cursor Rules** for AI-assisted development

### Edge Function Best Practices

Following Supabase Edge Function guidelines (as implemented):

- ✅ Use `Deno.serve` instead of deprecated `serve` import
- ✅ Use `npm:` and `jsr:` specifiers with pinned versions for dependencies
- ✅ Use async webhook signature verification (`constructEventAsync`) for Deno compatibility
- ✅ Minimize external CDN usage (migrated from `esm.sh` to `npm:`)
- ✅ Use Web APIs and Deno core APIs when possible
- ✅ Secure environment variable handling without hardcoded fallbacks

### Edge Functions Sync Status (January 2025)

**✅ Functions Deployed and Synchronized**

**Available Functions (16 active):**
- `activate-subscription` - Subscription management
- `activate-subscription-minimal` - Minimal subscription flow
- `activate-subscription-test` - Testing subscription flow
- `chat-google` - Google AI chat integration
- `chat-openai` - OpenAI chat integration
- `chat-relay` - Chat relay functionality
- `create-checkout-session` - Stripe checkout creation
- `create-customer-portal-session` - Customer portal access
- `create-payment-handler` - Payment processing
- `create-payment-intent` - Payment intent creation
- `delete-flashcard` - Flashcard management
- `get-payment-status` - Payment status checking
- `get-price-id` - Stripe price retrieval
- `get-user-subscription` - Subscription status
- `stripe-webhook` - Secure webhook handling
- `debug-env` - Development debugging

**Backend-Only Functions:**
- `process-transcripts` - Server-side transcript processing
- `process-outlines` - Server-side outline processing

## 🐛 Troubleshooting

### Common Issues

1. **Environment connection issues**
   - Verify production database credentials in `.env`
   - Check that SUPABASE_URL_DEV points to production
   - Ensure anon key is up to date

2. **Webhook signature verification fails**
   - Ensure `STRIPE_TEST_WEBHOOK_SECRET` is set correctly
   - Check that the webhook URL is configured in Stripe dashboard

3. **Build errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

4. **Data concerns during development**
   - Use test email addresses for user registration
   - Add development flags to distinguish dev vs prod usage
   - Be mindful that you're working with production data

### Development Best Practices

Since development uses production database:

- **Use test accounts** - Don't create production users during development
- **Test carefully** - Changes affect real data
- **Use feature flags** - Distinguish development vs production usage
- **Backup regularly** - Ensure production data is backed up

### Monitoring

- **Supabase Dashboard**: Monitor database activity and Edge Function logs
- **Stripe Dashboard**: View webhook delivery attempts
- **Browser DevTools**: Debug frontend issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Note**: Since development uses production database, be extra careful with database changes.

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the [documentation](readme/)
- Review [troubleshooting](#troubleshooting) section
- Contact the development team

---

**Last Updated**: January 2025 - Streamlined development workflow to use production database directly, eliminating local Supabase setup and sync issues. Includes critical security cleanup and Edge Function modernization. 