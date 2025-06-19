import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  // Load from both .env and .env.[mode] files
  const env = loadEnv(mode, process.cwd(), '');
  
  // Also try to load from .env directly to ensure we get VITE_ prefixed vars
  const baseEnv = loadEnv('', process.cwd(), 'VITE_');
  
  // Merge the environments, with mode-specific taking precedence
  const mergedEnv = { ...baseEnv, ...env };
  
  // Log environment variables for debugging (only in development)
  if (mode === 'development' || process.env.NODE_ENV === 'development') {
    console.log('🔍 [VITE DEBUG] Environment variables loaded:', {
      mode,
      usermavenKey: mergedEnv.VITE_USERMAVEN_KEY ? '***set***' : 'undefined',
      usermavenHost: mergedEnv.VITE_USERMAVEN_TRACKING_HOST || 'undefined',
      supabaseUrl: mergedEnv.VITE_SUPABASE_URL ? '***set***' : 'undefined'
    });
  }
  
  // Determine domain based on mode
  let domain = 'askjds'; // default domain
  if (mode === 'jds') {
    domain = 'jdsimplified';
  } else if (mode === 'askjds') {
    domain = 'askjds';
  } else if (mode === 'admin') {
    domain = 'admin';
  }
  
  // Override with explicit env var if set
  if (mergedEnv.VITE_BUILD_DOMAIN) {
    domain = mergedEnv.VITE_BUILD_DOMAIN;
  }
  
  // Log configuration for debugging
  console.log('===========================================');
  console.log(`Mode: ${mode}`);
  console.log(`Building for domain: ${domain}`);
  console.log(`Port: ${domain === 'askjds' ? 5173 : domain === 'jdsimplified' ? 5174 : 5175}`);
  console.log('===========================================');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@jds': path.resolve(__dirname, './jdsimplified/src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    envPrefix: ['VITE_'],
    define: {
      // Make sure environment is available to client code
      'import.meta.env.VITE_ASKJDS_ENABLED': JSON.stringify(mode === 'askjds'),
      'import.meta.env.VITE_JDS_ENABLED': JSON.stringify(mode === 'jds'),
      // Make sure domain is available to client code
      'import.meta.env.VITE_BUILD_DOMAIN': JSON.stringify(domain),
      
      // Explicitly inject critical environment variables for production builds
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(mergedEnv.VITE_SUPABASE_URL || mergedEnv.SUPABASE_URL_PROD || mergedEnv.SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(mergedEnv.VITE_SUPABASE_ANON_KEY || mergedEnv.SUPABASE_ANON_KEY_PROD || mergedEnv.SUPABASE_ANON_KEY),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(mergedEnv.VITE_STRIPE_PUBLISHABLE_KEY),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_DEV': JSON.stringify(mergedEnv.VITE_STRIPE_PUBLISHABLE_KEY_DEV),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_PROD': JSON.stringify(mergedEnv.VITE_STRIPE_PUBLISHABLE_KEY_PROD),
      
      // Stripe Price IDs for fallback
      'import.meta.env.VITE_STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID),
      'import.meta.env.VITE_STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID),
      'import.meta.env.VITE_STRIPE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID),
      'import.meta.env.VITE_STRIPE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID),
      'import.meta.env.VITE_STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID),
      'import.meta.env.VITE_STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID),
      'import.meta.env.VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID),
      'import.meta.env.VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID': JSON.stringify(mergedEnv.VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID),
      
      // Usermaven Analytics - Use mergedEnv to ensure we get the variables
      'import.meta.env.VITE_USERMAVEN_KEY': JSON.stringify(mergedEnv.VITE_USERMAVEN_KEY),
      'import.meta.env.VITE_USERMAVEN_TRACKING_HOST': JSON.stringify(mergedEnv.VITE_USERMAVEN_TRACKING_HOST),
      
      global: 'globalThis',
    },
    build: {
      // Use separate root folders for each domain build
      outDir: domain === 'askjds' 
        ? 'dist_askjds' 
        : domain === 'jdsimplified' 
          ? 'dist_jdsimplified' 
          : 'dist_admin',
      // Increase the warning limit to avoid warnings about chunk sizes
      chunkSizeWarningLimit: 1000,
      target: 'es2022',
      minify: false,
      rollupOptions: {
        external: [/\.test\./],
        output: {
          manualChunks: {
            // Split React and related packages into their own chunk
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI component libraries
            'ui-vendor': ['@radix-ui/react-icons', '@radix-ui/react-slot'],
            // Icons and visualization
            'vendor-icons': [
              'lucide-react',
            ],
            // Utility libraries
            'vendor-utils': [
              'tailwind-merge',
              'class-variance-authority',
              'clsx',
            ],
            // Supabase related code
            'vendor-supabase': [
              '@supabase/supabase-js',
              '@supabase/auth-ui-react',
              '@supabase/auth-ui-shared',
            ],
          },
        },
      },
    },
    server: {
      port: domain === 'askjds' 
        ? 5173 
        : domain === 'jdsimplified' 
          ? 5174 
          : 5175,
      strictPort: false, // Allow fallback to other ports if 5173 is in use
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      }
    },
    base: './',
  };
});
