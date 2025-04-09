export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  overview?: string; // Extended course description
  image: string;
  daysOfAccess?: number; // Duration in days
  isFeatured: boolean;
  status: 'Draft' | 'Coming Soon' | 'Published' | 'Archived';
  category: string;
  subjects?: Subject[]; // Many-to-many relationship
  rating: number;
  reviewCount: number;
  lastUpdated: string;
  instructor: Instructor;
  objectives: string[];
  price: number;
  originalPrice?: number;
  duration: string; // Display format of the course duration
  lessons: number; // Total number of lessons
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  updatedAt: string;
  _count?: {
    modules: number;
    lessons: number;
  };
}

export interface Instructor {
  id?: string;
  name: string;
  title: string;
  image: string;
  bio: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  position: number; // For ordering modules within a course
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  content?: string; // Textual lesson content
  videoUrl?: string;
  duration: string; // Display format of the lesson duration
  position: number; // For ordering lessons within a module
  status: 'Draft' | 'Coming Soon' | 'Published' | 'Archived';
  createdAt: string;
  updatedAt: string;
}

export interface CourseSubject {
  courseId: string;
  subjectId: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  purchaseDate: string;
  expiryDate: string;
  completedLessons: string[]; // Lesson IDs
  progress: number; // Percentage
  status: 'active' | 'expired';
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface CourseProgress {
  courseId: string;
  modulesProgress: {
    [moduleId: string]: {
      completed: boolean;
      lessons: {
        [lessonId: string]: {
          completed: boolean;
          lastAccessed?: string;
        }
      }
    }
  };
  overallProgress: number; // Percentage
  lastAccessed?: string;
}

export interface CartItem {
  courseId: string;
  price: number;
  addedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    courseId: string;
    price: number;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  createdAt: string;
}
