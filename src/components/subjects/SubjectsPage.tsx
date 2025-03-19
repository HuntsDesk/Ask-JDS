import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import SubjectCard from './SubjectCard';
import SearchBar from '../flashcards/SearchBar';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('flashcard_subjects')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching subjects:', error);
          return;
        }

        setSubjects(data || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Subjects</h1>
        <div className="w-full sm:w-auto max-w-md">
          <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Search subjects..." />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {filteredSubjects.map(subject => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      ) : searchTerm ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No subjects found matching "{searchTerm}"</p>
          <button 
            onClick={() => setSearchTerm('')}
            className="text-sm text-[#F37022] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">No subjects have been created yet.</p>
          <button 
            onClick={() => navigate('/flashcards/create-subject')}
            className="px-4 py-2 bg-[#F37022] text-white rounded-md hover:bg-[#E36012] transition-colors"
          >
            Create your first subject
          </button>
        </div>
      )}
    </div>
  );
} 