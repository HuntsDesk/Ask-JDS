import { useState, useEffect, useRef } from 'react';
import ReactHlsPlayer from '@gumlet/react-hls-player';
import { constructGumletUrls } from '@/lib/gumlet';

interface VideoPlayerProps {
  videoId: string;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  className?: string;
  showControls?: boolean;
}

export const VideoPlayer = ({ 
  videoId, 
  width = '100%', 
  height = 'auto',
  autoPlay = false,
  className = '',
  showControls = true
}: VideoPlayerProps) => {
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  
  // Get URLs only when videoId is available
  const { hlsUrl, thumbnailUrl } = videoId ? constructGumletUrls(videoId) : { hlsUrl: '', thumbnailUrl: '' };
  
  // Initialize player when videoId changes
  useEffect(() => {
    if (!videoId) return;
    
    setError(null);
    
    // Reset player if needed
    if (playerRef.current) {
      playerRef.current.load();
    }
  }, [videoId]);
  
  if (!videoId) {
    return <div className="text-center p-4 bg-gray-100 rounded-md">No video available</div>;
  }
  
  const handleError = (err: any) => {
    console.error('Video playback error:', err);
    setError('Error playing video. Please try again later.');
  };
  
  return (
    <div className={`video-player-container relative rounded-md overflow-hidden ${className}`}>
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <div className="w-full h-full">
          <ReactHlsPlayer
            playerRef={playerRef}
            src={hlsUrl}
            poster={thumbnailUrl}
            width={width}
            height={height}
            controls={true}
            autoPlay={autoPlay}
            onError={handleError}
            playsInline={true}
            className="rounded-md"
            muted={!showControls}
            hlsConfig={{
              maxLoadingDelay: 4,
              minAutoBitrate: 0,
              lowLatencyMode: false,
              enableWorker: true,
            }}
          />
        </div>
      )}
    </div>
  );
}; 