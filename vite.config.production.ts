import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// Uncomment these after installing: npm i -D rollup-plugin-visualizer vite-plugin-compression vite-plugin-pwa
// import { visualizer } from 'rollup-plugin-visualizer';
// import viteCompression from 'vite-plugin-compression';
// import { VitePWA } from 'vite-plugin-pwa';

/**
 * Production-optimized Vite configuration
 * Includes advanced optimizations for bundle size, performance, and security
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const baseEnv = loadEnv('', process.cwd(), 'VITE_');
  const mergedEnv = { ...baseEnv, ...env };
  
  // Determine domain
  let domain = 'askjds';
  if (mode === 'jds') {
    domain = 'jdsimplified';
  } else if (mode === 'admin') {
    domain = 'admin';
  }
  
  if (mergedEnv.VITE_BUILD_DOMAIN) {
    domain = mergedEnv.VITE_BUILD_DOMAIN;
  }

  return {
    plugins: [
      react({
        // Use automatic JSX runtime for smaller bundles
        jsxRuntime: 'automatic',
      }),
      
      // Uncomment after installing dependencies:
      // Compress assets with gzip and brotli
      // viteCompression({
      //   algorithm: 'gzip',
      //   ext: '.gz',
      //   threshold: 10240, // Only compress files larger than 10KB
      // }),
      // viteCompression({
      //   algorithm: 'brotliCompress',
      //   ext: '.br',
      //   threshold: 10240,
      // }),
      
      // Bundle analyzer (only in analyze mode)
      // process.env.ANALYZE && visualizer({
      //   open: true,
      //   filename: `dist_${domain}/stats.html`,
      //   gzipSize: true,
      //   brotliSize: true,
      // }),
      
      // PWA support for better offline experience
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   includeAssets: ['favicon.ico', 'robots.txt'],
      //   manifest: {
      //     name: domain === 'askjds' ? 'Ask JDS' : 'JD Simplified',
      //     short_name: domain === 'askjds' ? 'AskJDS' : 'JDS',
      //     theme_color: '#F37022',
      //     background_color: '#ffffff',
      //     display: 'standalone',
      //     icons: [
      //       {
      //         src: '/images/favicon.ico',
      //         sizes: '64x64 32x32 24x24 16x16',
      //         type: 'image/x-icon',
      //       },
      //     ],
      //   },
      //   workbox: {
      //     cleanupOutdatedCaches: true,
      //     skipWaiting: true,
      //     clientsClaim: true,
      //     runtimeCaching: [
      //       {
      //         urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'google-fonts',
      //           expiration: {
      //             maxEntries: 30,
      //             maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      //           },
      //         },
      //       },
      //     ],
      //   },
      // }),
    ].filter(Boolean),
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@jds': path.resolve(__dirname, './jdsimplified/src'),
      },
    },
    
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
      ],
    },
    
    build: {
      outDir: domain === 'askjds' 
        ? 'dist_askjds' 
        : domain === 'jdsimplified' 
          ? 'dist_jdsimplified' 
          : 'dist_admin',
      
      // Production optimizations
      target: 'es2020', // Modern browsers only
      minify: 'terser', // Better minification than esbuild
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs
          drop_debugger: true, // Remove debugger statements
          pure_funcs: ['console.log', 'console.debug', 'console.info'], // Remove these calls
        },
        mangle: {
          safari10: true, // Fix Safari 10 issues
        },
        format: {
          comments: false, // Remove all comments
        },
      },
      
      sourcemap: false, // Disable source maps in production
      
      rollupOptions: {
        output: {
          // Advanced code splitting
          manualChunks: (id) => {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('tailwind') || id.includes('class-variance')) {
              return 'ui-vendor';
            }
            
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            
            // AI providers
            if (id.includes('openai') || id.includes('@google')) {
              return 'ai-vendor';
            }
            
            // Analytics
            if (id.includes('usermaven') || id.includes('analytics')) {
              return 'analytics-vendor';
            }
            
            // Utils
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('uuid')) {
              return 'utils-vendor';
            }
            
            // Icons (large)
            if (id.includes('lucide') || id.includes('heroicons')) {
              return 'icons-vendor';
            }
          },
          
          // Asset naming for better caching
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) {
              return `assets/[name]-[hash][extname]`;
            }
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
        
        // Tree shaking optimizations
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      
      // CSS optimizations
      cssCodeSplit: true,
      cssMinify: true,
      
      // Increase chunk size warning limit for production
      chunkSizeWarningLimit: 500,
      
      // Report compressed size
      reportCompressedSize: true,
    },
    
    // Environment variable injection (same as original)
    define: {
      'import.meta.env.VITE_BUILD_DOMAIN': JSON.stringify(domain),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(mergedEnv.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(mergedEnv.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(mergedEnv.VITE_STRIPE_PUBLISHABLE_KEY),
      'import.meta.env.VITE_USERMAVEN_KEY': JSON.stringify(mergedEnv.VITE_USERMAVEN_KEY),
      'import.meta.env.VITE_USERMAVEN_TRACKING_HOST': JSON.stringify(mergedEnv.VITE_USERMAVEN_TRACKING_HOST),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify('false'), // Force disable debug in production
      global: 'globalThis',
    },
    
    // Disable HMR and dev server features
    server: {
      hmr: false,
    },
    
    base: './',
  };
}); 