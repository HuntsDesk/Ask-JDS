// Secure auth wrapper with rate limiting
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const isDev = Deno.env.get("ENVIRONMENT") !== "production";
const allowedOrigins = [
  "https://askjds.com", "https://jdsimplified.com", "https://admin.jdsimplified.com",
  ...(isDev ? ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"] : [])
];

interface SecureAuthOptions {
  requireAuth?: boolean;
  useServiceRole?: boolean;
  allowedRoles?: string[];
  rateLimit?: {
    endpoint: string;
    windowMinutes?: number;
    skipForAdmin?: boolean;
  };
}

const memoryLimiter = new Map();

function checkMemoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = memoryLimiter.get(key);
  if (!record || now > record.resetTime) {
    memoryLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

export function withSecureAuth(
  handler: (req: Request, context: { supabase: any, user?: any, isAdmin?: boolean }) => Promise<Response>,
  options: SecureAuthOptions = { requireAuth: true }
) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin") || "";
    const isAllowedOrigin = allowedOrigins.includes(origin) || isDev;
    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Credentials": "true",
      "Content-Type": "application/json"
    };
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabaseKey = options.useServiceRole
      ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      : Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });

    let user = null, isAdmin = false;
    if (options.requireAuth) {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (!authUser || error) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      user = authUser;
      if (options.allowedRoles?.includes("admin")) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
        isAdmin = profile?.role === "admin";
        if (!isAdmin) return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });
      }
    }

    // Memory-based burst control
    if (options.rateLimit && user && !options.rateLimit.skipForAdmin) {
      const key = `${user.id}:${options.rateLimit.endpoint}`;
      const allowed = checkMemoryRateLimit(key, 100, (options.rateLimit.windowMinutes || 60) * 60000);
      if (!allowed) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: corsHeaders });
    }

    const response = await handler(req, { supabase, user, isAdmin });
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  };
}
