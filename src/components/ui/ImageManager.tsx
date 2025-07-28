// src/components/ui/ImageManager.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useImageStore, StoredImage } from '../../stores/useImageStore';

interface ImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (image: StoredImage) => void;
  selectMode?: boolean;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  selectMode = false,
}) => {
  const { 
    images, 
    isLoading, 
    lastError, 
    loadImages, 
    uploadImage, 
    deleteImage, 
    clearError 
  } = useImageStore();
  
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, loadImages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      }
    }
  };

  const handleDelete = async (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      await deleteImage(imageId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageSrc = async (image: StoredImage) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('get_image_data', { imageId: image.id });
    } catch (error) {
      console.error('Failed to load image:', error);
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectMode ? 'Select Image' : 'Image Manager'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors
              ${dragOver 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <div className="text-4xl">📁</div>
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Drop images here or click to select
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Supports: PNG, JPG, GIF, WebP (Max 10MB)
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Select Images
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error Display */}
          {lastError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-red-700 dark:text-red-300 text-sm">{lastError}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600 dark:text-gray-400">Processing images...</div>
            </div>
          )}

          {/* Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onDelete={handleDelete}
                onSelect={selectMode ? onSelectImage : undefined}
                getImageSrc={getImageSrc}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>

          {images.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-4">🖼️</div>
              <div className="text-lg">No images uploaded yet</div>
              <div className="text-sm">Upload some images to get started</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ImageCardProps {
  image: StoredImage;
  onDelete: (id: string) => void;
  onSelect?: (image: StoredImage) => void;
  getImageSrc: (image: StoredImage) => Promise<string>;
  formatFileSize: (bytes: number) => string;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, onSelect, getImageSrc, formatFileSize }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getImageSrc(image).then(src => {
      setImageSrc(src);
      setLoading(false);
    });
  }, [image, getImageSrc]);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(image);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
      {/* Image Preview */}
      <div className="aspect-square relative bg-gray-100 dark:bg-gray-600">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={image.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            🖼️
          </div>
        )}
        
        {/* Action Buttons Overlay */}
        <div className="absolute top-2 right-2 space-x-1">
          {onSelect && (
            <button
              onClick={handleSelect}
              className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Select this image"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onDelete(image.id)}
            className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            title="Delete image"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Image Info */}
      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {image.originalName}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(image.size)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(image.uploadedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}; 