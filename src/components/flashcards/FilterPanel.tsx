import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useStudyContext } from '@/contexts/StudyContext';
import { type StudyMode } from '@/contexts/StudyContext';
import { useEffect, useState } from 'react';

interface FilterPanelProps {
  filters: {
    subjects: string[];
    collections: string[];
    examTypes: string[];
    difficulty: string[];
    showMastered: boolean;
    searchQuery: string;
  };
  updateFilters: (filters: any) => void;
  onClose: () => void;
  mode: StudyMode;
}

export function FilterPanel({ filters, updateFilters, onClose, mode }: FilterPanelProps) {
  // Local state for filters
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Get selectable options from context
  const { subjects, collections, examTypes } = useStudyContext();
  
  // Difficulty levels
  const difficultyLevels = [
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
  ];
  
  // Handle local filter changes
  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Handle checkbox selection for array-based filters
  const handleCheckboxChange = (key: string, id: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const current = [...prev[key as keyof typeof prev]] as string[];
      
      if (checked) {
        if (!current.includes(id)) {
          return {
            ...prev,
            [key]: [...current, id],
          };
        }
      } else {
        return {
          ...prev,
          [key]: current.filter((item) => item !== id),
        };
      }
      
      return prev;
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    updateFilters(localFilters);
    onClose();
  };
  
  // Reset filters
  const resetFilters = () => {
    const reset = {
      subjects: [],
      collections: [],
      examTypes: [],
      difficulty: [],
      showMastered: true,
      searchQuery: '',
    };
    setLocalFilters(reset);
    updateFilters(reset);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label htmlFor="search" className="text-sm font-medium">
          Search
        </label>
        <Input
          id="search"
          placeholder="Search in flashcards..."
          value={localFilters.searchQuery}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
        />
      </div>

      {/* Only show subject filter in collection or unified mode */}
      {(mode === 'unified' || mode === 'collection') && subjects && subjects.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Subjects</label>
          <div className="flex max-h-28 flex-col gap-1 overflow-y-auto">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center gap-2">
                <Checkbox
                  id={`subject-${subject.id}`}
                  checked={localFilters.subjects.includes(subject.id)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('subjects', subject.id, checked === true)
                  }
                />
                <label htmlFor={`subject-${subject.id}`} className="text-sm">
                  {subject.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Only show collections filter in subject or unified mode */}
      {(mode === 'unified' || mode === 'subject') && collections && collections.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Collections</label>
          <div className="flex max-h-28 flex-col gap-1 overflow-y-auto">
            {collections.map((collection) => (
              <div key={collection.id} className="flex items-center gap-2">
                <Checkbox
                  id={`collection-${collection.id}`}
                  checked={localFilters.collections.includes(collection.id)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('collections', collection.id, checked === true)
                  }
                />
                <label htmlFor={`collection-${collection.id}`} className="text-sm">
                  {collection.title}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam Types */}
      {examTypes && examTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Exam Types</label>
          <div className="flex max-h-28 flex-col gap-1 overflow-y-auto">
            {examTypes.map((examType) => (
              <div key={examType.id} className="flex items-center gap-2">
                <Checkbox
                  id={`examType-${examType.id}`}
                  checked={localFilters.examTypes.includes(examType.id)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange('examTypes', examType.id, checked === true)
                  }
                />
                <label htmlFor={`examType-${examType.id}`} className="text-sm">
                  {examType.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Difficulty</label>
        <div className="flex flex-col gap-1">
          {difficultyLevels.map((level) => (
            <div key={level.id} className="flex items-center gap-2">
              <Checkbox
                id={`difficulty-${level.id}`}
                checked={localFilters.difficulty.includes(level.id)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('difficulty', level.id, checked === true)
                }
              />
              <label htmlFor={`difficulty-${level.id}`} className="text-sm">
                {level.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Show Mastered */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="showMastered"
          checked={localFilters.showMastered}
          onCheckedChange={(checked) =>
            handleFilterChange('showMastered', checked === true)
          }
        />
        <label htmlFor="showMastered" className="text-sm">
          Show mastered cards
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-2">
        <Button onClick={resetFilters} intent="secondary" size="small">
          Reset
        </Button>
        <Button onClick={applyFilters} intent="primary" size="small">
          Apply Filters
        </Button>
      </div>
    </div>
  );
} 