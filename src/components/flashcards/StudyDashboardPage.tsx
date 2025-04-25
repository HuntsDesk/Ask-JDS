import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FolderOpen, Tag, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from './LoadingSpinner';

const StudyDashboardPage = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch collections
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('*');
          
        if (collectionsError) throw collectionsError;
        
        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*');
          
        if (subjectsError) throw subjectsError;
        
        setCollections(collectionsData || []);
        setSubjects(subjectsData || []);
      } catch (error) {
        console.error('Error fetching study data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Study Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Unified Study Mode */}
        <Link 
          to="/flashcards/unified-study" 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <BookOpen className="h-6 w-6 text-[#F37022] mr-3" />
            <h2 className="text-xl font-semibold">All Flashcards</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Study all available flashcards with customizable filters.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {collections.length} collections • {subjects.length} subjects
          </div>
        </Link>

        {/* Study By Subject */}
        <Link 
          to="/flashcards/subjects" 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <Tag className="h-6 w-6 text-[#3B82F6] mr-3" />
            <h2 className="text-xl font-semibold">Study by Subject</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Browse and study flashcards organized by legal subject area.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {subjects.length} subjects available
          </div>
        </Link>

        {/* Study By Collection */}
        <Link 
          to="/flashcards/collections" 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <FolderOpen className="h-6 w-6 text-[#10B981] mr-3" />
            <h2 className="text-xl font-semibold">Study by Collection</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Study flashcards grouped into curated collections.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {collections.length} collections available
          </div>
        </Link>

        {/* Create Your Own Cards */}
        <Link 
          to="/flashcards/create-flashcard" 
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-[#EC4899] mr-3" />
            <h2 className="text-xl font-semibold">Create Your Own</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create and study your own custom flashcards.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {user ? 'Sign in to create cards' : 'Personalize your learning'}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudyDashboardPage; 