import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { constructGumletUrls } from '@/lib/gumlet';

interface VideoPlayerProps {
  videoId: string;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  className?: string;
  showControls?: boolean;
}

// Extend window to include gumlet
declare global {
  interface Window {
    gumlet?: {
      insights: (config: any) => any;
    };
  }
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
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const analyticsRef = useRef<any>(null);
  
  // Get URLs only when videoId is available
  const { hlsUrl, thumbnailUrl } = videoId ? constructGumletUrls(videoId) : { hlsUrl: '', thumbnailUrl: '' };
  
  useEffect(() => {
    if (!videoId || !videoRef.current) return;
    
    const video = videoRef.current;
    setError(null);
    setIsLoading(true);
    
    // Check if HLS is supported
    if (Hls.isSupported()) {
      // Create HLS instance
      const hls = new Hls({
        autoStartLoad: false,
        maxLoadingDelay: 4,
        minAutoBitrate: 0,
        lowLatencyMode: false,
        enableWorker: true,
        debug: false,
      });
      
      // Initialize Gumlet Analytics if available
      if (window.gumlet?.insights) {
        try {
          const gumletConfig = {
            property_id: import.meta.env.VITE_GUMLET_PROPERTY_ID || 'askjds-video-analytics',
            customVideoId: videoId,
            customVideoTitle: `Video ${videoId}`,
            customContentType: 'course-video',
            customPlayerName: 'Ask JDS Player',
            customPlayerIntegrationVersion: 'v2.0-hlsjs',
          };
          
          const analytics = window.gumlet.insights(gumletConfig);
          analytics?.registerHLSJSPlayer(hls, { starttime: Date.now() });
          analyticsRef.current = analytics;
          
          console.log('Gumlet analytics initialized for video:', videoId);
        } catch (analyticsError) {
          console.warn('Gumlet analytics initialization failed:', analyticsError);
          // Continue without analytics - don't block video playback
        }
      } else {
        console.warn('Gumlet insights SDK not available');
      }
      
      // HLS event listeners
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
        setIsLoading(false);
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', event, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error loading video. Please check your connection.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error. Please try refreshing the page.');
              hls.recoverMediaError();
              break;
            default:
              setError('Fatal error occurred during video playback.');
              hls.destroy();
              break;
          }
        }
      });
      
      // Attach media and load source
      hls.attachMedia(video);
      hls.loadSource(hlsUrl);
      
      // Start loading when play is requested
      video.addEventListener('play', () => {
        if (!hls.media?.currentSrc) {
          hls.startLoad();
        }
      });
      
      hlsRef.current = hls;
      
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      setIsLoading(false);
      console.log('Using native HLS support');
    } else {
      setError('HLS is not supported in this browser.');
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      analyticsRef.current = null;
    };
  }, [videoId, hlsUrl]);
  
  // Handle video events for analytics
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !analyticsRef.current) return;
    
    const handleLoadedMetadata = () => {
      // Update video duration in analytics
      analyticsRef.current?.updateCustomVideoData({
        customVideoDurationMillis: video.duration * 1000,
      });
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoId]);

  if (!videoId) {
    return <div className="text-center p-4 bg-gray-100 rounded-md">No video available</div>;
  }

  const handleError = () => {
    setError('Error loading video. Please try again later.');
    setIsLoading(false);
  };

  return (
    <div className={`video-player-container relative rounded-md overflow-hidden ${className}`}>
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <div className="w-full h-full relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
              <div className="text-white">Loading video...</div>
            </div>
          )}
          <video
            ref={videoRef}
            poster={thumbnailUrl}
            width={width}
            height={height}
            controls={showControls}
            autoPlay={autoPlay}
            onError={handleError}
            playsInline={true}
            className="rounded-md w-full h-full"
            muted={!showControls}
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}; 