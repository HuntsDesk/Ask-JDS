import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from '@/lib/supabase';
import { Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { VideoPlayer } from '@/components/VideoPlayer';

interface Module {
  id: string;
  title: string;
  course_id: string;
  course_title?: string;
}

interface LessonFormProps {
  editMode?: boolean;
  lessonId?: string;
  moduleId?: string; // Pre-selected module ID when adding a lesson to a specific module
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLesson = ({
  editMode = false,
  lessonId = "",
  moduleId = "",
  onClose,
  onSuccess
}: LessonFormProps) => {
  const { toast } = useToast();
  
  const [lesson, setLesson] = useState({
    title: '',
    content: '',
    video_id: '',
    position: 1,
    module_id: moduleId || '',
    status: 'Draft'
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState({
    submit: false,
    fetch: editMode,
    modules: true
  });
  
  const [error, setError] = useState<string | null>(null);
  
  // State to fix video flashing
  const [videoKey, setVideoKey] = useState(Date.now());

  // Fetch available modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select(`
            id, 
            title, 
            course_id,
            course:courses(title)
          `)
          .order('title', { ascending: true });
        
        if (error) throw error;
        
        // Process data to include course title
        const processedModules = data?.map(module => ({
          id: module.id,
          title: module.title,
          course_id: module.course_id,
          course_title: module.course?.title
        })) || [];
        
        setModules(processedModules);
      } catch (err: any) {
        logger.error('Error fetching modules:', err);
        setError(`Failed to load modules: ${err.message}`);
      } finally {
        setLoading(prev => ({ ...prev, modules: false }));
      }
    };
    
    fetchModules();
  }, []);

  // Fetch lesson data if in edit mode
  useEffect(() => {
    if (editMode && lessonId) {
      const fetchLesson = async () => {
        try {
          // Skip fetching if it's a temporary ID
          if (lessonId.startsWith('temp-')) {
            setLoading(prev => ({ ...prev, fetch: false }));
            return;
          }
          
          const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setLesson({
              title: data.title || '',
              content: data.content || '',
              video_id: data.video_id || '',
              position: data.position || 1,
              module_id: data.module_id || '',
              status: data.status || 'Draft'
            });
          }
        } catch (err: any) {
          logger.error('Error fetching lesson:', err);
          setError(`Failed to load lesson data: ${err.message}`);
        } finally {
          setLoading(prev => ({ ...prev, fetch: false }));
        }
      };
      
      fetchLesson();
    } else {
      // If adding a new lesson, determine the next position
      if (moduleId) {
        getNextPosition(moduleId);
      }
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  }, [editMode, lessonId, moduleId]);

  // Calculate next position when module changes
  useEffect(() => {
    if (!editMode && lesson.module_id) {
      getNextPosition(lesson.module_id);
    }
  }, [lesson.module_id, editMode]);

  // Get the next available position for a new lesson
  const getNextPosition = async (selectedModuleId: string) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('position')
        .eq('module_id', selectedModuleId)
        .order('position', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      const nextPosition = data && data.length > 0 ? data[0].position + 1 : 1;
      
      setLesson(prev => ({ ...prev, position: nextPosition }));
    } catch (err) {
      logger.error('Error determining next position:', err);
      // Default to position 1 if there's an error
      setLesson(prev => ({ ...prev, position: 1 }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLesson(prev => ({ ...prev, [name]: value }));
    
    // Regenerate key when video_id changes to prevent flashing
    if (name === 'video_id') {
      setVideoKey(Date.now());
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setLesson(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));
    setError(null);
    
    try {
      if (!lesson.module_id) {
        throw new Error('Please select a module');
      }
      
      if (lesson.position < 1) {
        throw new Error('Position must be at least 1');
      }
      
      let result;
      
      if (editMode && lessonId) {
        // Update existing lesson
        result = await supabase
          .from('lessons')
          .update(lesson)
          .eq('id', lessonId);
          
        if (result.error) throw result.error;
        
        toast({
          title: "Lesson updated",
          description: "The lesson has been successfully updated.",
          duration: 3000,
        });
      } else {
        // Create new lesson
        result = await supabase
          .from('lessons')
          .insert(lesson)
          .select();
          
        if (result.error) throw result.error;
        
        toast({
          title: "Lesson created",
          description: "The new lesson has been successfully created.",
          duration: 3000,
        });
      }
      
      onSuccess();
    } catch (err: any) {
      logger.error('Error saving lesson:', err);
      setError(`Failed to save lesson: ${err.message}`);
      
      toast({
        title: "Error",
        description: `Failed to save lesson: ${err.message}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  if (loading.fetch || loading.modules) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner className="h-8 w-8" />
          <span className="ml-2">
            {loading.fetch ? "Loading lesson data..." : "Loading modules..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* Title and Status on the same line */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Lesson Title
          </label>
          <Input 
            id="title" 
            name="title"
            value={lesson.title}
            onChange={handleInputChange}
            placeholder="Enter lesson title"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select 
            value={lesson.status} 
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Coming Soon">Coming Soon</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Module selector - only shown for new lessons */}
      {!editMode && (
        <div className="space-y-2">
          <label htmlFor="module_id" className="text-sm font-medium">
            Module
          </label>
          <Select 
            value={lesson.module_id} 
            onValueChange={(value) => handleSelectChange('module_id', value)}
            disabled={moduleId !== ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select module" />
            </SelectTrigger>
            <SelectContent>
              {modules.map(module => (
                <SelectItem key={module.id} value={module.id}>
                  {module.title} {module.course_title ? `(${module.course_title})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {modules.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">No modules available. Please create a module first.</p>
          )}
        </div>
      )}
      
      {/* Video Preview - displayed without heading */}
      {lesson.video_id && (
        <div>
          <VideoPlayer key={videoKey} videoId={lesson.video_id} height={240} />
        </div>
      )}
      
      {/* Content */}
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          Content
        </label>
        <Textarea 
          id="content" 
          name="content"
          value={lesson.content}
          onChange={handleInputChange}
          placeholder="Add lesson content here (Markdown supported)"
          rows={10}
          className="resize-y min-h-[120px]"
        />
      </div>
      
      {/* Gumlet Video ID */}
      <div className="space-y-2">
        <label htmlFor="video_id" className="text-sm font-medium">
          Gumlet Video ID
        </label>
        <Input 
          id="video_id" 
          name="video_id"
          value={lesson.video_id}
          onChange={handleInputChange}
          placeholder="Enter Gumlet asset ID (e.g., 67479d574b7280df4bfa33c7)"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading.submit} className="bg-orange-500 hover:bg-orange-600 text-white">
          {loading.submit ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              {editMode ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {editMode ? 'Save Lesson' : 'Create Lesson'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreateLesson; 