import { z } from 'zod';

// Base schemas for common patterns
const sanitizedString = z.string()
  .trim()
  .min(1)
  .max(10000)
  .refine(
    (val) => !/<script[^>]*>.*?<\/script>/gi.test(val),
    { message: 'Script tags not allowed' }
  )
  .refine(
    (val) => !/javascript:/gi.test(val),
    { message: 'JavaScript URLs not allowed' }
  )
  .refine(
    (val) => !/on\w+\s*=/gi.test(val),
    { message: 'Event handlers not allowed' }
  );

const sqlSafeString = z.string()
  .trim()
  .min(1)
  .max(10000)
  .refine(
    (val) => !/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi.test(val),
    { message: 'SQL keywords not allowed' }
  );

const uuid = z.string().uuid();
const email = z.string().email().max(254);
const url = z.string().url().max(2048);

// Chat validation schemas
export const ChatMessageSchema = z.object({
  message: sanitizedString.max(2000),
  threadId: uuid.optional(),
  model: z.enum(['jds-titan', 'jds-flash']).optional(),
  context: z.object({
    previousMessages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: sanitizedString
    })).max(50).optional()
  }).optional()
});

export const CreateThreadSchema = z.object({
  title: sanitizedString.max(200).optional(),
  initialMessage: sanitizedString.max(2000)
});

// Flashcard validation schemas
export const CreateFlashcardSchema = z.object({
  question: sanitizedString.max(1000),
  answer: sanitizedString.max(5000),
  subjectId: uuid,
  collectionId: uuid.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(sanitizedString.max(50)).max(10).optional()
});

export const UpdateFlashcardSchema = z.object({
  id: uuid,
  question: sanitizedString.max(1000).optional(),
  answer: sanitizedString.max(5000).optional(),
  subjectId: uuid.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(sanitizedString.max(50)).max(10).optional()
});

export const CreateCollectionSchema = z.object({
  name: sanitizedString.max(200),
  description: sanitizedString.max(1000).optional(),
  subjectId: uuid,
  isPublic: z.boolean().default(false),
  tags: z.array(sanitizedString.max(50)).max(10).optional()
});

// Course validation schemas
export const CreateCourseSchema = z.object({
  title: sanitizedString.max(200),
  overview: sanitizedString.max(5000),
  description: sanitizedString.max(2000).optional(),
  price: z.number().min(0).max(999999).optional(),
  daysOfAccess: z.number().int().min(1).max(3650).default(30),
  isFeatured: z.boolean().default(false),
  thumbnailUrl: url.optional(),
  tags: z.array(sanitizedString.max(50)).max(20).optional()
});

export const CreateModuleSchema = z.object({
  courseId: uuid,
  title: sanitizedString.max(200),
  description: sanitizedString.max(1000).optional(),
  position: z.number().int().min(0).max(1000),
  duration: z.number().int().min(0).max(86400).optional() // seconds
});

export const CreateLessonSchema = z.object({
  moduleId: uuid,
  title: sanitizedString.max(200),
  content: sanitizedString.max(50000),
  position: z.number().int().min(0).max(1000),
  duration: z.number().int().min(0).max(86400).optional(), // seconds
  videoUrl: url.optional(),
  attachments: z.array(z.object({
    name: sanitizedString.max(200),
    url: url,
    type: z.enum(['pdf', 'video', 'audio', 'image', 'document'])
  })).max(10).optional()
});

// User and profile validation schemas
export const UpdateProfileSchema = z.object({
  firstName: sanitizedString.max(100).optional(),
  lastName: sanitizedString.max(100).optional(),
  bio: sanitizedString.max(500).optional(),
  avatarUrl: url.optional(),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    language: z.enum(['en', 'es', 'fr', 'de']).optional()
  }).optional()
});

// Payment validation schemas
export const CreatePaymentIntentSchema = z.object({
  priceId: z.string().min(1).max(100),
  courseId: uuid.optional(),
  successUrl: url,
  cancelUrl: url,
  metadata: z.record(z.string().max(500)).optional()
});

export const StripeWebhookSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.string(),
  data: z.object({
    object: z.record(z.any())
  }),
  created: z.number(),
  livemode: z.boolean()
});

// Admin validation schemas
export const AdminUserUpdateSchema = z.object({
  userId: uuid,
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  subscriptionOverride: z.object({
    tier: z.enum(['free', 'premium', 'unlimited']),
    expiresAt: z.string().datetime().optional()
  }).optional()
});

// Search and filter schemas
export const SearchSchema = z.object({
  query: sqlSafeString.max(200),
  category: z.enum(['flashcards', 'courses', 'collections']).optional(),
  subjectId: uuid.optional(),
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// File upload validation
export const FileUploadSchema = z.object({
  filename: sanitizedString.max(255)
    .refine(
      (val) => !/[<>:"/\\|?*]/.test(val),
      { message: 'Invalid filename characters' }
    ),
  contentType: z.string()
    .refine(
      (val) => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4'].includes(val),
      { message: 'Unsupported file type' }
    ),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  purpose: z.enum(['avatar', 'course_thumbnail', 'lesson_video', 'attachment'])
});

// Security-specific schemas
export const SecurityReportSchema = z.object({
  type: z.enum(['csp_violation', 'suspicious_activity', 'rate_limit_exceeded', 'auth_failure']),
  details: z.record(z.any()),
  userAgent: z.string().max(500).optional(),
  url: z.string().max(2048).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});

// Rate limiting schema
export const RateLimitCheckSchema = z.object({
  endpoint: z.string().max(100),
  userId: uuid.optional(),
  windowMinutes: z.number().int().min(1).max(1440).default(60),
  limit: z.number().int().min(1).max(10000).default(100)
});

// Helper function to validate and sanitize input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Helper to check for common security threats in any string
export function containsSecurityThreats(input: string): boolean {
  const threats = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b.*\b(FROM|INTO|SET|WHERE|TABLE)\b/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /data:(?!image\/)/gi,
    /vbscript:/gi,
    /file:/gi
  ];

  return threats.some(threat => threat.test(input));
}

// XSS sanitizer
export function sanitizeXSS(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// SQL injection sanitizer
export function sanitizeSQL(input: string): string {
  return input.replace(/[';--]/g, '');
} 