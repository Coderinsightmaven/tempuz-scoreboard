/**
 * ImageComponent - Renders an image from the image store.
 * 
 * Features:
 * - Loads image data from Tauri backend
 * - Supports multiple scale modes (cover, contain, stretch, original)
 * - Loading and error states
 * - Dynamic image loading via useEffect
 * 
 * Scale modes:
 * - cover: Fill area, maintain aspect ratio, may crop
 * - contain: Fit within area, maintain aspect ratio, may have empty space
 * - stretch: Fill area, ignore aspect ratio
 * - original: Display at original size
 */
// src/components/Designer/Canvas/ImageComponent.tsx
import React, { useEffect, useState } from 'react';

interface ImageComponentProps {
  /** ID of the image to load from the image store */
  imageId: string;
  /** Alt text for the image */
  alt?: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** How the image should scale to fit its container */
  scaleMode?: 'cover' | 'contain' | 'stretch' | 'original';
}

export const ImageComponent: React.FC<ImageComponentProps> = ({
  imageId,
  alt = 'Uploaded image',
  className = '',
  style = {},
  scaleMode = 'cover',
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /**
   * Loads image data from Tauri backend when imageId changes.
   * 
   * Process:
   * 1. Sets loading state
   * 2. Fetches image data via Tauri invoke
   * 3. Sets image source (base64 data URL)
   * 4. Handles errors gracefully
   */
  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const { invoke } = await import('@tauri-apps/api/core');
        const imageData = await invoke<string>('get_image_data', { imageId });
        
        setImageSrc(imageData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load image:', error);
        setError(true);
        setLoading(false);
      }
    };

    if (imageId) {
      loadImage();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [imageId]);

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

  if (error || !imageSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 ${className}`}
        style={style}
      >
        <div className="text-center">
          <div className="text-2xl">🖼️</div>
          <div className="text-xs">No Image</div>
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
    <img
      src={imageSrc}
      alt={alt}
      className={`w-full h-full ${getObjectFit()} ${className}`}
      style={style}
      onError={() => setError(true)}
    />
  );
}; 