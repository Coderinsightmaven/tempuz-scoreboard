// src/stores/useImageStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface StoredImage {
  id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  thumbnail?: string; // Base64 thumbnail for quick preview
}

interface ImageState {
  images: StoredImage[];
  isLoading: boolean;
  lastError: string | null;
}

interface ImageActions {
  loadImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<StoredImage | null>;
  deleteImage: (imageId: string) => Promise<boolean>;
  getImage: (imageId: string) => StoredImage | null;
  clearError: () => void;
}

export const useImageStore = create<ImageState & ImageActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    images: [],
    isLoading: false,
    lastError: null,

    // Actions
    loadImages: async () => {
      set({ isLoading: true, lastError: null });
      
      try {
        // Import Tauri APIs dynamically to avoid SSR issues
        const { invoke } = await import('@tauri-apps/api/core');
        
        const images = await invoke<StoredImage[]>('get_stored_images');
        set({ images, isLoading: false });
      } catch (error) {
        console.error('Failed to load images:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to load images',
          isLoading: false 
        });
      }
    },

    uploadImage: async (file: File) => {
      set({ isLoading: true, lastError: null });
      
      try {
        // Import Tauri APIs dynamically
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (data:image/png;base64,)
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload image to Tauri backend
        const storedImage = await invoke<StoredImage>('upload_image', {
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
          fileSize: file.size
        });

        // Add to local state
        set(state => ({
          images: [...state.images, storedImage],
          isLoading: false
        }));

        return storedImage;
      } catch (error) {
        console.error('Failed to upload image:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to upload image',
          isLoading: false 
        });
        return null;
      }
    },

    deleteImage: async (imageId: string) => {
      set({ isLoading: true, lastError: null });
      
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        
        await invoke('delete_image', { imageId });
        
        // Remove from local state
        set(state => ({
          images: state.images.filter(img => img.id !== imageId),
          isLoading: false
        }));

        return true;
      } catch (error) {
        console.error('Failed to delete image:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to delete image',
          isLoading: false 
        });
        return false;
      }
    },

    getImage: (imageId: string) => {
      const { images } = get();
      return images.find(img => img.id === imageId) || null;
    },

    clearError: () => {
      set({ lastError: null });
    },
  }))
); 