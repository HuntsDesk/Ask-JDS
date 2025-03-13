import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, PlusCircle, ChevronLeft, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DeleteConfirmation from '../DeleteConfirmation';
import Toast from '../Toast';
import useToast from '@/hooks/useFlashcardToast';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

interface Collection {
  id: string;
  title: string;
  description: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function EditCollection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [originalCollection, setOriginalCollection] = useState<Collection | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [originalSelectedSubjects, setOriginalSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Load collection details
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .select('*')
          .eq('id', id)
          .single();

        if (collectionError) throw collectionError;
        
        // Get the subjects for this collection from the junction table
        const { data: subjectJunctions, error: junctionError } = await supabase
          .from('collection_subjects')
          .select('subject_id')
          .eq('collection_id', id);
          
        if (junctionError) throw junctionError;
        
        // Extract subject IDs
        const subjectIds = subjectJunctions?.map(junction => junction.subject_id) || [];
        
        setCollection(collectionData);
        setOriginalCollection(JSON.parse(JSON.stringify(collectionData))); // Deep copy
        setSelectedSubjects(subjectIds);
        setOriginalSelectedSubjects([...subjectIds]);

        // Load all subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .order('name');

        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);

        // Get card count - using junction table for flashcard-collection relationship
        const { count, error: countError } = await supabase
          .from('flashcard_collections_junction')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', id);

        if (countError) throw countError;
        setCardCount(count || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Check for unsaved changes
  useEffect(() => {
    if (collection && originalCollection) {
      const hasCollectionChanges = 
        collection.title !== originalCollection.title ||
        collection.description !== originalCollection.description;
      
      // Check if the selected subjects have changed
      const hasSubjectChanges = 
        selectedSubjects.length !== originalSelectedSubjects.length ||
        !selectedSubjects.every(subjectId => originalSelectedSubjects.includes(subjectId));
      
      setHasUnsavedChanges(hasCollectionChanges || hasSubjectChanges);
    }
  }, [collection, originalCollection, selectedSubjects, originalSelectedSubjects]);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleCreateNewSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubjectName.trim()) {
      showToast("Subject name cannot be empty", "error");
      return;
    }
    
    setCreatingSubject(true);
    
    try {
      // Create the new subject
      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({ 
          name: newSubjectName.trim(),
          is_official: false 
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add the new subject to the list
      setSubjects(prev => [...prev, newSubject]);
      
      // Select the new subject
      setSelectedSubjects(prev => [...prev, newSubject.id]);
      
      // Close the modal and reset the input
      setNewSubjectName('');
      setShowNewSubjectModal(false);
      
      showToast("Subject created successfully", "success");
    } catch (err: any) {
      showToast(`Error creating subject: ${err.message}`, "error");
    } finally {
      setCreatingSubject(false);
    }
  };

  const saveChanges = async () => {
    if (!collection || !hasUnsavedChanges) return true;

    setSaving(true);
    setError(null);

    try {
      // Update collection details
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          title: collection.title,
          description: collection.description,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Update the subject relationships in the junction table
      
      // First delete all existing relationships
      const { error: deleteJunctionError } = await supabase
        .from('collection_subjects')
        .delete()
        .eq('collection_id', id);
        
      if (deleteJunctionError) throw deleteJunctionError;
      
      // Then insert the new relationships
      if (selectedSubjects.length > 0) {
        const junctionRecords = selectedSubjects.map(subjectId => ({
          collection_id: id!,
          subject_id: subjectId
        }));
        
        const { error: insertJunctionError } = await supabase
          .from('collection_subjects')
          .insert(junctionRecords);
          
        if (insertJunctionError) throw insertJunctionError;
      }
      
      // Update the original state to match the current state
      setOriginalCollection(JSON.parse(JSON.stringify(collection)));
      setOriginalSelectedSubjects([...selectedSubjects]);
      setHasUnsavedChanges(false);
      showToast('Changes saved successfully', 'success');
      
      return true;
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveChanges();
  };

  const handleDeleteCollection = async () => {
    try {
      // First delete entries in the collection_subjects junction table
      const { error: subjectJunctionError } = await supabase
        .from('collection_subjects')
        .delete()
        .eq('collection_id', id);
        
      if (subjectJunctionError) throw subjectJunctionError;
      
      // Then delete entries in the flashcard_collections_junction table
      const { error: cardJunctionError } = await supabase
        .from('flashcard_collections_junction')
        .delete()
        .eq('collection_id', id);
        
      if (cardJunctionError) throw cardJunctionError;
      
      // Finally delete the collection itself
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      navigate('/flashcards/collections');
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleNavigation = async (path: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Save before continuing?');
      if (confirmed) {
        const saved = await saveChanges();
        if (saved) {
          navigate(path);
        }
      } else {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !collection) {
    return (
      <ErrorMessage 
        message={error || 'Collection not found'} 
        backLink={{
          to: "/flashcards/collections",
          label: "Back to Collections"
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? All flashcards in this collection will also be deleted."
        itemName={collection.title}
      />

      {/* New Subject Modal */}
      {showNewSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Add New Subject</h3>
              <button 
                onClick={() => setShowNewSubjectModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewSubject} className="p-4">
              <div className="mb-4">
                <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  id="subjectName"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                  placeholder="Enter subject name"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSubjectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={creatingSubject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F37022] text-white rounded-md hover:bg-[#E36012]"
                  disabled={creatingSubject}
                >
                  {creatingSubject ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/flashcards/collections" className="text-[#F37022] hover:text-[#E36012] flex items-center gap-2">
            <ChevronLeft className="h-5 w-5" />
            Back to Collections
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Collection</h1>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          <Trash2 className="h-5 w-5" />
          Delete Collection
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={collection.title}
              onChange={(e) => setCollection({ ...collection, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={collection.description}
              onChange={(e) => setCollection({ ...collection, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Subjects
              </label>
              <button
                type="button"
                onClick={() => setShowNewSubjectModal(true)}
                className="text-sm text-[#F37022] hover:text-[#E36012] flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add New Subject
              </button>
            </div>
            <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
              {subjects.length === 0 ? (
                <p className="text-gray-500 italic">No subjects available</p>
              ) : (
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() => handleSubjectToggle(subject.id)}
                        className="h-4 w-4 text-[#F37022] focus:ring-[#F37022] border-gray-300 rounded"
                      />
                      <label htmlFor={`subject-${subject.id}`} className="ml-2 text-sm text-gray-700">
                        {subject.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedSubjects.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                Please select at least one subject
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Flashcards</h2>
            <span className="text-gray-600">{cardCount} cards</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => handleNavigation(`/flashcards/add-card/${id}`)}
                className="flex items-center justify-center gap-2 bg-[#F37022] text-white px-4 py-2 rounded-md hover:bg-[#E36012] flex-1"
              >
                <PlusCircle className="h-5 w-5" />
                Add New Card
              </button>
              
              <button
                type="button"
                onClick={() => handleNavigation(`/flashcards/manage-cards/${id}`)}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex-1"
              >
                Manage Collection Cards
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !hasUnsavedChanges || selectedSubjects.length === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-md ${
              hasUnsavedChanges && selectedSubjects.length > 0
                ? 'bg-[#F37022] text-white hover:bg-[#E36012]' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </form>
    </div>
  );
} 