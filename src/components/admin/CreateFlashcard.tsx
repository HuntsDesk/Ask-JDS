import { useState, useEffect } from 'react';
import { Save, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from '@/lib/supabase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

interface Subject {
  id: string;
  name: string;
  is_official: boolean;
}

interface Collection {
  id: string;
  title: string;
  is_official: boolean;
}

interface CreateFlashcardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCollectionId?: string;
}

export const CreateFlashcard = ({ isOpen, onClose, onSuccess, initialCollectionId }: CreateFlashcardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form states
  const [collections, setCollections] = useState<Collection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    initialCollectionId ? [initialCollectionId] : []
  );
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isOfficial, setIsOfficial] = useState(true);
  const [isCommonPitfall, setIsCommonPitfall] = useState(false);
  const [isPublicSample, setIsPublicSample] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState('');
  
  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load collections
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('id, title, is_official')
          .order('title');

        if (collectionsError) throw collectionsError;
        setCollections(collectionsData || []);
        
        // Load subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name, is_official')
          .order('name');
          
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
        
      } catch (err: any) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      loadData();
    }
  }, [isOpen, toast]);

  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setSelectedCollectionIds(initialCollectionId ? [initialCollectionId] : []);
    setSelectedSubjectIds([]);
    setIsOfficial(true);
    setIsCommonPitfall(false);
    setIsPublicSample(false);
    setDifficultyLevel('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCollectionIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select at least one collection",
      });
      return;
    }
    
    if (!question.trim() || !answer.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a question and an answer",
      });
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // First insert the flashcard
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .insert([
          {
            question,
            answer,
            is_official: isOfficial,
            is_common_pitfall: isCommonPitfall,
            is_public_sample: isPublicSample,
            difficulty_level: difficultyLevel || null
          },
        ])
        .select();

      if (flashcardError) throw flashcardError;

      if (flashcardData && flashcardData.length > 0) {
        const flashcardId = flashcardData[0].id;
        
        // Create junction entries for each selected collection
        for (const collectionId of selectedCollectionIds) {
          const { error: junctionError } = await supabase
            .from('flashcard_collections_junction')
            .insert([
              {
                flashcard_id: flashcardId,
                collection_id: collectionId
              },
            ]);

          if (junctionError) throw junctionError;
        }
        
        // Create entries for each selected subject
        for (const subjectId of selectedSubjectIds) {
          const { error: subjectError } = await supabase
            .from('flashcard_subjects')
            .insert([
              {
                flashcard_id: flashcardId,
                subject_id: subjectId
              },
            ]);

          if (subjectError) throw subjectError;
        }
      }

      toast({
        title: "Success",
        description: "Flashcard created successfully",
      });
      
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error creating flashcard",
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Flashcard</SheetTitle>
        </SheetHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md my-4">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="question" className="font-medium">Question</Label>
              <Textarea
                id="question"
                placeholder="Enter the flashcard question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answer" className="font-medium">Answer</Label>
              <Textarea
                id="answer"
                placeholder="Enter the flashcard answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="collections" className="font-medium">Collections</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {collections.map(collection => (
                  <div key={collection.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`collection-${collection.id}`}
                      checked={selectedCollectionIds.includes(collection.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCollectionIds(prev => [...prev, collection.id]);
                        } else {
                          setSelectedCollectionIds(prev => prev.filter(id => id !== collection.id));
                        }
                      }}
                    />
                    <Label htmlFor={`collection-${collection.id}`} className="text-sm">
                      {collection.title}
                      {collection.is_official && <span className="ml-1 text-blue-500 text-xs">(Official)</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subjects" className="font-medium">Subjects</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {subjects.map(subject => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={selectedSubjectIds.includes(subject.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubjectIds(prev => [...prev, subject.id]);
                        } else {
                          setSelectedSubjectIds(prev => prev.filter(id => id !== subject.id));
                        }
                      }}
                    />
                    <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                      {subject.name}
                      {subject.is_official && <span className="ml-1 text-blue-500 text-xs">(Official)</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="font-medium">Difficulty Level</Label>
                <Select 
                  value={difficultyLevel} 
                  onValueChange={setDifficultyLevel}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOfficial"
                  checked={isOfficial}
                  onCheckedChange={(checked) => setIsOfficial(!!checked)}
                />
                <Label htmlFor="isOfficial">Official Flashcard</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPitfall"
                  checked={isCommonPitfall}
                  onCheckedChange={(checked) => setIsCommonPitfall(!!checked)}
                />
                <Label htmlFor="isPitfall">Common Pitfall</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSample"
                  checked={isPublicSample}
                  onCheckedChange={(checked) => setIsPublicSample(!!checked)}
                />
                <Label htmlFor="isSample">Public Sample</Label>
              </div>
            </div>
            
            <SheetFooter className="pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={onClose}
                className="mr-2"
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Flashcard
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CreateFlashcard; 