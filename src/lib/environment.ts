/**
 * Frontend environment utilities
 * Mirrors backend logic using Vite's environment detection
 */

// Course interface for type safety (matches backend)
export interface Course {
  id: string;
  stripe_price_id?: string | null;
  stripe_price_id_dev?: string | null;
  [key: string]: any;
}

/**
 * Check if we're in production environment
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD && (
    window.location.hostname === 'askjds.com' ||
    window.location.hostname === 'jdsimplified.com' ||
    window.location.hostname === 'admin.jdsimplified.com'
  );
};

/**
 * Get the appropriate Stripe publishable key based on the current environment
 * @returns The environment-appropriate Stripe publishable key
 * @throws Error if the required key is missing for the current environment
 */
export const getStripePublishableKey = (): string => {
  const isProd = isProduction();
  
  console.log('getStripePublishableKey called:', {
    isProd,
    hostname: window.location.hostname,
    viteMode: import.meta.env.MODE,
    viteProd: import.meta.env.PROD
  });
  
  if (isProd) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_PROD;
    if (!key) {
      console.error('Missing production Stripe publishable key');
      // Fallback to legacy key for backward compatibility
      const fallbackKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!fallbackKey) {
        throw new Error('Missing production Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY_PROD)');
      }
      console.warn('Using fallback Stripe publishable key for production');
      return fallbackKey;
    }
    console.log('Using production Stripe publishable key');
    return key;
  } else {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_DEV;
    if (!key) {
      console.error('Missing development Stripe publishable key');
      // Fallback to legacy key for backward compatibility
      const fallbackKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!fallbackKey) {
        throw new Error('Missing development Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY_DEV)');
      }
      console.warn('Using fallback Stripe publishable key for development (this may be the live key!)');
      return fallbackKey;
    }
    console.log('Using development Stripe publishable key');
    return key;
  }
};

/**
 * Get the appropriate price ID for a course based on the current environment
 * @param course The course object containing both price IDs
 * @returns The environment-appropriate price ID
 * @throws Error if the required price ID is missing for the current environment
 */
export const getCoursePriceId = (course: Course): string => {
  const isProd = isProduction();
  
  if (isProd) {
    if (!course.stripe_price_id) {
      throw new Error(`Missing production price ID for course: ${course.id}`);
    }
    return course.stripe_price_id;
  } else {
    if (!course.stripe_price_id_dev) {
      throw new Error(`Missing development price ID for course: ${course.id}`);
    }
    return course.stripe_price_id_dev;
  }
};

/**
 * Debug helper to log environment information
 */
export const logEnvironmentInfo = (): void => {
  if (import.meta.env.DEV) {
    console.log('Environment info:', {
      isProd: isProduction(),
      hostname: window.location.hostname,
      viteProd: import.meta.env.PROD,
      viteMode: import.meta.env.MODE,
      stripeKeyDev: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_DEV ? 'present' : 'missing',
      stripeKeyProd: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_PROD ? 'present' : 'missing',
      stripeKeyLegacy: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'present' : 'missing',
    });
  }
};

/**
 * Transform a course object to include only the environment-appropriate price_id
 * This creates a clean API response with a single price_id field
 * @param course The raw course object from the database
 * @returns Course object with computed price_id field
 */
export const transformCourseForEnvironment = (course: Course): Course & { price_id: string } => {
  const price_id = getCoursePriceId(course);
  
  // Create a new object without the environment-specific price ID fields
  const { stripe_price_id, stripe_price_id_dev, ...cleanCourse } = course;
  
  return {
    ...cleanCourse,
    price_id
  };
}; 