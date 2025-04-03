
import { z } from 'zod';

// Define user validation schema
export const userSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

// Create type from the schema
export type User = z.infer<typeof userSchema>;
