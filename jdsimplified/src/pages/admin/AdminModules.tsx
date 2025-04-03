
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
  FileText
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
import { getCourseById, getModulesByCourseId, createModule, updateModule, deleteModule } from '@/services/courseService';
import { Module } from '@/types/course';

const moduleFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
});

type ModuleFormValues = z.infer<typeof moduleFormSchema>;

const AdminModules = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      setIsLoading(true);
      try {
        const course = await getCourseById(courseId);
        if (course) {
          setCourseName(course.title);
        }
        
        const moduleData = await getModulesByCourseId(courseId);
        setModules(moduleData);
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
  }, [courseId]);

  const openAddDialog = () => {
    form.reset({
      title: '',
      description: '',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (module: Module) => {
    setCurrentModule(module);
    form.reset({
      title: module.title,
      description: module.description,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (module: Module) => {
    setCurrentModule(module);
    setIsDeleteDialogOpen(true);
  };

  const handleAddModule = async (values: ModuleFormValues) => {
    if (!courseId) return;
    
    try {
      const newModule = await createModule({
        courseId,
        title: values.title,
        description: values.description,
        position: modules.length + 1,
      });
      
      setModules([...modules, newModule]);
      setIsAddDialogOpen(false);
      
      toast({
        title: 'Module created',
        description: 'The module has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create module.',
        variant: 'destructive',
      });
    }
  };

  const handleEditModule = async (values: ModuleFormValues) => {
    if (!currentModule) return;
    
    try {
      const updatedModule = await updateModule(currentModule.id, {
        title: values.title,
        description: values.description,
      });
      
      setModules(modules.map(m => m.id === currentModule.id ? { ...m, ...updatedModule } : m));
      setIsEditDialogOpen(false);
      
      toast({
        title: 'Module updated',
        description: 'The module has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update module.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteModule = async () => {
    if (!currentModule) return;
    
    try {
      await deleteModule(currentModule.id);
      
      // Update the order of remaining modules
      const remainingModules = modules.filter(m => m.id !== currentModule.id);
      setModules(remainingModules);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: 'Module deleted',
        description: 'The module has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete module.',
        variant: 'destructive',
      });
    }
  };

  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;
    
    const newIndex = direction === 'up' ? moduleIndex - 1 : moduleIndex + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;
    
    // Swap positions
    const newModules = [...modules];
    [newModules[moduleIndex], newModules[newIndex]] = [newModules[newIndex], newModules[moduleIndex]];
    
    // Update position properties
    const updatedModules = newModules.map((module, index) => ({
      ...module,
      position: index + 1,
    }));
    
    setModules(updatedModules);
    
    // In a real app, you would update the position in the database
    try {
      // For each module with changed position, update it
      await Promise.all(
        [updatedModules[moduleIndex], updatedModules[newIndex]].map(module => 
          updateModule(module.id, { position: module.position })
        )
      );
      
      toast({
        title: 'Module order updated',
        description: 'The module order has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update module order.',
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
            onClick={() => navigate(`/admin/courses/${courseId}`)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          <h1 className="text-2xl font-bold">
            Course Modules
          </h1>
        </div>
        
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{courseName}</CardTitle>
          <CardDescription>
            Manage the modules for this course. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No modules yet. Add your first module to get started.</p>
              <Button onClick={openAddDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {modules.map((module, index) => (
                <li key={module.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold">{module.title}</h3>
                      <p className="text-gray-500 text-sm">{module.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/admin/courses/${courseId}/modules/${module.id}/lessons`)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Lessons
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(module)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(module)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          {index > 0 && (
                            <DropdownMenuItem onClick={() => handleMoveModule(module.id, 'up')}>
                              <MoveUp className="h-4 w-4 mr-2" />
                              Move Up
                            </DropdownMenuItem>
                          )}
                          {index < modules.length - 1 && (
                            <DropdownMenuItem onClick={() => handleMoveModule(module.id, 'down')}>
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
      
      {/* Add Module Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
            <DialogDescription>
              Create a new module for this course.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddModule)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Constitutional Law" {...field} />
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
                        placeholder="Brief description of module content" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Add Module</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Module Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>
              Update the module details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditModule)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Title</FormLabel>
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
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this module? This action cannot be undone.
              All lessons within this module will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminModules;
