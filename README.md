# Ask JDS

## Recent Updates

- **Stripe Integration**: Simplified checkout flow with improved error handling and security
- **Payment Success Flow**: Added dedicated success pages for course purchases and subscriptions
- **Supabase Client**: Implemented singleton pattern to prevent multiple client instances
- **Authentication**: Enhanced session management and user validation

## Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in the required values:

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...

# Other environment variables as needed
```

4. Start the development server: `npm run dev`

## Documentation

- [Stripe Integration](readme/stripe_integration.md)
- [Database Schema](readme/database_schema.md)
- [Authentication](readme/authentication.md)

## Development Guidelines

- Use TypeScript for all new code
- Follow the established project structure
- Maintain comprehensive documentation
- Write tests for new features
- Use the singleton Supabase client from `src/lib/supabase.ts`

## Testing

1. Run unit tests: `npm test`
2. Run integration tests: `npm run test:integration`
3. For Stripe testing, use test mode and test card numbers

## Deployment

1. Ensure all tests pass
2. Update environment variables
3. Deploy to production

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
