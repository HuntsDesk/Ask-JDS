/**
 * Shared CORS configuration for all Edge Functions
 */

// Define production domains
const ALLOWED_DOMAINS = [
  'https://askjds.com',
  'https://www.askjds.com',
  'https://jdsimplified.com',
  'https://www.jdsimplified.com',
  'https://admin.jdsimplified.com',
  'http://localhost:5173',  // Local development
  'http://localhost:3000'   // Alternative local port
];

// Define CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be replaced dynamically
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

// Helper to handle CORS preflight requests
export function handleCors(req: Request): Response | null {
  const origin = req.headers.get('Origin') || '';
  
  // Check if origin is allowed
  if (ALLOWED_DOMAINS.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else {
    // Default fallback for development
    corsHeaders['Access-Control-Allow-Origin'] = 'http://localhost:5173';
  }
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Return null for non-OPTIONS requests
  return null;
} 