import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
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
  if (env.VITE_BUILD_DOMAIN) {
    domain = env.VITE_BUILD_DOMAIN;
  }
  
  // Log configuration for debugging
  console.log('===========================================');
  console.log(`Mode: ${mode}`);
  console.log(`Building for domain: ${domain}`);
  console.log(`Environment variables:`, env);
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
