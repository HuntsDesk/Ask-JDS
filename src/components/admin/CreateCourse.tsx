import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from '@/lib/supabase';
import { CheckIcon, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CourseFormProps {
  editMode?: boolean;
  courseId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCourse = ({
  editMode = false,
  courseId = "",
  onClose,
  onSuccess
}: CourseFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState({
    title: '',
    overview: '',
    tile_description: '',
    days_of_access: 365,
    is_featured: false,
    status: 'Draft',
    image_url: '',
    what_youll_learn: ''
  });

  const [loading, setLoading] = useState({
    submit: false,
    fetch: editMode
  });
  
  const [error, setError] = useState<string | null>(null);

  // Fetch course data if in edit mode
  useEffect(() => {
    if (editMode && courseId) {
      const fetchCourse = async () => {
        try {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setCourse({
              title: data.title || '',
              overview: data.overview || '',
              tile_description: data.tile_description || '',
              days_of_access: data.days_of_access || 365,
              is_featured: data.is_featured || false,
              status: data.status || 'draft',
              image_url: data.image_url || '',
              what_youll_learn: Array.isArray(data.what_youll_learn) 
                ? data.what_youll_learn.join('\n') 
                : (data.what_youll_learn || '')
            });
          }
        } catch (err: any) {
          logger.error('Error fetching course:', err);
          setError(`Failed to load course data: ${err.message}`);
        } finally {
          setLoading(prev => ({ ...prev, fetch: false }));
        }
      };
      
      fetchCourse();
    }
  }, [editMode, courseId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setCourse(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setCourse(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));
    setError(null);
    
    try {
      // Process the data
      const courseData = {
        ...course,
        what_youll_learn: course.what_youll_learn.split('\n').filter(item => item.trim().length > 0)
      };
      
      let result;
      
      if (editMode && courseId) {
        // Update existing course
        result = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId);
          
        if (result.error) throw result.error;
        
        toast({
          title: "Course updated",
          description: "The course has been successfully updated.",
          duration: 3000,
        });
      } else {
        // Create new course
        result = await supabase
          .from('courses')
          .insert(courseData)
          .select();
          
        if (result.error) throw result.error;
        
        toast({
          title: "Course created",
          description: "The new course has been successfully created.",
          duration: 3000,
        });
      }
      
      onSuccess();
    } catch (err: any) {
      logger.error('Error saving course:', err);
      setError(`Failed to save course: ${err.message}`);
      
      toast({
        title: "Error",
        description: `Failed to save course: ${err.message}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  if (loading.fetch) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner className="h-8 w-8" />
            <span className="ml-2">Loading course data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{editMode ? 'Edit Course' : 'Create New Course'}</CardTitle>
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
            <Label htmlFor="title">Course Title</Label>
            <Input 
              id="title" 
              name="title"
              value={course.title}
              onChange={handleInputChange}
              placeholder="Enter course title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="overview">Overview</Label>
            <Textarea 
              id="overview" 
              name="overview"
              value={course.overview}
              onChange={handleInputChange}
              placeholder="Brief overview of the course"
              rows={6}
              className="min-h-[150px] resize-y"
            />
            <p className="text-xs text-muted-foreground">Provide a detailed overview of the course content and objectives</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tile_description">Tile Description</Label>
            <Textarea 
              id="tile_description" 
              name="tile_description"
              value={course.tile_description}
              onChange={handleInputChange}
              placeholder="Short description for the course tile"
              rows={2}
            />
          </div>
          
          <div className="space-y-2 pt-2">
            <Label htmlFor="what_youll_learn" className="font-semibold text-base">What You'll Learn (one item per line)</Label>
            <Textarea 
              id="what_youll_learn" 
              name="what_youll_learn"
              value={course.what_youll_learn}
              onChange={handleInputChange}
              placeholder="Enter learning objectives, one per line"
              rows={8}
              className="min-h-[200px] resize-y border-primary/20 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">Each line will be displayed as a separate bullet point</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input 
              id="image_url" 
              name="image_url"
              value={course.image_url}
              onChange={handleInputChange}
              placeholder="URL for course image"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="days_of_access">Days of Access</Label>
            <Input 
              id="days_of_access" 
              name="days_of_access"
              type="number"
              value={course.days_of_access}
              onChange={handleNumberChange}
              min={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={course.status} 
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
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
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_featured"
              checked={course.is_featured}
              onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)}
            />
            <Label htmlFor="is_featured">Featured Course</Label>
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
                {editMode ? 'Update Course' : 'Create Course'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateCourse; 