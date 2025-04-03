
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { getCourseById, createCourse, updateCourse } from '@/services/courseService';
import { courseFormSchema, CourseFormValues } from './types';

export const useCourseForm = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!courseId;
  
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      overview: '',
      price: 0,
      originalPrice: undefined,
      image: '',
      duration: '',
      lessons: 0,
      level: 'Beginner',
      isFeatured: false,
      category: '',
      daysOfAccess: 30,
      status: 'Draft',
      instructorName: '',
      instructorTitle: '',
      instructorImage: '',
      instructorBio: '',
    },
  });

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      setIsLoading(true);
      try {
        const course = await getCourseById(courseId);
        if (course) {
          form.reset({
            title: course.title,
            description: course.description,
            overview: course.overview || '',
            price: course.price,
            originalPrice: course.originalPrice,
            image: course.image,
            duration: course.duration,
            lessons: course.lessons,
            level: course.level,
            isFeatured: course.isFeatured,
            category: course.category,
            daysOfAccess: course.daysOfAccess || 30,
            status: course.status,
            instructorName: course.instructor.name,
            instructorTitle: course.instructor.title,
            instructorImage: course.instructor.image,
            instructorBio: course.instructor.bio,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load course data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId, form]);

  const onSubmit = async (values: CourseFormValues) => {
    setIsLoading(true);
    try {
      const courseData = {
        title: values.title,
        description: values.description,
        overview: values.overview,
        price: values.price,
        originalPrice: values.originalPrice,
        image: values.image,
        duration: values.duration,
        lessons: values.lessons,
        level: values.level,
        isFeatured: values.isFeatured,
        category: values.category,
        daysOfAccess: values.daysOfAccess,
        status: values.status,
        instructor: {
          name: values.instructorName,
          title: values.instructorTitle,
          image: values.instructorImage,
          bio: values.instructorBio,
        },
        rating: 0,
        reviewCount: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        objectives: [],
      };
      
      if (isEditing && courseId) {
        await updateCourse(courseId, courseData);
        toast({
          title: 'Course updated',
          description: 'The course has been updated successfully.',
        });
      } else {
        const newCourse = await createCourse(courseData);
        toast({
          title: 'Course created',
          description: 'The course has been created successfully.',
        });
        navigate(`/admin/courses/${newCourse.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} course.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    isEditing,
    onSubmit,
  };
};
