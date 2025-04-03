
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getCourses, deleteCourse } from '@/services/courseService';
import { Course } from '@/types/course';
import CourseFilters from '@/components/admin/CourseFilters';
import CoursesTable from '@/components/admin/CoursesTable';

const AdminCourses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Course>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<Course['status'] | 'all'>('all');
  
  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses
  });
  
  const handleSort = (field: keyof Course) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId) 
        : [...prev, courseId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map(course => course.id));
    }
  };
  
  const handleDelete = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await deleteCourse(courseId);
        toast({
          title: 'Course deleted successfully',
          variant: 'default'
        });
        refetch();
      } catch (error) {
        toast({
          title: 'Failed to delete course',
          description: 'Please try again later',
          variant: 'destructive'
        });
      }
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCourses.length} courses? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedCourses.map(id => deleteCourse(id)));
        toast({
          title: `${selectedCourses.length} courses deleted successfully`,
          variant: 'default'
        });
        setSelectedCourses([]);
        refetch();
      } catch (error) {
        toast({
          title: 'Failed to delete courses',
          description: 'Please try again later',
          variant: 'destructive'
        });
      }
    }
  };
  
  // Filter and sort courses
  const filteredCourses = courses
    .filter(course => 
      (filterStatus === 'all' || course.status === filterStatus) &&
      (
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' 
          ? fieldA - fieldB 
          : fieldB - fieldA;
      } else {
        return 0;
      }
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link 
          to="/admin/courses/new"
          className="bg-jdblue text-white px-4 py-2 rounded-lg flex items-center hover:bg-jdblue-light transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Course
        </Link>
      </div>
      
      <CourseFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={(status) => setFilterStatus(status)}
        selectedCourses={selectedCourses}
        onBulkDelete={handleBulkDelete}
      />
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <CoursesTable
          isLoading={isLoading}
          filteredCourses={filteredCourses}
          searchTerm={searchTerm}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectedCourses={selectedCourses}
          onSelectCourse={handleSelectCourse}
          onSelectAll={handleSelectAll}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default AdminCourses;
