/**
 * VideoComponent - Renders a video from the video store.
 * 
 * Features:
 * - Loads video data from Tauri backend
 * - Supports multiple scale modes (cover, contain, stretch, original)
 * - Playback controls (autoplay, loop, muted, controls, volume, playback rate)
 * - Loading and error states
 * - Dynamic video loading via useEffect
 * 
 * Scale modes:
 * - cover: Fill area, maintain aspect ratio, may crop
 * - contain: Fit within area, maintain aspect ratio, may have empty space
 * - stretch: Fill area, ignore aspect ratio
 * - original: Display at original size
 */
// src/components/Designer/Canvas/VideoComponent.tsx
import React, { useEffect, useState, useRef } from 'react';

interface VideoComponentProps {
  /** ID of the video to load from the video store */
  videoId: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** How the video should scale to fit its container */
  scaleMode?: 'cover' | 'contain' | 'stretch' | 'original';
  /** Whether video should autoplay */
  autoplay?: boolean;
  /** Whether video should loop */
  loop?: boolean;
  /** Whether video should be muted */
  muted?: boolean;
  /** Whether to show video controls */
  controls?: boolean;
  /** Volume level (0-1) */
  volume?: number;
  /** Playback speed multiplier */
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
  /** Reference to the video element for programmatic control */
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Loads video data from Tauri backend when videoId changes.
   * 
   * Process:
   * 1. Sets loading state
   * 2. Fetches video data via Tauri invoke
   * 3. Sets video source (base64 data URL)
   * 4. Handles errors gracefully
   */
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

  /**
   * Updates video playback settings when props change.
   * 
   * Applies:
   * - Volume level
   * - Playback rate
   * - Autoplay (if enabled)
   */
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

  /**
   * Maps scale mode to CSS object-fit class.
   * 
   * @returns Tailwind CSS class for object-fit
   */
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