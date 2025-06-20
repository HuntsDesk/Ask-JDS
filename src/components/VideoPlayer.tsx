import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { constructGumletUrls } from '@/lib/gumlet';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const analyticsRef = useRef<any>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get URLs only when videoId is available
  const { hlsUrl, mp4Url, thumbnailUrl } = videoId ? constructGumletUrls(videoId) : { hlsUrl: '', mp4Url: '', thumbnailUrl: '' };
  const [useMp4Fallback, setUseMp4Fallback] = useState(false);
  
  // Video event handlers
  const handleLoadedData = () => {
    logger.debug('Video loaded data', { videoId });
    setIsLoading(false);
    setIsBuffering(false);
    // Clear the timeout since video loaded successfully
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };
  
  const handleCanPlay = () => {
    logger.debug('Video can play', { videoId });
    setIsLoading(false);
    setIsBuffering(false);
  };
  
  const handleWaiting = () => {
    logger.debug('Video waiting/buffering', { videoId });
    setIsBuffering(true);
  };
  
  const handlePlaying = () => {
    logger.debug('Video playing', { videoId });
    setIsBuffering(false);
  };
  
  const handleError = () => {
    logger.error('Video error', new Error(`Video playback failed for ID: ${videoId}`));
    setError('Error loading video. Please try again later.');
    setIsLoading(false);
    setIsBuffering(false);
    // Clear the timeout on error
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };
  
  useEffect(() => {
    if (!videoId || !videoRef.current) return;
    
    const video = videoRef.current;
    setError(null);
    setIsLoading(true);
    setIsBuffering(false);
    
    // Set a timeout to prevent infinite loading state
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        logger.warn('Video loading timeout', { videoId });
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout
    
    // For now, prefer MP4 since it works more reliably
    const preferMp4 = true; // Toggle this to switch between HLS and MP4
    
    if (preferMp4 && mp4Url) {
      logger.info('Using MP4 for video playback', { mp4Url, videoId });
      video.src = mp4Url;
      // Don't set loading to false here - wait for loadeddata event
      return;
    }
    
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
          
          logger.debug('Gumlet analytics initialized for video:', { videoId });
        } catch (analyticsError) {
          logger.warn('Gumlet analytics initialization failed:', analyticsError);
          // Continue without analytics - don't block video playback
        }
      } else {
        logger.debug('Gumlet insights SDK not available');
      }
      
      // HLS event listeners
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        logger.debug('HLS manifest parsed successfully');
        // Don't set loading to false here - wait for video element events
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        logger.error('HLS error:', new Error(`HLS Error: ${data.type} - ${data.details}`));
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
              // Try MP4 fallback for fatal errors
              logger.warn('Fatal HLS error, attempting MP4 fallback');
              setUseMp4Fallback(true);
              hls.destroy();
              break;
          }
        }
      });
      
      // Attach media and load source
      hls.attachMedia(video);
      logger.debug('Loading HLS source', { hlsUrl, videoId });
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
      // Don't set loading to false here - wait for video element events
      logger.debug('Using native HLS support');
    } else {
      // HLS not supported and not Safari - use MP4 fallback
      logger.info('HLS not supported, using MP4 fallback');
      if (mp4Url) {
        video.src = mp4Url;
        // Don't set loading to false here - wait for video element events
      } else {
        setError('Video playback is not supported in this browser.');
        setIsLoading(false);
      }
    }
    
    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      analyticsRef.current = null;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [videoId, hlsUrl, mp4Url]);
  
  // Handle MP4 fallback
  useEffect(() => {
    if (useMp4Fallback && videoRef.current && mp4Url) {
      logger.info('Using MP4 fallback', { mp4Url });
      const video = videoRef.current;
      video.src = mp4Url;
      // Don't set loading to false here - wait for video element events
      setError(null);
    }
  }, [useMp4Fallback, mp4Url]);
  
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

  return (
    <div className={`video-player-container relative rounded-md overflow-hidden bg-black ${className}`}>
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <div className="w-full h-full relative">
          {(isLoading || isBuffering) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner className="h-8 w-8 text-white" />
                <div className="text-white text-sm">
                  {isBuffering ? 'Buffering...' : 'Loading video...'}
                </div>
              </div>
            </div>
          )}
          <video
            ref={videoRef}
            poster={thumbnailUrl}
            width={width}
            height={height}
            controls={showControls}
            autoPlay={autoPlay}
            onLoadedData={handleLoadedData}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
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