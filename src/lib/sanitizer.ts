/**
 * Data sanitizer for removing sensitive information from logs and errors
 */

// Sensitive field names that should always be redacted
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'userId',
  'user_id',
  'subscriptionId',
  'subscription_id',
  'email',
  'phone',
  'ssn',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'cvc',
  'sessionId',
  'session_id',
  'refreshToken',
  'refresh_token',
  'accessToken',
  'access_token',
  'idToken',
  'id_token',
  'authToken',
  'auth_token',
  'bearerToken',
  'bearer_token',
  'privateKey',
  'private_key',
  'secretKey',
  'secret_key'
]);

// Patterns for sensitive data
const PATTERNS = {
  // UUID pattern
  uuid: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
  // Email pattern
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // JWT token pattern
  jwt: /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
  // Credit card pattern (basic)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // Phone number pattern (US)
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // API key pattern (common formats)
  apiKey: /\b[A-Za-z0-9]{32,}\b/g,
  // Bearer token in Authorization header
  bearerToken: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g,
  // IP address
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
};

export class Sanitizer {
  /**
   * Sanitize a value recursively
   */
  static sanitize(data: any, depth: number = 0): any {
    // Prevent infinite recursion
    if (depth > 10) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    // Handle null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Handle strings
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, depth + 1));
    }

    // Handle objects
    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Check if the key itself is sensitive
          if (this.isSensitiveField(key)) {
            sanitized[key] = '[REDACTED]';
          } else {
            // Recursively sanitize the value
            sanitized[key] = this.sanitize(data[key], depth + 1);
          }
        }
      }
      
      return sanitized;
    }

    // Return other types as-is (numbers, booleans, etc.)
    return data;
  }

  /**
   * Sanitize a string value
   */
  private static sanitizeString(str: string): string {
    let sanitized = str;

    // Replace UUIDs
    sanitized = sanitized.replace(PATTERNS.uuid, 'xxxx-xxxx-xxxx');

    // Replace emails (but keep domain for debugging)
    sanitized = sanitized.replace(PATTERNS.email, (match) => {
      const parts = match.split('@');
      if (parts.length === 2) {
        return 'xxx@' + parts[1];
      }
      return 'xxx@example.com';
    });

    // Replace JWT tokens
    sanitized = sanitized.replace(PATTERNS.jwt, '[JWT_REDACTED]');

    // Replace credit cards
    sanitized = sanitized.replace(PATTERNS.creditCard, 'xxxx-xxxx-xxxx-xxxx');

    // Replace phone numbers
    sanitized = sanitized.replace(PATTERNS.phone, 'xxx-xxx-xxxx');

    // Replace API keys
    sanitized = sanitized.replace(PATTERNS.apiKey, '[API_KEY_REDACTED]');

    // Replace bearer tokens
    sanitized = sanitized.replace(PATTERNS.bearerToken, 'Bearer [TOKEN_REDACTED]');

    // Replace IP addresses (optional - might want to keep for debugging)
    // sanitized = sanitized.replace(PATTERNS.ipAddress, 'xxx.xxx.xxx.xxx');

    return sanitized;
  }

  /**
   * Check if a field name is sensitive
   */
  private static isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Check exact matches
    if (SENSITIVE_FIELDS.has(lowerFieldName)) {
      return true;
    }
    
    // Check if field contains sensitive keywords
    const sensitiveKeywords = ['password', 'token', 'secret', 'key', 'auth', 'credit', 'card'];
    return sensitiveKeywords.some(keyword => lowerFieldName.includes(keyword));
  }

  /**
   * Sanitize error objects specifically
   */
  static sanitizeError(error: Error): any {
    const sanitized: any = {
      name: error.name,
      message: this.sanitizeString(error.message)
    };

    // Only include stack in development
    if (import.meta.env.DEV && error.stack) {
      sanitized.stack = this.sanitizeString(error.stack);
    }

    // Handle any custom properties
    const errorObj = error as any;
    for (const key in errorObj) {
      if (!['name', 'message', 'stack'].includes(key) && errorObj.hasOwnProperty(key)) {
        sanitized[key] = this.sanitize(errorObj[key]);
      }
    }

    return sanitized;
  }

  /**
   * Create a safe log context by sanitizing an object
   */
  static createSafeContext(context: Record<string, any>): Record<string, any> {
    return this.sanitize(context);
  }

  /**
   * Mask a value partially (useful for showing partial IDs)
   */
  static maskPartial(value: string, showChars: number = 4): string {
    if (!value || value.length <= showChars) {
      return value;
    }
    
    const visiblePart = value.substring(0, showChars);
    return `${visiblePart}...`;
  }
}

// Export convenience functions
export const sanitize = Sanitizer.sanitize.bind(Sanitizer);
export const sanitizeError = Sanitizer.sanitizeError.bind(Sanitizer);
export const createSafeContext = Sanitizer.createSafeContext.bind(Sanitizer);
export const maskPartial = Sanitizer.maskPartial.bind(Sanitizer); 