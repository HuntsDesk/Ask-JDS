import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { BookOpen, Layers, FileText, Search, Plus, PenSquare, Trash2, ChevronRight, AlertCircle, ArrowUpDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import CreateCourse from './CreateCourse';
import CreateModule from './CreateModule';
import CreateLesson from './CreateLesson';

// Define interfaces for our data types
interface Course {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  overview?: string;
  tile_description?: string;
  is_featured?: boolean;
  days_of_access?: number;
  what_youll_learn?: string[];
  _count?: {
    modules: number;
    lessons: number;
  };
}

interface Module {
  id: string;
  title: string;
  course_id: string;
  position: number;
  description?: string;
  created_at: string;
  updated_at?: string;
  course?: {
    title: string;
  };
  _count?: {
    lessons: number;
  };
}

interface Lesson {
  id: string;
  title: string;
  module_id: string;
  status: string;
  position: number;
  content?: string;
  video_id?: string;
  created_at: string;
  updated_at?: string;
  module?: {
    title: string;
  };
}

export const AdminCourses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for data
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    courses: true,
    modules: true,
    lessons: true,
    counts: true
  });
  const [error, setError] = useState({
    courses: null as string | null,
    modules: null as string | null,
    lessons: null as string | null,
    counts: null as string | null
  });
  
  // Counts for statistics
  const [counts, setCounts] = useState({
    courses: 0,
    modules: 0,
    lessons: 0
  });

  // Modal state for create/edit
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  
  // Add module modal state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  // Add lesson modal state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  // Filter data based on search query
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredModules = modules.filter(module => 
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (module.course?.title && module.course.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredLessons = lessons.filter(lesson => 
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lesson.module?.title && lesson.module.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Fetch statistics
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch course count
        const { count: coursesCount, error: coursesError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });
        
        if (coursesError) throw new Error(`Error fetching courses count: ${coursesError.message}`);
        
        // Fetch modules count
        const { count: modulesCount, error: modulesError } = await supabase
          .from('modules')
          .select('*', { count: 'exact', head: true });
        
        if (modulesError) throw new Error(`Error fetching modules count: ${modulesError.message}`);
        
        // Fetch lessons count
        const { count: lessonsCount, error: lessonsError } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true });
        
        if (lessonsError) throw new Error(`Error fetching lessons count: ${lessonsError.message}`);
        
        setCounts({
          courses: coursesCount || 0,
          modules: modulesCount || 0,
          lessons: lessonsCount || 0
        });
      } catch (err: any) {
        logger.error('Error fetching counts:', err);
        setError(prev => ({ ...prev, counts: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, counts: false }));
      }
    };
    
    fetchCounts();
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(prev => ({ ...prev, courses: true }));
      setError(prev => ({ ...prev, courses: null }));
      
      try {
        // First get all courses
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw new Error(`Error fetching courses: ${error.message}`);
        
        // Now get all modules with their course_id
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            course_id,
            lessons(id)
          `);
        
        if (modulesError) throw new Error(`Error fetching modules with lessons: ${modulesError.message}`);
        
        // Process the data to get module and lesson counts
        const coursesWithCount = data.map(course => {
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
        
        setCourses(coursesWithCount);
      } catch (err: any) {
        logger.error('Error fetching courses:', err);
        setError(prev => ({ ...prev, courses: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };
    
    fetchCourses();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      case 'in review':
        return <Badge className="bg-amber-500">In Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const calculateCompletion = (course: Course) => {
    if (!course._count?.modules) return 0;
    // This is a placeholder. In a real app, you'd calculate completion based on 
    // lessons completed, content uploaded, etc.
    return course._count.modules > 0 ? Math.min(100, course._count.modules * 20) : 0;
  };

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditModal = (courseId: string) => {
    setEditingCourse(courseId);
    setIsCourseModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCourseModalOpen(false);
    setEditingCourse(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    
    // Re-fetch course data
    const fetchCourses = async () => {
      try {
        // First get all courses
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw new Error(`Error fetching courses: ${error.message}`);
        
        // Now get all modules with their course_id
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            course_id,
            lessons(id)
          `);
        
        if (modulesError) throw new Error(`Error fetching modules with lessons: ${modulesError.message}`);
        
        // Process the data to get module and lesson counts
        const coursesWithCount = data.map(course => {
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
        
        setCourses(coursesWithCount);
      } catch (err: any) {
        logger.error('Error fetching courses:', err);
      }
    };
    
    // Update counts
    const fetchCounts = async () => {
      try {
        const { count: coursesCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });
        
        setCounts(prev => ({
          ...prev,
          courses: coursesCount || 0
        }));
      } catch (err) {
        logger.error('Error updating course count:', err);
      }
    };
    
    fetchCourses();
    fetchCounts();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course? This will also delete all associated modules and lessons.")) {
      return;
    }
    
    try {
      // First delete all lessons associated with the course through modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (modulesError) throw new Error(`Error fetching modules: ${modulesError.message}`);
      
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(module => module.id);
        
        // Delete lessons for these modules
        const { error: lessonsError } = await supabase
          .from('lessons')
          .delete()
          .in('module_id', moduleIds);
        
        if (lessonsError) throw new Error(`Error deleting lessons: ${lessonsError.message}`);
        
        // Delete modules
        const { error: modulesDeleteError } = await supabase
          .from('modules')
          .delete()
          .eq('course_id', courseId);
        
        if (modulesDeleteError) throw new Error(`Error deleting modules: ${modulesDeleteError.message}`);
      }
      
      // Delete the course
      const { error: courseDeleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (courseDeleteError) throw new Error(`Error deleting course: ${courseDeleteError.message}`);
      
      // Update courses state
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      
      // Update counts
      setCounts(prev => ({
        ...prev,
        courses: prev.courses - 1
      }));
      
    } catch (err: any) {
      logger.error('Error deleting course:', err);
      alert(`Failed to delete course: ${err.message}`);
    }
  };

  const navigateToCourseDetail = (courseId: string) => {
    navigate(`/admin/courses/${courseId}`);
  };

  return (
    <AdminLayout title="Course Management">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.courses}</div>
            <p className="text-xs text-muted-foreground">
              {loading.counts && "Loading..."}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Modules
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.modules}</div>
            <p className="text-xs text-muted-foreground">
              {loading.counts && "Loading..."}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Lessons
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.lessons}</div>
            <p className="text-xs text-muted-foreground">
              {loading.counts && "Loading..."}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Courses</h2>
          <Button onClick={handleOpenCreateModal} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
        
        <div className="flex items-center mb-4">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input 
            placeholder="Search courses..." 
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {error.courses && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {error.courses}
          </div>
        )}
        
        {loading.courses ? (
          <div className="flex justify-center items-center p-8">
            <LoadingSpinner className="h-8 w-8 mr-2" />
            <span>Loading courses...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-muted p-8 text-center rounded-lg">
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first course.</p>
            <Button onClick={handleOpenCreateModal} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        ) : (
          <div className="bg-background rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Lessons</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell 
                      className="font-medium"
                      onClick={() => navigateToCourseDetail(course.id)}
                    >
                      <div className="flex items-center">
                        {course.title}
                        <ChevronRight className="h-4 w-4 ml-1 text-muted-foreground" />
                      </div>
                      {course.tile_description && (
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {course.tile_description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusVariant(course.status)}
                      {course.is_featured && (
                        <Badge className="ml-2 bg-amber-500">Featured</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {course._count?.modules || 0}
                    </TableCell>
                    <TableCell>
                      {course._count?.lessons || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(course.id);
                          }}
                        >
                          <PenSquare className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      {/* Course Sheet */}
      <Sheet open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
        <SheetContent className="sm:max-w-md md:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</SheetTitle>
          </SheetHeader>
          <CreateCourse 
            editMode={!!editingCourse}
            courseId={editingCourse}
            onClose={() => setIsCourseModalOpen(false)}
            onSuccess={handleSaveSuccess}
          />
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default AdminCourses; 