import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from '@/lib/supabase';
import { CheckIcon, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
}

interface ModuleFormProps {
  editMode?: boolean;
  moduleId?: string;
  courseId?: string; // Pre-selected course ID when adding a module to a specific course
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateModule = ({
  editMode = false,
  moduleId = "",
  courseId = "",
  onClose,
  onSuccess
}: ModuleFormProps) => {
  const { toast } = useToast();
  
  const [module, setModule] = useState({
    title: '',
    position: 1,
    course_id: courseId || ''
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState({
    submit: false,
    fetch: editMode,
    courses: true
  });
  
  const [error, setError] = useState<string | null>(null);

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .order('title', { ascending: true });
        
        if (error) throw error;
        
        setCourses(data || []);
      } catch (err: any) {
        logger.error('Error fetching courses:', err);
        setError(`Failed to load courses: ${err.message}`);
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };
    
    fetchCourses();
  }, []);

  // Fetch module data if in edit mode
  useEffect(() => {
    if (editMode && moduleId) {
      const fetchModule = async () => {
        try {
          const { data, error } = await supabase
            .from('modules')
            .select('*')
            .eq('id', moduleId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setModule({
              title: data.title || '',
              position: data.position || 1,
              course_id: data.course_id || ''
            });
          }
        } catch (err: any) {
          logger.error('Error fetching module:', err);
          setError(`Failed to load module data: ${err.message}`);
        } finally {
          setLoading(prev => ({ ...prev, fetch: false }));
        }
      };
      
      fetchModule();
    } else {
      // If adding a new module, determine the next position
      if (courseId) {
        getNextPosition(courseId);
      }
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  }, [editMode, moduleId, courseId]);

  // Calculate next position when course changes
  useEffect(() => {
    if (!editMode && module.course_id) {
      getNextPosition(module.course_id);
    }
  }, [module.course_id, editMode]);

  // Get the next available position for a new module
  const getNextPosition = async (selectedCourseId: string) => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('position')
        .eq('course_id', selectedCourseId)
        .order('position', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      const nextPosition = data && data.length > 0 ? data[0].position + 1 : 1;
      
      setModule(prev => ({ ...prev, position: nextPosition }));
    } catch (err) {
      logger.error('Error determining next position:', err);
      // Default to position 1 if there's an error
      setModule(prev => ({ ...prev, position: 1 }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModule(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setModule(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setModule(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));
    setError(null);
    
    try {
      if (!module.course_id) {
        throw new Error('Please select a course');
      }
      
      if (module.position < 1) {
        throw new Error('Position must be at least 1');
      }
      
      let result;
      
      if (editMode && moduleId) {
        // Update existing module
        result = await supabase
          .from('modules')
          .update(module)
          .eq('id', moduleId);
          
        if (result.error) throw result.error;
        
        toast({
          title: "Module updated",
          description: "The module has been successfully updated.",
          duration: 3000,
        });
      } else {
        // Create new module
        result = await supabase
          .from('modules')
          .insert(module)
          .select();
          
        if (result.error) throw result.error;
        
        toast({
          title: "Module created",
          description: "The new module has been successfully created.",
          duration: 3000,
        });
      }
      
      onSuccess();
    } catch (err: any) {
      logger.error('Error saving module:', err);
      setError(`Failed to save module: ${err.message}`);
      
      toast({
        title: "Error",
        description: `Failed to save module: ${err.message}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  if (loading.fetch || loading.courses) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner className="h-8 w-8" />
            <span className="ml-2">
              {loading.fetch ? "Loading module data..." : "Loading courses..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{editMode ? 'Edit Module' : 'Create New Module'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="course_id">Course</Label>
            <Select 
              value={module.course_id} 
              onValueChange={(value) => handleSelectChange('course_id', value)}
              disabled={courseId !== "" || editMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {courses.length === 0 && (
              <p className="text-sm text-amber-600">No courses available. Please create a course first.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Module Title</Label>
            <Input 
              id="title" 
              name="title"
              value={module.title}
              onChange={handleInputChange}
              placeholder="Enter module title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input 
              id="position" 
              name="position"
              type="number"
              value={module.position}
              onChange={handleNumberChange}
              min={1}
              required
            />
            <p className="text-xs text-muted-foreground">
              The order in which this module appears in the course.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading.submit}>
            {loading.submit ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                {editMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                {editMode ? 'Update Module' : 'Create Module'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateModule; 