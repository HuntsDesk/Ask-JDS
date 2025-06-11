/**
 * Runtime Configuration
 * 
 * This file provides environment variables that are available at runtime,
 * not just during the Vite build process. This solves issues where environment
 * variables are missing in production builds.
 * 
 * This file is loaded by the main application and provides fallback values
 * when build-time environment variables are not available.
 */

window.RUNTIME_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://prbbuxgirnecbkpdpgcb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTkzNjIsImV4cCI6MjA2NDAzNTM2Mn0.WFvJN-61K6z7RHwjiybC7kq1zVIK6DgvhKlXWCzbnh8',
  
  // Stripe Configuration - Legacy Key (will work for both dev and prod)
  STRIPE_PUBLISHABLE_KEY: 'pk_live_51Qzlw7BdYlmFidIZLER0X4zFUgPsxSYHjZy55rmq3QFBKATeIam0f21npAlF4evbfijTTUsjiJI2weV6tdMj5xZo00LHBEwH6x',
  
  // Environment-specific Stripe Keys
  STRIPE_PUBLISHABLE_KEY_DEV: 'pk_test_51QzlwBBAYVpTe3LyuHVWb2CiUnMYWJlB8FPW5vcNRmyYRuMzedSIvX6YohV8nByB7KgMiYUfqg0PpL4zYrh3hoEW00Djy4Ht5y',
  STRIPE_PUBLISHABLE_KEY_PROD: 'pk_live_51Qzlw7BdYlmFidIZLER0X4zFUgPsxSYHjZy55rmq3QFBKATeIam0f21npAlF4evbfijTTUsjiJI2weV6tdMj5xZo00LHBEwH6x',
  
  // Domain Configuration
  BUILD_DOMAIN: 'askjds',
  ASKJDS_DOMAIN: 'askjds.com',
  JDSIMPLIFIED_DOMAIN: 'jdsimplified.com',
  ADMIN_DOMAIN: 'admin.jdsimplified.com',
  
  // Feature Flags
  FREE_MESSAGE_LIMIT: '10',
  
  // Media Services
  GUMLET_ACCOUNT_ID: '6747983e53ef464e4ecd1982',
  
  // Analytics
  USERMAVEN_KEY: 'UMArAV3kop',
  USERMAVEN_TRACKING_HOST: 'https://a.jdsimplified.com',
  
  // Environment Detection
  ENVIRONMENT: typeof window !== 'undefined' && (
    window.location.hostname === 'askjds.com' ||
    window.location.hostname === 'jdsimplified.com' ||
    window.location.hostname === 'admin.jdsimplified.com'
  ) ? 'production' : 'development'
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.debugRuntimeConfig = () => {
    console.log('Runtime Config:', window.RUNTIME_CONFIG);
    console.log('Current Environment:', window.RUNTIME_CONFIG.ENVIRONMENT);
  };
} 