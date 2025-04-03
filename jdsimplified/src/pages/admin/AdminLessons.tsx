
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Plus, 
  Edit2,
  Trash2, 
  MoveUp,
  MoveDown,
  MoreVertical,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { getCourseById, getModulesByCourseId, getLessonsByModuleId, createLesson, updateLesson, deleteLesson } from '@/services/courseService';
import { Module, Lesson } from '@/types/course';

const lessonFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  videoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  duration: z.string().min(1, { message: 'Duration is required.' }),
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

const AdminLessons = () => {
  const navigate = useNavigate();
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [moduleName, setModuleName] = useState('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: '',
      description: '',
      videoUrl: '',
      duration: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !moduleId) return;
      
      setIsLoading(true);
      try {
        const course = await getCourseById(courseId);
        if (course) {
          setCourseName(course.title);
        }
        
        const modules = await getModulesByCourseId(courseId);
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          setModuleName(module.title);
        }
        
        const lessonData = await getLessonsByModuleId(moduleId);
        setLessons(lessonData);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, moduleId]);

  const openAddDialog = () => {
    form.reset({
      title: '',
      description: '',
      videoUrl: '',
      duration: '',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    form.reset({
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsDeleteDialogOpen(true);
  };

  const handleAddLesson = async (values: LessonFormValues) => {
    if (!moduleId) return;
    
    try {
      const newLesson = await createLesson({
        moduleId,
        title: values.title,
        description: values.description,
        videoUrl: values.videoUrl || undefined,
        duration: values.duration,
        position: lessons.length + 1,
        status: 'Draft',
      });
      
      setLessons([...lessons, newLesson]);
      setIsAddDialogOpen(false);
      
      toast({
        title: 'Lesson created',
        description: 'The lesson has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create lesson.',
        variant: 'destructive',
      });
    }
  };

  const handleEditLesson = async (values: LessonFormValues) => {
    if (!currentLesson) return;
    
    try {
      const updatedLesson = await updateLesson(currentLesson.id, {
        title: values.title,
        description: values.description,
        videoUrl: values.videoUrl || undefined,
        duration: values.duration,
      });
      
      setLessons(lessons.map(l => l.id === currentLesson.id ? { ...l, ...updatedLesson } : l));
      setIsEditDialogOpen(false);
      
      toast({
        title: 'Lesson updated',
        description: 'The lesson has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lesson.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLesson = async () => {
    if (!currentLesson) return;
    
    try {
      await deleteLesson(currentLesson.id);
      
      // Update the order of remaining lessons
      const remainingLessons = lessons.filter(l => l.id !== currentLesson.id);
      setLessons(remainingLessons);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: 'Lesson deleted',
        description: 'The lesson has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lesson.',
        variant: 'destructive',
      });
    }
  };

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) return;
    
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;
    
    // Swap positions
    const newLessons = [...lessons];
    [newLessons[lessonIndex], newLessons[newIndex]] = [newLessons[newIndex], newLessons[lessonIndex]];
    
    // Update position properties
    const updatedLessons = newLessons.map((lesson, index) => ({
      ...lesson,
      position: index + 1,
    }));
    
    setLessons(updatedLessons);
    
    // In a real app, you would update the position in the database
    try {
      // For each lesson with changed position, update it
      await Promise.all(
        [updatedLessons[lessonIndex], updatedLessons[newIndex]].map(lesson => 
          updateLesson(lesson.id, { position: lesson.position })
        )
      );
      
      toast({
        title: 'Lesson order updated',
        description: 'The lesson order has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lesson order.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
          <h1 className="text-2xl font-bold truncate">
            Module Lessons
          </h1>
        </div>
        
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{courseName}: {moduleName}</CardTitle>
          <CardDescription>
            Manage the lessons for this module. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No lessons yet. Add your first lesson to get started.</p>
              <Button onClick={openAddDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {lessons.map((lesson, index) => (
                <li key={lesson.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold">{lesson.title}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{lesson.duration}</span>
                      </div>
                      <p className="text-gray-600 mt-2 text-sm">{lesson.description}</p>
                    </div>
                    
                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(lesson)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(lesson)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          {index > 0 && (
                            <DropdownMenuItem onClick={() => handleMoveLesson(lesson.id, 'up')}>
                              <MoveUp className="h-4 w-4 mr-2" />
                              Move Up
                            </DropdownMenuItem>
                          )}
                          {index < lessons.length - 1 && (
                            <DropdownMenuItem onClick={() => handleMoveLesson(lesson.id, 'down')}>
                              <MoveDown className="h-4 w-4 mr-2" />
                              Move Down
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {/* Add Lesson Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
            <DialogDescription>
              Create a new lesson for this module.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddLesson)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Structure of the Constitution" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of lesson content" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 45 min" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/video.mp4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit">Add Lesson</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Lesson Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              Update the lesson details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditLesson)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLessons;
