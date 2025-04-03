
import { CheckCircle2, Clock, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Course } from '@/types/course';

interface StatusBadgeProps {
  status: Course['status'];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusBadgeClass = (status: Course['status']) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      case 'Coming Soon':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={cn(
      "px-2 inline-flex text-xs leading-5 font-medium rounded-full py-1",
      getStatusBadgeClass(status)
    )}>
      {status === 'Published' && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === 'Draft' && <Clock className="h-3 w-3 mr-1" />}
      {status === 'Archived' && <EyeOff className="h-3 w-3 mr-1" />}
      {status}
    </span>
  );
};

export default StatusBadge;
