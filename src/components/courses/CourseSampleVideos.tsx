/**
 * Component for displaying course sample videos
 */
import React, { useState } from 'react';
import { trackEvent } from '../../lib/analytics/track';

interface Video {
  id: string;
  title: string;
}

interface CourseSampleVideosProps {
  courseId: string;
  courseTitle: string;
  videos: Video[];
}

export function CourseSampleVideos({ courseId, courseTitle, videos }: CourseSampleVideosProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  
  // Only show videos that have an ID
  const validVideos = videos.filter(video => video.id);
  
  if (validVideos.length === 0) {
    return null;
  }
  
  const activeVideo = validVideos[activeVideoIndex];
  
  // Log video view
  const handleVideoPlay = (videoId: string, videoTitle: string) => {
    trackEvent('engagement', 'course_view' as any, {
      course_id: courseId,
      course_title: courseTitle,
      video_id: videoId,
      video_title: videoTitle,
      is_sample: true
    });
  };
  
  return (
    <div className="course-sample-videos my-8">
      <h3 className="text-xl font-semibold mb-4">Sample Videos</h3>
      
      {validVideos.length > 1 && (
        <div className="sample-video-tabs mb-4 flex border-b">
          {validVideos.map((video, index) => (
            <button
              key={video.id}
              className={`px-4 py-2 mr-2 ${
                index === activeVideoIndex 
                  ? 'border-b-2 border-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveVideoIndex(index)}
            >
              {video.title || `Sample ${index + 1}`}
            </button>
          ))}
        </div>
      )}
      
      <div className="video-container relative" style={{ paddingBottom: '56.25%', height: 0 }}>
        <iframe
          src={`https://player.gumlet.io/v2/${activeVideo.id}?autoplay=false`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={activeVideo.title || "Sample Video"}
          className="absolute top-0 left-0 w-full h-full"
          onLoad={() => handleVideoPlay(activeVideo.id, activeVideo.title)}
        />
      </div>
      
      {validVideos.length === 1 && activeVideo.title && (
        <p className="mt-2 text-gray-700">{activeVideo.title}</p>
      )}
    </div>
  );
}

/**
 * Helper function to extract sample videos from course data
 */
export function extractSampleVideos(course: any): Video[] {
  if (!course) return [];
  
  const videos: Video[] = [];
  
  // Check for sample videos in the course data
  if (course.sample_video_1_id) {
    videos.push({
      id: course.sample_video_1_id,
      title: course.sample_video_1_title || 'Sample 1'
    });
  }
  
  if (course.sample_video_2_id) {
    videos.push({
      id: course.sample_video_2_id,
      title: course.sample_video_2_title || 'Sample 2'
    });
  }
  
  if (course.sample_video_3_id) {
    videos.push({
      id: course.sample_video_3_id,
      title: course.sample_video_3_title || 'Sample 3'
    });
  }
  
  return videos;
} 