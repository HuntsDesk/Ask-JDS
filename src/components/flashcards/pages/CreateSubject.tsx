import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import useToast from '@/hooks/useFlashcardToast';
import Toast from '../Toast';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateSubject() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define subject query keys
  const subjectKeys = {
    all: ['subjects'] as const,
  };

  const validateForm = () => {
    if (!name.trim()) return 'Please enter a subject name';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    
    try {
      setSaving(true);
      
      // Create the subject
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .insert([{ 
          name, 
          description,
          is_official: false
        }])
        .select()
        .single();
      
      if (subjectError) throw subjectError;
      
      // Invalidate subjects queries to force a refetch
      queryClient.invalidateQueries({ queryKey: subjectKeys.all });
      
      showToast('Subject created successfully!', 'success');
      navigate('/flashcards/subjects');
      
    } catch (err) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      {error && <ErrorMessage message={error} />}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Subject</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject Name*
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022] dark:bg-gray-700 dark:text-white"
              placeholder="Environmental Law, Criminal Law, etc"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022] dark:bg-gray-700 dark:text-white"
              placeholder="Optional description of this subject"
              rows={3}
            />
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center bg-[#F37022] text-white px-6 py-2 rounded-md hover:bg-[#E36012] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F37022] dark:focus:ring-offset-gray-800"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Create Subject
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 