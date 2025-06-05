/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Supabase client with service role for logging
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer?: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code'?: number;
    'script-sample'?: string;
  };
}

async function logCSPViolation(report: CSPViolationReport, clientIP?: string, userAgent?: string) {
  const violation = report['csp-report'];
  
  try {
    await supabase.from('security_violations').insert({
      violation_type: 'csp',
      document_uri: violation['document-uri'],
      violated_directive: violation['violated-directive'],
      blocked_uri: violation['blocked-uri'],
      source_file: violation['source-file'],
      line_number: violation['line-number'],
      column_number: violation['column-number'],
      client_ip: clientIP,
      user_agent: userAgent,
      raw_report: JSON.stringify(report),
      created_at: new Date().toISOString()
    });

    // Alert on critical violations
    const criticalDirectives = ['script-src', 'object-src', 'base-uri', 'form-action'];
    if (criticalDirectives.some(dir => violation['violated-directive'].includes(dir))) {
      console.warn('CRITICAL CSP VIOLATION:', {
        uri: violation['document-uri'],
        directive: violation['violated-directive'],
        blocked: violation['blocked-uri'],
        ip: clientIP
      });
    }
  } catch (error) {
    console.error('Failed to log CSP violation:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const report = await req.json() as CSPViolationReport;
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                     req.headers.get('X-Forwarded-For') || 
                     req.headers.get('X-Real-IP') || 
                     'unknown';
    const userAgent = req.headers.get('User-Agent') || 'unknown';

    await logCSPViolation(report, clientIP, userAgent);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('CSP violation report error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process report' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 