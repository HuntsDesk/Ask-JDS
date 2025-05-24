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
 * Check if the current environment is production
 * @returns true if running in production, false otherwise
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
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