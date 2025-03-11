import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and related packages into their own chunk
          'vendor-react': [
            'react', 
            'react-dom', 
            'react-router-dom',
          ],
          // UI component libraries
          'vendor-ui': [
            '@/components/ui',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
          ],
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
    // Increase the warning limit to avoid warnings about chunk sizes
    chunkSizeWarningLimit: 1000,
  },
});
