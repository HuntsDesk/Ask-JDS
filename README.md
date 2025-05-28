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

4. **Start local development**
   ```bash
   npm run dev
   ```

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
│   ├── migrations/        # Database migrations
│   └── config.toml        # Supabase configuration
├── readme/                # Detailed documentation
├── scripts/               # Deployment and utility scripts
└── public/                # Static assets
```

## 🔐 Security & Environment

### Recent Security Updates (January 2025)

- ✅ **Removed hardcoded Stripe webhook secrets** from git history using `git filter-branch`
- ✅ **Implemented secure environment variable handling** for all secrets
- ✅ **Updated Edge Functions** to follow latest Supabase best practices:
  - Uses `Deno.serve` instead of deprecated `serve` import
  - Uses `npm:` specifiers with pinned versions (`npm:@supabase/supabase-js@2.39.3`, `npm:stripe@14.21.0`)
  - Uses async webhook signature verification (`constructEventAsync`) for Deno compatibility
- ✅ **Force-pushed cleaned git history** to remove exposed credentials
- ✅ **Deployed and tested** updated webhook function successfully

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase (auto-populated in hosted environment)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Application
ENVIRONMENT=development
PUBLIC_APP_URL=http://localhost:5173
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

**Local Development vs Online Deployment:**
- **Local changes**: Made to files in `supabase/functions/`
- **Online deployment**: Use `supabase functions deploy <function-name>`
- **Sync requirement**: Local changes must be deployed to take effect online

Deploy the webhook function:
```bash
supabase functions deploy stripe-webhook
```

Set secrets (applies to online environment):
```bash
supabase secrets set STRIPE_TEST_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_TEST_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_LIVE_SECRET_KEY=sk_live_...
```

**Note**: Environment variables set via `supabase secrets set` only affect the online Supabase environment. Local development uses `.env` file.

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

**✅ Local and Remote Functions are Synchronized**

**Available Functions (16 local + 2 backend-only):**
- `activate-subscription` - Subscription management
- `activate-subscription-minimal` - Minimal subscription flow
- `activate-subscription-test` - Testing subscription flow
- `chat-google` - Google AI chat integration
- `chat-openai` - OpenAI chat integration
- `chat-relay` - Chat relay functionality ✨ *recently synced*
- `create-checkout-session` - Stripe checkout creation
- `create-customer-portal-session` - Customer portal access
- `create-payment-handler` - Payment processing
- `create-payment-intent` - Payment intent creation ✨ *recently synced*
- `delete-flashcard` - Flashcard management
- `get-payment-status` - Payment status checking
- `get-price-id` - Stripe price retrieval
- `get-user-subscription` - Subscription status
- `stripe-webhook` - Secure webhook handling
- `debug-env` - Development debugging

**Backend-Only Functions (not needed locally):**
- `process-transcripts` - Server-side transcript processing
- `process-outlines` - Server-side outline processing

**Deprecated Functions (removed):**
- ~~`create-portal-session`~~ - Replaced by `create-customer-portal-session`

### Database

- **PostgreSQL** with Supabase
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Migrations** for schema management

## 🐛 Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Ensure `STRIPE_TEST_WEBHOOK_SECRET` is set correctly
   - Check that the webhook URL is configured in Stripe dashboard

2. **Environment variable not found**
   - Verify all required variables are set in `.env`
   - For Edge Functions, ensure secrets are set via `supabase secrets set`

3. **Build errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

4. **Supabase CLI issues**
   - Update to latest version: `npm update supabase --save-dev` or `brew upgrade supabase`
   - Current recommended version: v2.23.4+
   - Check version: `supabase --version`

### Monitoring

- **Supabase Dashboard**: Monitor Edge Function logs
- **Stripe Dashboard**: View webhook delivery attempts
- **Browser DevTools**: Debug frontend issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the [documentation](readme/)
- Review [troubleshooting](#troubleshooting) section
- Contact the development team

---

**Last Updated**: January 2025 - Includes security updates, webhook improvements, and Edge Function modernization 