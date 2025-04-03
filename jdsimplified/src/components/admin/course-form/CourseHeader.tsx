
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseHeaderProps {
  isEditing: boolean;
  isLoading: boolean;
  onSave: () => void;
}

const CourseHeader = ({ isEditing, isLoading, onSave }: CourseHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/admin/courses')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Course' : 'Create New Course'}
        </h1>
      </div>
      
      <Button 
        onClick={onSave}
        disabled={isLoading}
      >
        <Save className="h-4 w-4 mr-2" />
        {isLoading ? 'Saving...' : 'Save Course'}
      </Button>
    </div>
  );
};

export default CourseHeader;
