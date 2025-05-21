
// Debug utility functions for AskJDS
// Include these in your browser console to diagnose auth issues

// Force a specific subscription state (true = subscribed, false = not subscribed)
function forceSubscription(state) {
  localStorage.setItem('forceSubscription', state ? 'true' : 'false');
  console.log('Subscription forced to: ' + state);
  console.log('Reload the page to see changes');
}

// Reset stored auth data
function resetAuth() {
  localStorage.removeItem('ask-jds-auth-storage');
  localStorage.removeItem('preservedMessage');
  localStorage.removeItem('preservedThreadId');
  localStorage.removeItem('forceSubscription');
  sessionStorage.removeItem('protected_redirect_attempts');
  sessionStorage.removeItem('auth_redirect_attempts');
  console.log('Auth data cleared');
  console.log('Reload the page to trigger re-authentication');
}

// Print JWT info
function inspectJWT() {
  try {
    const authStorage = localStorage.getItem('ask-jds-auth-storage');
    if (!authStorage) {
      console.log('No auth storage found');
      return;
    }
    
    const authData = JSON.parse(authStorage);
    if (!authData.access_token) {
      console.log('No access token found');
      return;
    }
    
    console.log('Access token expiration: ' + new Date(authData.expires_at).toLocaleString());
    console.log('Current time: ' + new Date().toLocaleString());
    console.log('Is token expired? ' + (new Date(authData.expires_at) < new Date()));
    
    // Decode JWT parts
    const token = authData.access_token;
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid JWT format');
      return;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('JWT payload:', payload);
  } catch (e) {
    console.error('Error inspecting JWT:', e);
  }
}

// Call one of these functions in your browser console:
// forceSubscription(true)   // Force subscription to be active
// resetAuth()               // Clear all auth data
// inspectJWT()              // Show details about your JWT token
