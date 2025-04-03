
import { z } from "zod";

export const courseFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  overview: z.string().min(50, { message: 'Detailed description must be at least 50 characters.' }),
  price: z.coerce.number().min(0, { message: 'Price must be a positive number.' }),
  originalPrice: z.coerce.number().min(0, { message: 'Original price must be a positive number.' }).optional(),
  image: z.string().url({ message: 'Image must be a valid URL.' }),
  duration: z.string().min(1, { message: 'Duration is required.' }),
  lessons: z.coerce.number().min(1, { message: 'Course must have at least 1 lesson.' }),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  isFeatured: z.boolean().default(false),
  category: z.string().min(1, { message: 'Category is required.' }),
  daysOfAccess: z.coerce.number().min(1, { message: 'Access duration must be at least 1 day.' }),
  status: z.enum(['Draft', 'Coming Soon', 'Published', 'Archived']),
  instructorName: z.string().min(2, { message: 'Instructor name must be at least 2 characters.' }),
  instructorTitle: z.string().min(2, { message: 'Instructor title must be at least 2 characters.' }),
  instructorImage: z.string().url({ message: 'Instructor image must be a valid URL.' }),
  instructorBio: z.string().min(20, { message: 'Instructor bio must be at least 20 characters.' }),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;
