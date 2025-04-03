
import { Volume2, VolumeX, PlayCircle } from 'lucide-react';

interface LessonVideoProps {
  videoUrl?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const LessonVideo = ({
  videoUrl,
  soundEnabled,
  onToggleSound
}: LessonVideoProps) => {
  return (
    <>
      <div className="aspect-video bg-gray-800 rounded-xl mb-6 relative flex items-center justify-center">
        {videoUrl ? (
          <video 
            controls 
            className="w-full h-full rounded-xl" 
            poster="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            muted={!soundEnabled}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="text-center text-white">
            <PlayCircle className="h-16 w-16 mx-auto mb-2" />
            <p>Video not available</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center mb-6">
        <button 
          onClick={onToggleSound}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="h-4 w-4 text-jdblue" />
              <span className="text-sm">Sound enabled</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Enable sound</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
