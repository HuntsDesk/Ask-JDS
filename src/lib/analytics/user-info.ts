/**
 * User info utilities for analytics tracking
 */
import { supabase } from '@/lib/supabase';

// Create a supabase client
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UserInfo {
  user: { id: string; email?: string } | null;
  browser: {
    name: string;
    version: string;
    os: string;
  } | null;
  device: {
    type: 'desktop' | 'tablet' | 'mobile';
  } | null;
}

/**
 * Get information about the current user and browser
 */
export async function getUserInfo(): Promise<UserInfo> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Detect browser
  const userAgent = navigator.userAgent;
  const browser = getBrowserInfo(userAgent);
  
  // Detect device type
  const device = getDeviceType();
  
  return {
    user: user ? { id: user.id, email: user.email || undefined } : null,
    browser,
    device
  };
}

/**
 * Get browser information from user agent
 */
function getBrowserInfo(userAgent: string) {
  // Parse browser name and version
  let name = 'unknown';
  let version = 'unknown';
  let os = 'unknown';
  
  // OS detection
  if (/Windows/.test(userAgent)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/.test(userAgent)) {
    os = 'macOS';
  } else if (/Linux/.test(userAgent)) {
    os = 'Linux';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    os = 'iOS';
  }
  
  // Browser detection
  if (/Chrome/.test(userAgent) && !/Chromium|Edge|Edg|OPR|Opera/.test(userAgent)) {
    name = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+\.\d+)/)![1];
  } else if (/Firefox/.test(userAgent)) {
    name = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+\.\d+)/)![1];
  } else if (/Safari/.test(userAgent) && !/Chrome|Chromium|Edge|Edg|OPR|Opera/.test(userAgent)) {
    name = 'Safari';
    version = userAgent.match(/Version\/(\d+\.\d+)/)![1];
  } else if (/Edge|Edg/.test(userAgent)) {
    name = 'Edge';
    version = userAgent.match(/Edge\/(\d+\.\d+)|Edg\/(\d+\.\d+)/)![1] || '';
  } else if (/OPR|Opera/.test(userAgent)) {
    name = 'Opera';
    version = userAgent.match(/OPR\/(\d+\.\d+)|Opera\/(\d+\.\d+)/)![1] || '';
  }
  
  return { name, version, os };
}

/**
 * Get device type based on screen size and user agent
 */
function getDeviceType(): { type: 'desktop' | 'tablet' | 'mobile' } {
  const userAgent = navigator.userAgent;
  
  // Check for mobile/tablet based on user agent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (!isMobile) {
    return { type: 'desktop' };
  }
  
  // Check if tablet based on screen size
  const isTablet = window.innerWidth >= 768 || /iPad/i.test(userAgent);
  
  return { type: isTablet ? 'tablet' : 'mobile' };
} 