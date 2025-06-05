/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface SecurityConfig {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimit?: {
    requests: number;
    windowMinutes: number;
  };
  skipForAdmin?: boolean;
  enableCORS?: boolean;
  validateInput?: boolean;
}

interface SecurityContext {
  user: any;
  supabase: any;
  clientIP: string;
  userAgent: string;
  isAdmin: boolean;
  requestId: string;
}

const DEFAULT_CONFIG: SecurityConfig = {
  requireAuth: true,
  allowedRoles: ['authenticated'],
  rateLimit: {
    requests: 100,
    windowMinutes: 60
  },
  skipForAdmin: false,
  enableCORS: true,
  validateInput: true
};

async function getRateLimitStatus(
  supabase: any, 
  userId: string, 
  endpoint: string, 
  clientIP: string, 
  userAgent: string
) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit_enhanced', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_client_ip: clientIP,
      p_user_agent: userAgent,
      p_window_minutes: 60
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true, current_count: 0, limit: 1000 }; // Fail open
    }

    return data;
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true, current_count: 0, limit: 1000 }; // Fail open
  }
}

async function validateInputSafety(body: any): Promise<boolean> {
  if (!body || typeof body !== 'object') return true;
  
  const suspicious_patterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /\bSELECT\b.*\bFROM\b/gi,
    /\bINSERT\b.*\bINTO\b/gi,
    /\bUPDATE\b.*\bSET\b/gi,
    /\bDELETE\b.*\bFROM\b/gi,
    /\bDROP\b.*\bTABLE\b/gi
  ];

  const content = JSON.stringify(body).toLowerCase();
  return !suspicious_patterns.some(pattern => pattern.test(content));
}

export function withSecureAuth(
  handler: (req: Request, context: SecurityContext) => Promise<Response>,
  config: SecurityConfig = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Handle CORS preflight
    if (req.method === 'OPTIONS' && mergedConfig.enableCORS) {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // Extract client information
      const clientIP = req.headers.get('CF-Connecting-IP') || 
                      req.headers.get('X-Forwarded-For') || 
                      req.headers.get('X-Real-IP') || 
                      'unknown';
      const userAgent = req.headers.get('User-Agent') || 'unknown';

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Authentication check
      let user = null;
      let isAdmin = false;

      if (mergedConfig.requireAuth) {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authUser) {
          return new Response(
            JSON.stringify({ error: 'Invalid authentication' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        user = authUser;

        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        isAdmin = profile?.role === 'admin';

        // Role-based access control
        if (mergedConfig.allowedRoles && !mergedConfig.allowedRoles.includes('authenticated')) {
          if (!mergedConfig.allowedRoles.includes(profile?.role || 'user')) {
            return new Response(
              JSON.stringify({ error: 'Insufficient permissions' }),
              { 
                status: 403, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
        }
      }

      // Rate limiting (skip for admins if configured)
      if (mergedConfig.rateLimit && user && !(mergedConfig.skipForAdmin && isAdmin)) {
        const endpoint = new URL(req.url).pathname.split('/').pop() || 'unknown';
        const rateLimitStatus = await getRateLimitStatus(
          supabase, 
          user.id, 
          endpoint, 
          clientIP, 
          userAgent
        );

        if (!rateLimitStatus.allowed) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              limit: rateLimitStatus.limit,
              current: rateLimitStatus.current_count,
              resetTime: rateLimitStatus.reset_time
            }),
            { 
              status: 429, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Input validation
      if (mergedConfig.validateInput && (req.method === 'POST' || req.method === 'PUT')) {
        try {
          const body = await req.clone().json();
          const isSafe = await validateInputSafety(body);
          
          if (!isSafe) {
            // Log suspicious activity
            await supabase.from('security_violations').insert({
              violation_type: 'suspicious_activity',
              user_id: user?.id,
              client_ip: clientIP,
              user_agent: userAgent,
              raw_report: { 
                suspicious_input: true, 
                endpoint: new URL(req.url).pathname,
                request_id: requestId
              },
              severity: 'high'
            });

            return new Response(
              JSON.stringify({ error: 'Invalid input detected' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
        } catch (e) {
          // Not JSON or other parsing error - allow through
        }
      }

      // Create security context
      const context: SecurityContext = {
        user,
        supabase,
        clientIP,
        userAgent,
        isAdmin,
        requestId
      };

      // Call the actual handler
      const response = await handler(req, context);

      // Add security headers to response
      const secureResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...(mergedConfig.enableCORS ? corsHeaders : {}),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-Request-ID': requestId,
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });

      return secureResponse;

    } catch (error) {
      console.error('Security wrapper error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          requestId 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  };
} 