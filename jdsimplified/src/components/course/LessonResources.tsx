
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const LessonResources = () => {
  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    toast({
      title: "Download started",
      description: "Your file will download shortly.",
      variant: "default"
    });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
      <h3 className="font-bold mb-3">Downloadable Resources</h3>
      <ul className="space-y-2">
        <li>
          <a href="#" className="flex items-center text-jdblue hover:underline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            <span>Lesson Slides (PDF)</span>
          </a>
        </li>
        <li>
          <a href="#" className="flex items-center text-jdblue hover:underline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            <span>Practice Problems (PDF)</span>
          </a>
        </li>
        <li>
          <a href="#" className="flex items-center text-jdblue hover:underline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            <span>Framework Template (DOCX)</span>
          </a>
        </li>
      </ul>
    </div>
  );
};
