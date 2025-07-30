// src/components/Designer/Canvas/ImageComponent.tsx
import React, { useEffect, useState } from 'react';

interface ImageComponentProps {
  imageId: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
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