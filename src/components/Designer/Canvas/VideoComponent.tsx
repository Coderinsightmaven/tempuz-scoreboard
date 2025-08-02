// src/components/Designer/Canvas/VideoComponent.tsx
import React, { useEffect, useState, useRef } from 'react';

interface VideoComponentProps {
  videoId: string;
  className?: string;
  style?: React.CSSProperties;
  scaleMode?: 'cover' | 'contain' | 'stretch' | 'original';
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  volume?: number;
  playbackRate?: number;
}

export const VideoComponent: React.FC<VideoComponentProps> = ({
  videoId,
  className = '',
  style = {},
  scaleMode = 'cover',
  autoplay = false,
  loop = false,
  muted = true,
  controls = false,
  volume = 1,
  playbackRate = 1,
}) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const { invoke } = await import('@tauri-apps/api/core');
        const videoData = await invoke<string>('get_video_data', { videoId });
        
        setVideoSrc(videoData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load video:', error);
        setError(true);
        setLoading(false);
      }
    };

    if (videoId) {
      loadVideo();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [videoId]);

  useEffect(() => {
    if (videoRef.current && !loading && !error) {
      const video = videoRef.current;
      video.volume = volume;
      video.playbackRate = playbackRate;
      
      if (autoplay) {
        video.play().catch(console.error);
      }
    }
  }, [volume, playbackRate, autoplay, loading, error]);

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}
        style={style}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !videoSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 ${className}`}
        style={style}
      >
        <div className="text-center">
          <div className="text-2xl">🎥</div>
          <div className="text-xs">No Video</div>
        </div>
      </div>
    );
  }

  const getObjectFit = () => {
    switch (scaleMode) {
      case 'cover':
        return 'object-cover';
      case 'contain':
        return 'object-contain';
      case 'stretch':
        return 'object-fill';
      case 'original':
        return 'object-none';
      default:
        return 'object-cover';
    }
  };

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      className={`w-full h-full ${getObjectFit()} ${className}`}
      style={style}
      autoPlay={autoplay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline
      onError={() => setError(true)}
    />
  );
};