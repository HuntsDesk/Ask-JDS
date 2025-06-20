import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, PenSquare, Trash2, Layers, FileText, GripVertical, Info, ChevronDown, ChevronRight, ChevronUp, Edit, X, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import CreateModule from './CreateModule';
import CreateLesson from './CreateLesson';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VideoPlayer } from '@/components/VideoPlayer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the DragHandle component
const DragHandle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

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
}

interface Module {
  id: string;
  title: string;
  course_id: string;
  position: number;
  description?: string;
  created_at: string;
  updated_at?: string;
  lessons?: Lesson[];
  isExpanded?: boolean; // UI state
  isNew?: boolean; // For newly created modules that are being edited inline
  tempId?: string; // For newly created modules before they're saved
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
  isNew?: boolean; // For newly created lessons that are being edited inline
  tempId?: string; // For newly created lessons before they're saved
}

export const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  // State for data
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    course: true,
    modules: true
  });
  const [error, setError] = useState({
    course: null as string | null,
    modules: null as string | null
  });
  
  // Add a reloading state for after updates
  const [reloading, setReloading] = useState(false);
  
  // Modal states
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  // Course edit state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Refs for inline editing
  const newModuleInputRef = useRef<HTMLInputElement>(null);
  const newLessonInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
  // Inline editing states
  const [inlineEditingModuleId, setInlineEditingModuleId] = useState<string | null>(null);
  const [inlineEditingLessonId, setInlineEditingLessonId] = useState<string | null>(null);
  
  // Quick add lesson states
  const [newLessonNames, setNewLessonNames] = useState<{ [key: string]: string }>({});
  const [addingLesson, setAddingLesson] = useState(false);
  const [addingLessonModuleId, setAddingLessonModuleId] = useState<string | null>(null);
  
  // Quick add module states
  const [newModuleName, setNewModuleName] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  
  // Delete confirmation states
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteModuleTitle, setDeleteModuleTitle] = useState<string>('');
  const [deleteModuleLoading, setDeleteModuleLoading] = useState(false);
  
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const [deleteLessonTitle, setDeleteLessonTitle] = useState<string>('');
  const [deleteLessonLoading, setDeleteLessonLoading] = useState(false);

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch course details
  useEffect(() => {
    if (!courseId) return;
    
    const fetchCourse = async () => {
      setLoading(prev => ({ ...prev, course: true }));
      setError(prev => ({ ...prev, course: null }));
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (error) throw new Error(`Error fetching course: ${error.message}`);
        
        setCourse(data);
      } catch (err: any) {
        logger.error('Error fetching course:', err);
        setError(prev => ({ ...prev, course: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, course: false }));
      }
    };
    
    fetchCourse();
  }, [courseId]);

  // Fetch modules and lessons
  useEffect(() => {
    if (!courseId) return;
    
    const fetchModulesAndLessons = async () => {
      setLoading(prev => ({ ...prev, modules: true }));
      setError(prev => ({ ...prev, modules: null }));
      
      try {
        // Fetch modules for this course
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('position', { ascending: true });
        
        if (modulesError) throw new Error(`Error fetching modules: ${modulesError.message}`);
        
        if (!modulesData || modulesData.length === 0) {
          setModules([]);
          setLoading(prev => ({ ...prev, modules: false }));
          return;
        }
        
        // Fetch lessons for these modules
        const moduleIds = modulesData.map(module => module.id);
        
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('position', { ascending: true });
        
        if (lessonsError) throw new Error(`Error fetching lessons: ${lessonsError.message}`);
        
        // Organize lessons by module
        const modulesWithLessons = modulesData.map(module => {
          const moduleLessons = lessonsData 
            ? lessonsData.filter(lesson => lesson.module_id === module.id)
            : [];
          
          return {
            ...module,
            lessons: moduleLessons,
            isExpanded: true // Start with modules expanded
          };
        });
        
        setModules(modulesWithLessons);
      } catch (err: any) {
        logger.error('Error fetching modules and lessons:', err);
        setError(prev => ({ ...prev, modules: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, modules: false }));
      }
    };
    
    fetchModulesAndLessons();
  }, [courseId]);
  
  // Create a loadData function to reload all data after updates
  const loadData = async () => {
    if (!courseId) return;
    
    try {
      setReloading(true);
      
      // Reload course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw new Error(`Error reloading course: ${courseError.message}`);
      setCourse(courseData);
      
      // Reload modules and lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true });
      
      if (modulesError) throw new Error(`Error reloading modules: ${modulesError.message}`);
      
      if (!modulesData || modulesData.length === 0) {
        setModules([]);
        return;
      }
      
      // Fetch lessons for these modules
      const moduleIds = modulesData.map(module => module.id);
      
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('position', { ascending: true });
      
      if (lessonsError) throw new Error(`Error reloading lessons: ${lessonsError.message}`);
      
      // Organize lessons by module
      const modulesWithLessons = modulesData.map(module => {
        const moduleLessons = lessonsData 
          ? lessonsData.filter(lesson => lesson.module_id === module.id)
          : [];
        
        return {
          ...module,
          lessons: moduleLessons,
          // Preserve expanded state if possible
          isExpanded: modules.find(m => m.id === module.id)?.isExpanded ?? true
        };
      });
      
      setModules(modulesWithLessons);
      
      // Reload subject associations
      const { data: courseSubjects, error: courseSubjectsError } = await supabase
        .from('course_subjects')
        .select('subject_id')
        .eq('course_id', courseId);
      
      if (courseSubjectsError) throw new Error(`Error reloading subject associations: ${courseSubjectsError.message}`);
      
      if (courseSubjects && courseSubjects.length > 0) {
        setSelectedSubjectIds(courseSubjects.map(cs => cs.subject_id));
      } else {
        setSelectedSubjectIds([]);
      }
      
    } catch (err) {
      logger.error('Error reloading data:', err);
      toast({
        title: "Error",
        description: `Failed to reload data: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setReloading(false);
    }
  };

  // Add debug reference for easier testing
  useEffect(() => {
    // @ts-ignore - For debugging only
    window.jdsDebug = window.jdsDebug || {};
    // @ts-ignore - For debugging only
    window.jdsDebug.courseDetail = { loadData: () => loadData() };
    
    return () => {
      // @ts-ignore - For debugging only
      if (window.jdsDebug?.courseDetail) {
        // @ts-ignore - For debugging only
        delete window.jdsDebug.courseDetail;
      }
    };
  }, [loadData]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  const getStatusBadge = (status: string) => {
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
  
  const toggleModuleExpand = (moduleId: string) => {
    setModules(prevModules => 
      prevModules.map(module => 
        module.id === moduleId 
          ? { ...module, isExpanded: !module.isExpanded }
          : module
      )
    );
  };
  
  // Module modal handlers
  const handleOpenCreateModuleModal = () => {
    setEditingModule(null);
    setIsModuleModalOpen(true);
  };
  
  const handleOpenEditModuleModal = (moduleId: string) => {
    setEditingModule(moduleId);
    setIsModuleModalOpen(true);
  };
  
  const handleModuleSaveSuccess = () => {
    setIsModuleModalOpen(false);
    setEditingModule(null);
    
    // Refetch modules and lessons
    if (!courseId) return;
    
    const fetchModulesAndLessons = async () => {
      try {
        // Fetch modules for this course
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('position', { ascending: true });
        
        if (modulesError) throw new Error(`Error fetching modules: ${modulesError.message}`);
        
        if (!modulesData || modulesData.length === 0) {
          setModules([]);
          return;
        }
        
        // Fetch lessons for these modules
        const moduleIds = modulesData.map(module => module.id);
        
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('position', { ascending: true });
        
        if (lessonsError) throw new Error(`Error fetching lessons: ${lessonsError.message}`);
        
        // Group lessons by module and preserve expansion state
        const modulesWithLessons = modulesData.map(module => {
          const moduleLessons = lessonsData?.filter(lesson => lesson.module_id === module.id) || [];
          const existingModule = modules.find(m => m.id === module.id);
          
          return {
            ...module,
            lessons: moduleLessons,
            isExpanded: existingModule ? existingModule.isExpanded : true
          };
        });
        
        setModules(modulesWithLessons);
      } catch (err) {
        logger.error('Error refreshing modules and lessons:', err);
      }
    };
    
    fetchModulesAndLessons();
  };
  
  const handleOpenDeleteModuleDialog = (moduleId: string, moduleTitle: string) => {
    setDeleteModuleId(moduleId);
    setDeleteModuleTitle(moduleTitle);
  };
  
  const handleDeleteModule = async () => {
    if (!deleteModuleId) return;
    
    setDeleteModuleLoading(true);
    
    try {
      // First delete all lessons in this module
      const { error: lessonsError } = await supabase
        .from('lessons')
        .delete()
        .eq('module_id', deleteModuleId);
      
      if (lessonsError) throw new Error(`Error deleting lessons: ${lessonsError.message}`);
      
      // Then delete the module
      const { error: moduleError } = await supabase
        .from('modules')
        .delete()
        .eq('id', deleteModuleId);
      
      if (moduleError) throw new Error(`Error deleting module: ${moduleError.message}`);
      
      // Update state by removing the deleted module
      setModules(prevModules => prevModules.filter(module => module.id !== deleteModuleId));
      
      toast({
        title: "Module deleted",
        description: "The module and its lessons have been deleted successfully.",
        variant: "default",
      });
      
    } catch (err: any) {
      logger.error('Error deleting module:', err);
      toast({
        title: "Error deleting module",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDeleteModuleLoading(false);
      setDeleteModuleId(null);
      setDeleteModuleTitle('');
    }
  };
  
  // Lesson modal handlers
  const handleOpenCreateLessonModal = (moduleId: string) => {
    setEditingLesson(null);
    setSelectedModule(moduleId);
    setIsLessonModalOpen(true);
  };
  
  const handleOpenEditLessonModal = (lessonId: string) => {
    setEditingLesson(lessonId);
    setSelectedModule(null);
    setIsLessonModalOpen(true);
  };
  
  const handleLessonSaveSuccess = () => {
    setIsLessonModalOpen(false);
    setEditingLesson(null);
    setSelectedModule(null);
    
    // Refetch modules and lessons
    handleModuleSaveSuccess();
  };
  
  const handleOpenDeleteLessonDialog = (lessonId: string, lessonTitle: string) => {
    setDeleteLessonId(lessonId);
    setDeleteLessonTitle(lessonTitle);
  };
  
  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    
    setDeleteLessonLoading(true);
    
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', deleteLessonId);
      
      if (error) throw new Error(`Error deleting lesson: ${error.message}`);
      
      // Update state by removing the deleted lesson
      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          lessons: module.lessons?.filter(lesson => lesson.id !== deleteLessonId) || []
        }))
      );
      
      toast({
        title: "Lesson deleted",
        description: "The lesson has been deleted successfully.",
        variant: "default",
      });
      
    } catch (err: any) {
      logger.error('Error deleting lesson:', err);
      toast({
        title: "Error deleting lesson",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDeleteLessonLoading(false);
      setDeleteLessonId(null);
      setDeleteLessonTitle('');
    }
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = async (result: any) => {
    const { source, destination, type } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // No change in position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    if (type === 'MODULE') {
      // Reordering modules
      const newModules = Array.from(modules);
      const [movedModule] = newModules.splice(source.index, 1);
      newModules.splice(destination.index, 0, movedModule);
      
      // Update positions
      const updatedModules = newModules.map((module, index) => ({
        ...module,
        position: index + 1
      }));
      
      setModules(updatedModules);
      
      // Update positions in the database
      try {
        for (const module of updatedModules) {
          await supabase
            .from('modules')
            .update({ position: module.position })
            .eq('id', module.id);
        }
      } catch (err) {
        logger.error('Error updating module positions:', err);
        alert('Failed to update module positions. Please refresh and try again.');
      }
    } else if (type === 'LESSON') {
      // Find the source and destination module IDs
      const sourceModuleId = source.droppableId;
      const destModuleId = destination.droppableId;
      
      // Copy current modules
      const newModules = Array.from(modules);
      
      // Find the source module
      const sourceModule = newModules.find(m => m.id === sourceModuleId);
      if (!sourceModule || !sourceModule.lessons) return;
      
      // Copy the lessons from source module
      const sourceLessons = Array.from(sourceModule.lessons);
      
      // Remove the moved lesson from source
      const [movedLesson] = sourceLessons.splice(source.index, 1);
      
      if (sourceModuleId === destModuleId) {
        // Moving within the same module
        sourceLessons.splice(destination.index, 0, movedLesson);
        
        // Update positions
        const updatedLessons = sourceLessons.map((lesson, index) => ({
          ...lesson,
          position: index + 1
        }));
        
        // Update the source module's lessons
        sourceModule.lessons = updatedLessons;
        
        // Update state
        setModules(newModules);
        
        // Update positions in the database
        try {
          for (const lesson of updatedLessons) {
            await supabase
              .from('lessons')
              .update({ position: lesson.position })
              .eq('id', lesson.id);
          }
        } catch (err) {
          logger.error('Error updating lesson positions:', err);
          alert('Failed to update lesson positions. Please refresh and try again.');
        }
      } else {
        // Moving between different modules
        // Find the destination module
        const destModule = newModules.find(m => m.id === destModuleId);
        if (!destModule || !destModule.lessons) return;
        
        // Update the module_id of the moved lesson
        movedLesson.module_id = destModuleId;
        
        // Copy lessons from destination module
        const destLessons = Array.from(destModule.lessons);
        
        // Add the moved lesson to destination
        destLessons.splice(destination.index, 0, movedLesson);
        
        // Update positions in both modules
        const updatedSourceLessons = sourceLessons.map((lesson, index) => ({
          ...lesson,
          position: index + 1
        }));
        
        const updatedDestLessons = destLessons.map((lesson, index) => ({
          ...lesson,
          position: index + 1
        }));
        
        // Update both modules' lessons
        sourceModule.lessons = updatedSourceLessons;
        destModule.lessons = updatedDestLessons;
        
        // Update state
        setModules(newModules);
        
        // Update in database
        try {
          // Update moved lesson's module_id and position
          await supabase
            .from('lessons')
            .update({ 
              module_id: destModuleId,
              position: updatedDestLessons.find(l => l.id === movedLesson.id)?.position 
            })
            .eq('id', movedLesson.id);
          
          // Update positions of source lessons
          for (const lesson of updatedSourceLessons) {
            await supabase
              .from('lessons')
              .update({ position: lesson.position })
              .eq('id', lesson.id);
          }
          
          // Update positions of destination lessons
          for (const lesson of updatedDestLessons) {
            if (lesson.id !== movedLesson.id) {
              await supabase
                .from('lessons')
                .update({ position: lesson.position })
                .eq('id', lesson.id);
            }
          }
        } catch (err) {
          logger.error('Error updating lessons:', err);
          alert('Failed to update lessons. Please refresh and try again.');
        }
      }
    }
  };

  // Inline module creation and editing functions
  const handleAddModuleInline = () => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`;
    
    // Create new empty module with temporary ID
    const newModule: Module = {
      id: tempId,
      tempId: tempId,
      title: "",
      course_id: courseId!,
      position: modules.length > 0 ? Math.max(...modules.map(m => m.position)) + 1 : 1,
      created_at: new Date().toISOString(),
      lessons: [],
      isExpanded: true,
      isNew: true
    };
    
    // Add it to modules array
    setModules([...modules, newModule]);
    
    // Set it as the one being edited
    setInlineEditingModuleId(tempId);
    
    // Focus input on next render
    setTimeout(() => {
      if (newModuleInputRef.current) {
        newModuleInputRef.current.focus();
      }
    }, 0);
  };

  const handleSaveModuleInline = async (moduleId: string, title: string) => {
    if (!title.trim() || !courseId) return;
    
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;
    
    const isNew = modules[moduleIndex].isNew;
    
    try {
      if (isNew) {
        // This is a new module, insert it
        const { data, error } = await supabase
          .from('modules')
          .insert({
            title: title.trim(),
            course_id: courseId,
            position: modules[moduleIndex].position,
          })
          .select('*')
          .single();
          
        if (error) throw error;
        
        // Update modules array with real ID from database
        setModules(prevModules => 
          prevModules.map(m => 
            m.id === moduleId
              ? {
                  ...data,
                  lessons: [],
                  isExpanded: true
                }
              : m
          )
        );
        
        toast({
          title: "Module created",
          description: "Module added successfully.",
        });
      } else {
        // This is an existing module, update it
        const { error } = await supabase
          .from('modules')
          .update({ title: title.trim() })
          .eq('id', moduleId);
          
        if (error) throw error;
        
        // Update modules array
        setModules(prevModules => 
          prevModules.map(m => 
            m.id === moduleId
              ? {
                  ...m,
                  title: title.trim()
                }
              : m
          )
        );
        
        toast({
          title: "Module updated",
          description: "Module title updated successfully.",
        });
      }
    } catch (error: any) {
      logger.error('Error saving module:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save module. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear editing state
      setInlineEditingModuleId(null);
    }
  };

  const handleCancelModuleInline = (moduleId: string) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;
    
    if (modules[moduleIndex].isNew) {
      // Remove the module if it was new and not saved
      setModules(prevModules => prevModules.filter(m => m.id !== moduleId));
    }
    
    // Clear editing state
    setInlineEditingModuleId(null);
  };

  // Inline lesson creation and editing functions
  const handleAddLessonInline = (moduleId: string) => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`;
    
    // Create new empty lesson with temporary ID
    const newLesson: Lesson = {
      id: tempId,
      tempId: tempId,
      title: "",
      module_id: moduleId,
      status: "Draft",
      position: 0, // Will be calculated properly when saved
      created_at: new Date().toISOString(),
      isNew: true
    };
    
    // Find module index
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;
    
    // Calculate correct position
    newLesson.position = modules[moduleIndex].lessons?.length || 0;
    
    // Add the lesson to its module
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = [...(updatedModules[moduleIndex].lessons || []), newLesson];
    setModules(updatedModules);
    
    // Set it as the one being edited
    setInlineEditingLessonId(tempId);
    
    // Focus input on next render
    setTimeout(() => {
      if (newLessonInputRefs.current[tempId]) {
        newLessonInputRefs.current[tempId]?.focus();
      }
    }, 0);
  };

  const handleSaveLessonInline = async (lessonId: string, title: string) => {
    if (!title.trim()) return;
    
    // Find the lesson
    let moduleIndex = -1;
    let lessonIndex = -1;
    
    modules.forEach((module, mIdx) => {
      const lIdx = module.lessons?.findIndex(l => l.id === lessonId);
      if (lIdx !== undefined && lIdx !== -1) {
        moduleIndex = mIdx;
        lessonIndex = lIdx;
      }
    });
    
    logger.debug('Saving lesson:', { lessonId, title, moduleIndex, lessonIndex });
    
    if (moduleIndex === -1 || lessonIndex === -1) {
      logger.error('Could not find lesson to save', { lessonId, moduleIndex, lessonIndex });
      return;
    }
    
    const module = modules[moduleIndex];
    const lesson = module.lessons![lessonIndex];
    const isNew = lesson.isNew;
    
    try {
      if (isNew) {
        // This is a new lesson, insert it
        logger.debug('Creating new lesson:', { 
          title: title.trim(), 
          module_id: module.id, 
          position: lesson.position 
        });
        
        const { data, error } = await supabase
          .from('lessons')
          .insert({
            title: title.trim(),
            module_id: module.id,
            position: lesson.position,
            status: 'Draft',
            content: '', // Initial empty content
          })
          .select('*')
          .single();
          
        if (error) throw error;
        
        logger.debug('Lesson created successfully:', data);
        
        // Update modules array with real ID from database
        const updatedModules = [...modules];
        updatedModules[moduleIndex].lessons![lessonIndex] = data;
        setModules(updatedModules);
        
        toast({
          title: "Lesson created",
          description: "Lesson added successfully.",
        });
      } else {
        // This is an existing lesson, update it
        const { error } = await supabase
          .from('lessons')
          .update({ title: title.trim() })
          .eq('id', lessonId);
          
        if (error) throw error;
        
        // Update modules array
        const updatedModules = [...modules];
        updatedModules[moduleIndex].lessons![lessonIndex].title = title.trim();
        setModules(updatedModules);
        
        toast({
          title: "Lesson updated",
          description: "Lesson title updated successfully.",
        });
      }
    } catch (error: any) {
      logger.error('Error saving lesson:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear editing state
      setInlineEditingLessonId(null);
    }
  };

  const handleCancelLessonInline = (lessonId: string) => {
    // Find the lesson
    let moduleIndex = -1;
    let lessonIndex = -1;
    
    modules.forEach((module, mIdx) => {
      const lIdx = module.lessons?.findIndex(l => l.id === lessonId);
      if (lIdx !== undefined && lIdx !== -1) {
        moduleIndex = mIdx;
        lessonIndex = lIdx;
      }
    });
    
    if (moduleIndex === -1 || lessonIndex === -1) {
      logger.error('Could not find lesson to cancel', { lessonId });
      setInlineEditingLessonId(null);
      return;
    }
    
    const lesson = modules[moduleIndex].lessons![lessonIndex];
    
    if (lesson.isNew) {
      // Remove the lesson if it was new and not saved
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons!.filter(l => l.id !== lessonId);
      setModules(updatedModules);
    }
    
    // Clear editing state
    setInlineEditingLessonId(null);
  };

  // Handle course update
  const handleUpdateCourse = async (course) => {
    try {
      setUpdateLoading(true);
      
      // Update the course
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          title: course.title,
          status: course.status,
          tile_description: course.tile_description,
          overview: course.overview,
          what_youll_learn: course.what_youll_learn,
          days_of_access: course.days_of_access,
          is_featured: course.is_featured
        })
        .eq('id', courseId);
      
      if (updateError) throw updateError;
      
      // Handle subject associations
      // First, delete existing associations
      const { error: deleteError } = await supabase
        .from('course_subjects')
        .delete()
        .eq('course_id', courseId);
      
      if (deleteError) throw deleteError;
      
      // Then, create new associations
      if (selectedSubjectIds.length > 0) {
        const courseSubjects = selectedSubjectIds.map(subjectId => ({
          course_id: courseId,
          subject_id: subjectId
        }));
        
        const { error: insertError } = await supabase
          .from('course_subjects')
          .insert(courseSubjects);
        
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Course Saved",
        description: "Your changes have been saved successfully",
      });
      
      // Reload data to reflect changes
      loadData();
      setIsCourseModalOpen(false);
    } catch (error) {
      logger.error('Error updating course:', error);
      toast({
        title: "Error",
        description: `Failed to update course: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleOpenEditCourse = () => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  // Add this effect to fetch subjects and course-subject relationships
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .order('name');
        
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
        
        // If we have a course ID, fetch its associated subjects
        if (courseId) {
          const { data: courseSubjects, error: courseSubjectsError } = await supabase
            .from('course_subjects')
            .select('subject_id')
            .eq('course_id', courseId);
          
          if (courseSubjectsError) throw courseSubjectsError;
          
          if (courseSubjects && courseSubjects.length > 0) {
            setSelectedSubjectIds(courseSubjects.map(cs => cs.subject_id));
          }
        }
      } catch (error) {
        logger.error('Error fetching subjects:', error);
      }
    };
    
    fetchSubjects();
  }, [courseId]);

  if (loading.course) {
    return (
      <AdminLayout title="Loading Course...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="h-8 w-8 mr-2" />
          <span>Loading course details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error.course) {
    return (
      <AdminLayout title="Error">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Error Loading Course</h2>
          <p>{error.course}</p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/admin/courses')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Return to Courses
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout title="Course Not Found">
        <div className="bg-amber-50 text-amber-600 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Course Not Found</h2>
          <p>The requested course could not be found.</p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/admin/courses')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Return to Courses
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={
        <div className="flex items-center gap-2">
          <span>{course?.title || 'Course Detail'}</span>
          {getStatusBadge(course.status)}
          {course.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
          {reloading && <LoadingSpinner className="h-4 w-4 ml-2" />}
        </div>
      }
      className="overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px] overflow-y-auto">
            {course.overview ? (
              <p className="whitespace-pre-wrap">{course.overview}</p>
            ) : (
              <p className="text-muted-foreground italic">No overview available</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>What You'll Learn</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px] overflow-y-auto">
            {course.what_youll_learn && course.what_youll_learn.length > 0 ? (
              <ul className="list-disc list-inside pl-2 space-y-1">
                {Array.isArray(course.what_youll_learn) ? (
                  course.what_youll_learn.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))
                ) : (
                  <li>{course.what_youll_learn}</li>
                )}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No learning objectives listed</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>
              Information about course content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p>{formatDate(course.created_at)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Updated</h3>
                <p>{course.updated_at ? formatDate(course.updated_at) : 'Never'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Modules</h3>
                <p>{modules.length}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Lessons</h3>
                <p>{modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Access Period</h3>
                <p>{course.days_of_access || 365} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Layers className="h-5 w-5 mr-2 text-orange-500" />
            Course Content
          </h2>
          <div className="flex gap-2">
            <Button 
              onClick={handleOpenEditCourse}
              className="gap-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <PenSquare className="h-4 w-4" />
              Edit Course
            </Button>
            <Button 
              onClick={handleAddModuleInline}
              className="gap-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Module
            </Button>
            <Button 
              onClick={loadData}
              variant="outline"
              disabled={reloading}
              title="Refresh course data"
            >
              {reloading ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {loading.modules ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner className="h-8 w-8 mr-2" />
            <span>Loading course content...</span>
          </div>
        ) : error.modules ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            <h3 className="font-semibold mb-1">Error Loading Content</h3>
            <p>{error.modules}</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-muted p-8 text-center rounded-lg">
            <h3 className="text-lg font-medium mb-2">No modules found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first module for this course.</p>
            <Button 
              onClick={handleAddModuleInline}
              className="gap-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Module
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="modules" type="MODULE">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {modules.map((module, moduleIndex) => (
                    <Draggable
                      key={module.id}
                      draggableId={`module-${module.id}`}
                      index={moduleIndex}
                      isDragDisabled={inlineEditingModuleId === module.id || inlineEditingLessonId !== null}
                    >
                      {(provided) => (
                        <div
                          className="mb-6 border border-border rounded-lg shadow-sm"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div
                            className="p-4 bg-muted/30 rounded-t-lg flex justify-between items-center"
                            onClick={inlineEditingModuleId !== module.id ? () => toggleModuleExpand(module.id) : undefined}
                          >
                            {inlineEditingModuleId === module.id ? (
                              // Inline editing mode for module title
                              <div className="flex-1 flex items-center">
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <DragHandle className="h-5 w-5 mr-2 text-muted-foreground" />
                                </div>
                                <Input
                                  ref={newModuleInputRef}
                                  className="text-lg font-semibold"
                                  value={module.title}
                                  onChange={(e) => {
                                    setModules(prevModules => 
                                      prevModules.map(m => 
                                        m.id === module.id
                                          ? { ...m, title: e.target.value }
                                          : m
                                      )
                                    );
                                  }}
                                  placeholder="Module name"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveModuleInline(module.id, module.title);
                                    } else if (e.key === 'Escape') {
                                      handleCancelModuleInline(module.id);
                                    }
                                  }}
                                  autoFocus
                                />
                                <div className="flex ml-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSaveModuleInline(module.id, module.title)}
                                    disabled={!module.title.trim()}
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleCancelModuleInline(module.id)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Normal display mode
                              <div className="flex items-center cursor-pointer">
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <DragHandle className="h-5 w-5 mr-2 text-muted-foreground" />
                                </div>
                                <h3 
                                  className="text-lg font-semibold hover:text-orange-500 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent expanding/collapsing
                                    setInlineEditingModuleId(module.id);
                                    setTimeout(() => {
                                      if (newModuleInputRef.current) {
                                        newModuleInputRef.current.focus();
                                      }
                                    }, 0);
                                  }}
                                  title="Click to edit module title"
                                >
                                  {module.title}
                                </h3>
                                {module.lessons && module.lessons.length > 0 && (
                                  <Badge variant="outline" className="ml-2">
                                    {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {inlineEditingModuleId !== module.id && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // If module is not expanded, expand it
                                    if (!module.isExpanded) {
                                      toggleModuleExpand(module.id);
                                    }
                                    // Add a small delay to ensure the module expands first
                                    setTimeout(() => {
                                      handleAddLessonInline(module.id);
                                    }, 50);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Lesson</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInlineEditingModuleId(module.id);
                                    setTimeout(() => {
                                      if (newModuleInputRef.current) {
                                        newModuleInputRef.current.focus();
                                      }
                                    }, 0);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDeleteModuleDialog(module.id, module.title);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleModuleExpand(module.id);
                                  }}
                                >
                                  {module.isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>

                          {module.isExpanded && (
                            <div className="p-4">
                              {(!module.lessons || module.lessons.length === 0) && !inlineEditingLessonId ? (
                                <div className="text-center p-4">
                                  <p className="text-muted-foreground text-sm mb-4">
                                    No lessons in this module yet.
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddLessonInline(module.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Lesson
                                  </Button>
                                </div>
                              ) : (
                                <Droppable
                                  droppableId={module.id}
                                  type="LESSON"
                                >
                                  {(provided) => (
                                    <div
                                      className="space-y-2"
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                    >
                                      {module.lessons && module.lessons.map((lesson, lessonIndex) => (
                                        <Draggable
                                          key={lesson.id}
                                          draggableId={`lesson-${lesson.id}`}
                                          index={lessonIndex}
                                          isDragDisabled={inlineEditingLessonId === lesson.id || inlineEditingModuleId !== null}
                                        >
                                          {(provided) => (
                                            <div
                                              className="p-3 bg-background border border-border rounded-md flex justify-between items-center"
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                            >
                                              {inlineEditingLessonId === lesson.id ? (
                                                // Inline editing mode for lesson title
                                                <div className="flex-1 flex items-center">
                                                  <div {...provided.dragHandleProps} className="cursor-grab">
                                                    <DragHandle className="h-4 w-4 mr-2 text-muted-foreground" />
                                                  </div>
                                                  <Input
                                                    ref={(el) => newLessonInputRefs.current[lesson.id] = el}
                                                    className="font-medium"
                                                    value={lesson.title}
                                                    onChange={(e) => {
                                                      const updatedModules = [...modules];
                                                      updatedModules[moduleIndex].lessons![lessonIndex].title = e.target.value;
                                                      setModules(updatedModules);
                                                    }}
                                                    placeholder="Lesson name"
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        handleSaveLessonInline(lesson.id, lesson.title);
                                                      } else if (e.key === 'Escape') {
                                                        handleCancelLessonInline(lesson.id);
                                                      }
                                                    }}
                                                    autoFocus
                                                  />
                                                  <div className="flex ml-2">
                                                    <Button 
                                                      size="sm" 
                                                      onClick={() => handleSaveLessonInline(lesson.id, lesson.title)}
                                                      disabled={!lesson.title.trim()}
                                                    >
                                                      Save
                                                    </Button>
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      onClick={() => handleCancelLessonInline(lesson.id)}
                                                    >
                                                      Cancel
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                // Normal display mode
                                                <>
                                                  <div className="flex items-center">
                                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                                      <DragHandle className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                      <p 
                                                        className="font-medium hover:text-orange-500 transition-colors duration-200 cursor-pointer"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setInlineEditingLessonId(lesson.id);
                                                          setTimeout(() => {
                                                            if (newLessonInputRefs.current[lesson.id]) {
                                                              newLessonInputRefs.current[lesson.id]?.focus();
                                                            }
                                                          }, 0);
                                                        }}
                                                        title="Click to edit lesson title"
                                                      >
                                                        {lesson.title}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {lesson.status} · {formatDate(lesson.created_at)}
                                                      </p>
                                                      {lesson.video_id && (
                                                        <div className="relative mt-2 bg-gray-100 rounded overflow-hidden" style={{ maxWidth: "150px", height: "80px" }}>
                                                          <div className="absolute inset-0 flex items-center justify-center z-10">
                                                            <Button
                                                              size="sm"
                                                              variant="secondary"
                                                              className="bg-black/30 text-white hover:bg-black/50"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditLessonModal(lesson.id);
                                                              }}
                                                            >
                                                              View Video
                                                            </Button>
                                                          </div>
                                                          <img 
                                                            src={`https://video.gumlet.io/${import.meta.env.VITE_GUMLET_ACCOUNT_ID}/${lesson.video_id}/thumbnail-1-0.png`}
                                                            alt="Video thumbnail"
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                          />
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEditLessonModal(lesson.id);
                                                      }}
                                                      title="Edit lesson details"
                                                    >
                                                      <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenDeleteLessonDialog(lesson.id, lesson.title);
                                                      }}
                                                    >
                                                      <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                      
                                      {/* "Add Lesson" button at the end of list */}
                                      {!inlineEditingLessonId && (
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="w-full mt-2 border-dashed"
                                          onClick={() => handleAddLessonInline(module.id)}
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Lesson
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </Droppable>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {/* "Add Module" button at the end of the list */}
                  {!inlineEditingModuleId && !inlineEditingLessonId && (
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed"
                      onClick={handleAddModuleInline}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Module
                    </Button>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      
      {/* Module Sheet - for detailed editing */}
      <Sheet open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
        <SheetContent className="sm:max-w-md md:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>{editingModule ? 'Edit Module' : 'Create Module'}</SheetTitle>
            <SheetDescription>
              {editingModule ? 'Update the module details below' : 'Create a new module for this course'}
            </SheetDescription>
          </SheetHeader>
          <CreateModule
            editMode={!!editingModule}
            moduleId={editingModule}
            courseId={courseId}
            onClose={() => setIsModuleModalOpen(false)}
            onSuccess={handleModuleSaveSuccess}
          />
        </SheetContent>
      </Sheet>
      
      {/* Lesson Sheet */}
      <Sheet open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
        <SheetContent className="sm:max-w-md md:max-w-xl overflow-y-auto" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>{editingLesson ? 'Edit Lesson' : 'Create Lesson'}</SheetTitle>
            <SheetDescription>
              {editingLesson ? 'Update the lesson details below' : 'Create a new lesson for this module'}
            </SheetDescription>
          </SheetHeader>
          <CreateLesson
            editMode={!!editingLesson}
            lessonId={editingLesson}
            moduleId={selectedModule}
            onClose={() => setIsLessonModalOpen(false)}
            onSuccess={handleLessonSaveSuccess}
          />
        </SheetContent>
      </Sheet>
      
      {/* Delete Module Dialog */}
      <AlertDialog open={!!deleteModuleId} onOpenChange={(open) => !open && setDeleteModuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the module "{deleteModuleTitle}"? This will also delete all lessons within it.
              <br /><br />
              <span className="font-semibold text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteModule}
              disabled={deleteModuleLoading}
            >
              {deleteModuleLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete Module"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Lesson Dialog */}
      <AlertDialog open={!!deleteLessonId} onOpenChange={(open) => !open && setDeleteLessonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the lesson "{deleteLessonTitle}"?
              <br /><br />
              <span className="font-semibold text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteLesson}
              disabled={deleteLessonLoading}
            >
              {deleteLessonLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete Lesson"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Course Edit Sheet */}
      <Sheet open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
        <SheetContent className="sm:max-w-md md:max-w-xl overflow-y-auto" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Edit Course</SheetTitle>
            <SheetDescription>
              Update the course details and settings
            </SheetDescription>
          </SheetHeader>
          {editingCourse && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateCourse(editingCourse);
            }} className="space-y-6">
              {/* Title and Status on the same line */}
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Course Title
                  </label>
                  <Input
                    id="title"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                    placeholder="Course title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={editingCourse.status}
                    onValueChange={(value) => setEditingCourse({...editingCourse, status: value})}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                      <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="tile_description" className="text-sm font-medium">
                  Tile Description
                </label>
                <Textarea
                  id="tile_description"
                  value={editingCourse.tile_description || ''}
                  onChange={(e) => setEditingCourse({...editingCourse, tile_description: e.target.value})}
                  placeholder="Short description for course tile"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="overview" className="text-sm font-medium">
                  Overview
                </label>
                <Textarea
                  id="overview"
                  value={editingCourse.overview || ''}
                  onChange={(e) => setEditingCourse({...editingCourse, overview: e.target.value})}
                  placeholder="Course overview"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What You'll Learn (one item per line)
                </label>
                <Textarea
                  value={Array.isArray(editingCourse.what_youll_learn) 
                    ? editingCourse.what_youll_learn.join('\n') 
                    : editingCourse.what_youll_learn || ''
                  }
                  onChange={(e) => {
                    const items = e.target.value.split('\n').filter(item => item.trim() !== '');
                    setEditingCourse({...editingCourse, what_youll_learn: items});
                  }}
                  placeholder="Enter learning objectives, one per line"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subjects</label>
                <select
                  id="subject"
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !selectedSubjectIds.includes(e.target.value)) {
                      setSelectedSubjectIds([...selectedSubjectIds, e.target.value]);
                    }
                  }}
                  className="w-full h-10 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select subjects...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {selectedSubjectIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSubjectIds.map(id => {
                      const subject = subjects.find(s => s.id === id);
                      return (
                        <div key={id} className="bg-accent px-3 py-1 rounded-md flex items-center">
                          <span className="text-sm">{subject?.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedSubjectIds(selectedSubjectIds.filter(subId => subId !== id))}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {subject?.name}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Select one or more subjects for this course.
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="days_of_access" className="text-sm font-medium">
                  Days of Access
                </label>
                <Input
                  id="days_of_access"
                  type="number"
                  min="1"
                  value={editingCourse.days_of_access || 365}
                  onChange={(e) => setEditingCourse({...editingCourse, days_of_access: parseInt(e.target.value)})}
                  placeholder="Days of access"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_featured" 
                    checked={editingCourse.is_featured || false}
                    onCheckedChange={(checked) => 
                      setEditingCourse({...editingCourse, is_featured: checked === true})
                    }
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">
                    Featured Course
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCourseModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}; 