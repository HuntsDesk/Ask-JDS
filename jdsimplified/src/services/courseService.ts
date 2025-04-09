import { 
  Course, 
  Module, 
  Lesson, 
  Enrollment, 
  Review, 
  CourseProgress, 
  User,
  Order,
  CartItem,
  Subject
} from '@/types/course';
import { supabase } from '@/lib/supabase';

// Mock data for initial development
const MOCK_SUBJECTS: Subject[] = [
  {
    id: 's1',
    name: 'Constitutional Law',
    description: 'Study of the fundamental principles and structure of a government.'
  },
  {
    id: 's2',
    name: 'Civil Procedure',
    description: 'Study of the rules and principles that govern the process of a civil lawsuit.'
  },
  {
    id: 's3',
    name: 'Contracts',
    description: 'Study of legally binding agreements between parties.'
  },
  // Add more subjects as needed
];

const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Constitutional Law Fundamentals',
    description: 'Master the essential principles and landmark cases of Constitutional Law with a strategic framework.',
    overview: `
      <p>Constitutional Law is often considered one of the most challenging subjects in law school, with its complex doctrines, evolving interpretations, and far-reaching implications. This comprehensive course breaks down these complexities into clear, strategic frameworks that will help you understand and apply constitutional principles with confidence.</p>
      
      <p>Through our structured approach, you'll master the fundamental concepts of Constitutional Law, analyze landmark Supreme Court cases, and develop the analytical skills needed to tackle even the most challenging constitutional issues.</p>
      
      <p>Whether you're preparing for law school exams, the bar exam, or simply seeking to deepen your understanding of constitutional principles, this course provides the tools and strategies you need to succeed.</p>
    `,
    price: 299,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    duration: '8 weeks',
    lessons: 24,
    level: 'Intermediate',
    isFeatured: true,
    category: 'Constitutional Law',
    subjects: [MOCK_SUBJECTS[0]], // Constitutional Law
    instructor: {
      id: 'i1',
      name: 'Sarah Johnson',
      title: 'J.D., Constitutional Law Specialist',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      bio: 'Former law professor with 10+ years of experience teaching Constitutional Law at top law schools.'
    },
    rating: 4.8,
    reviewCount: 156,
    lastUpdated: 'June 2023',
    objectives: [
      'Understand the structure and key provisions of the U.S. Constitution',
      'Master the analytical frameworks for constitutional interpretation',
      'Analyze landmark Supreme Court cases and their impact',
      'Apply constitutional principles to factual scenarios',
      'Develop strategies for answering Constitutional Law essay and multiple-choice questions'
    ],
    daysOfAccess: 30, // 30 days
    status: 'Published',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-06-10T00:00:00Z'
  },
  // Add more mock courses here
];

const MOCK_MODULES: Module[] = [
  {
    id: 'm1',
    courseId: '1',
    title: 'Module 1: Introduction to Constitutional Law',
    description: 'Learn the basics of Constitutional Law and its foundations.',
    position: 1,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z'
  },
  {
    id: 'm2',
    courseId: '1',
    title: 'Module 2: Federal Powers',
    description: 'Understand the various powers granted to the federal government.',
    position: 2,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z'
  },
  // Add more modules
];

const MOCK_LESSONS: Lesson[] = [
  {
    id: 'l1',
    moduleId: 'm1',
    title: 'The Structure of the Constitution',
    description: 'Overview of how the Constitution is structured and organized.',
    content: 'Detailed content about the Constitution structure would go here.',
    videoUrl: 'https://example.com/video1.mp4',
    duration: '35 min',
    position: 1,
    status: 'Published',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z'
  },
  {
    id: 'l2',
    moduleId: 'm1',
    title: 'Constitutional Interpretation Methods',
    description: 'Learn different approaches to interpreting the Constitution.',
    content: 'Detailed content about interpretation methods would go here.',
    videoUrl: 'https://example.com/video2.mp4',
    duration: '45 min',
    position: 2,
    status: 'Published',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z'
  },
  // Add more lessons
];

// Mock Users (for admin panel)
const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'u2',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    createdAt: '2023-01-10T00:00:00Z'
  },
  // Add more users
];

// In a real application, these functions would make API calls
// For now, we'll use the mock data and localStorage

// Subject functions
export const getSubjects = async (): Promise<Subject[]> => {
  return MOCK_SUBJECTS;
};

export const getSubjectById = async (id: string): Promise<Subject | null> => {
  return MOCK_SUBJECTS.find(subject => subject.id === id) || null;
};

// Course functions
export const getCourses = async (): Promise<Course[]> => {
  try {
    // First get all courses
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (coursesError) throw new Error(`Error fetching courses: ${coursesError.message}`);
    if (!coursesData) return [];
    
    // Now get all modules with their course_id
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        course_id,
        lessons(id)
      `);
    
    if (modulesError) throw new Error(`Error fetching modules with lessons: ${modulesError.message}`);
    if (!modulesData) return coursesData;
    
    // Process the data to get module and lesson counts
    const coursesWithCount = coursesData.map(course => {
      // Find all modules belonging to this course
      const courseModules = modulesData.filter(module => module.course_id === course.id);
      
      // Count modules
      const moduleCount = courseModules.length;
      
      // Count all lessons across all modules of this course
      const lessonCount = courseModules.reduce((total, module) => {
        return total + (module.lessons ? module.lessons.length : 0);
      }, 0);
      
      return {
        ...course,
        _count: {
          modules: moduleCount,
          lessons: lessonCount
        }
      };
    });
    
    return coursesWithCount;
  } catch (err) {
    console.error('Error in getCourses:', err);
    return [];
  }
};

export const getFeaturedCourses = async (): Promise<Course[]> => {
  return MOCK_COURSES.filter(course => course.isFeatured);
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  return MOCK_COURSES.find(course => course.id === id) || null;
};

export const createCourse = async (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> => {
  const newCourse: Course = {
    ...course,
    id: `c${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // In a real app, save to API
  console.log('Created course:', newCourse);
  return newCourse;
};

export const updateCourse = async (id: string, course: Partial<Course>): Promise<Course> => {
  // In a real app, update via API
  console.log('Updated course:', id, course);
  return {
    ...MOCK_COURSES.find(c => c.id === id)!,
    ...course,
    updatedAt: new Date().toISOString()
  };
};

export const deleteCourse = async (id: string): Promise<void> => {
  // In a real app, delete via API
  console.log('Deleted course:', id);
};

// Module functions
export const getModulesByCourseId = async (courseId: string): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });
    
    if (error) throw new Error(`Error fetching modules: ${error.message}`);
    return data || [];
  } catch (err) {
    console.error('Error in getModulesByCourseId:', err);
    return [];
  }
};

export const createModule = async (module: Omit<Module, 'id' | 'createdAt' | 'updatedAt'>): Promise<Module> => {
  const newModule: Module = {
    ...module,
    id: `m${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log('Created module:', newModule);
  return newModule;
};

export const updateModule = async (id: string, module: Partial<Module>): Promise<Module> => {
  console.log('Updated module:', id, module);
  return {
    ...MOCK_MODULES.find(m => m.id === id)!,
    ...module,
    updatedAt: new Date().toISOString()
  };
};

export const deleteModule = async (id: string): Promise<void> => {
  console.log('Deleted module:', id);
};

// Lesson functions
export const getLessonsByModuleId = async (moduleId: string): Promise<Lesson[]> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('position', { ascending: true });
    
    if (error) throw new Error(`Error fetching lessons: ${error.message}`);
    return data || [];
  } catch (err) {
    console.error('Error in getLessonsByModuleId:', err);
    return [];
  }
};

export const createLesson = async (lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> => {
  const newLesson: Lesson = {
    ...lesson,
    id: `l${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log('Created lesson:', newLesson);
  return newLesson;
};

export const updateLesson = async (id: string, lesson: Partial<Lesson>): Promise<Lesson> => {
  console.log('Updated lesson:', id, lesson);
  return {
    ...MOCK_LESSONS.find(l => l.id === id)!,
    ...lesson,
    updatedAt: new Date().toISOString()
  };
};

export const deleteLesson = async (id: string): Promise<void> => {
  console.log('Deleted lesson:', id);
};

// User functions (for admin panel)
export const getUsers = async (): Promise<User[]> => {
  return MOCK_USERS;
};

// Enrollment related functions
export const enrollUserInCourse = async (userId: string, courseId: string): Promise<Enrollment> => {
  const course = MOCK_COURSES.find(c => c.id === courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  
  const purchaseDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + (course.daysOfAccess || 30));
  
  const enrollment: Enrollment = {
    id: `e${Date.now()}`,
    userId,
    courseId,
    purchaseDate: purchaseDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    completedLessons: [],
    progress: 0,
    status: 'active'
  };
  
  console.log('User enrolled:', enrollment);
  return enrollment;
};

export const getUserEnrollments = async (userId: string): Promise<Enrollment[]> => {
  // In a real app, fetch from API
  return [];
};

export const markLessonAsCompleted = async (
  userId: string, 
  courseId: string, 
  lessonId: string
): Promise<void> => {
  console.log('Lesson marked as completed:', userId, courseId, lessonId);
};

export const getCourseProgress = async (
  userId: string, 
  courseId: string
): Promise<CourseProgress | null> => {
  // In a real app, fetch from API
  return null;
};

// Cart and checkout functions
export const addToCart = async (userId: string, courseId: string): Promise<void> => {
  console.log('Added to cart:', userId, courseId);
};

export const removeFromCart = async (userId: string, courseId: string): Promise<void> => {
  console.log('Removed from cart:', userId, courseId);
};

export const getCart = async (userId: string): Promise<CartItem[]> => {
  // In a real app, fetch from API
  return [];
};

export const createOrder = async (
  userId: string, 
  items: { courseId: string; price: number }[]
): Promise<Order> => {
  const order: Order = {
    id: `o${Date.now()}`,
    userId,
    items,
    totalAmount: items.reduce((sum, item) => sum + item.price, 0),
    paymentStatus: 'pending',
    paymentMethod: 'credit_card',
    createdAt: new Date().toISOString()
  };
  
  console.log('Order created:', order);
  return order;
};

// User login and registration
export const login = async (email: string, password: string): Promise<User | null> => {
  // In a real app, authenticate via API
  if (email === 'admin@example.com' && password === 'password') {
    return MOCK_USERS.find(u => u.email === email) || null;
  }
  return null;
};

export const register = async (name: string, email: string, password: string): Promise<User | null> => {
  // In a real app, register via API
  const newUser: User = {
    id: `u${Date.now()}`,
    name,
    email,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  
  console.log('User registered:', newUser);
  return newUser;
};
