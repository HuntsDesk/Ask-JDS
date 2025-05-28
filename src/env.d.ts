/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Legacy environment variables (for backward compatibility)
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // Environment-specific Supabase configuration
  readonly VITE_SUPABASE_URL_DEV: string
  readonly VITE_SUPABASE_ANON_KEY_DEV: string
  readonly VITE_SUPABASE_URL_PROD: string
  readonly VITE_SUPABASE_ANON_KEY_PROD: string
  
  // API Keys
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 