import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CourseCard from '../CourseCard';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  duration: string;
  lessons: number;
  level: string;
  featured: boolean;
}

const featuredCourses = [
  {
    id: '1',
    title: 'Constitutional Law Fundamentals',
    description: 'Master the essential principles and landmark cases of Constitutional Law with a strategic framework.',
    price: 299,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    duration: '24 Lessons',
    lessons: 24,
    level: 'Intermediate',
    featured: true
  },
  {
    id: '2',
    title: 'Evidence Law Made Simple',
    description: 'Break down complex evidence rules into simple, applicable frameworks that will help you excel on exams.',
    price: 249,
    originalPrice: 349,
    image: 'https://images.unsplash.com/photo-1423592707957-3b212afa6733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    duration: '18 Lessons',
    lessons: 18,
    level: 'Beginner',
    featured: false
  },
  {
    id: '3',
    title: 'Criminal Law: Essential Concepts',
    description: 'Understand criminal law concepts through a strategic approach that simplifies complex theories.',
    price: 279,
    originalPrice: 349,
    image: 'https://images.unsplash.com/photo-1593115057322-e94b77572f20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
    duration: '21 Lessons',
    lessons: 21,
    level: 'Intermediate',
    featured: false
  }
];

const FeaturedCoursesSection = () => {
  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h5 className="inline-block bg-jdblue/10 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
              FEATURED COURSES
            </h5>
            <h2 className="text-3xl md:text-4xl font-bold">
              JD Simplified Courses
            </h2>
          </div>
          <Link to="/courses" className="inline-flex items-center text-jdorange font-medium mt-4 md:mt-0 group">
            View All Courses 
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCourses.map((course) => (
            <div className="light" key={course.id}>
              <CourseCard {...course} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCoursesSection;
