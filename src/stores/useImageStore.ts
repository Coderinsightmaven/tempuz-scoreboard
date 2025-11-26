/**
 * useImageStore - Image asset management store.
 * 
 * Manages:
 * - Image uploads to Tauri backend
 * - Image list and metadata
 * - Image deletion
 * - Thumbnail generation
 * 
 * All images are stored via Tauri filesystem API and can be used in scoreboard components.
 */
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

    // === Image Management Actions ===
    
    /**
     * Loads all stored images from the Tauri backend.
     * 
     * Side effects:
     * - Sets isLoading state during operation
     * - Updates images array with loaded images
     * - Sets lastError on failure
     */
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

    /**
     * Uploads an image file to the Tauri backend.
     * 
     * Process:
     * 1. Converts file to base64
     * 2. Sends to Tauri backend via invoke
     * 3. Backend stores file and generates thumbnail
     * 4. Adds to local images array
     * 
     * @param file - The image file to upload
     * @returns The stored image object, or null if upload fails
     * 
     * Side effects:
     * - Sets isLoading state during operation
     * - Adds image to images array on success
     * - Sets lastError on failure
     */
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

    /**
     * Deletes an image from the Tauri backend and local state.
     * 
     * @param imageId - The ID of the image to delete
     * @returns true if successful, false if failed
     * 
     * Side effects:
     * - Deletes file from Tauri backend
     * - Removes image from local images array
     * - Sets lastError on failure
     */
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

    /**
     * Gets an image by ID.
     * 
     * @param imageId - The ID of the image to retrieve
     * @returns The image object, or null if not found
     */
    getImage: (imageId: string) => {
      const { images } = get();
      return images.find(img => img.id === imageId) || null;
    },

    /**
     * Clears the current error state.
     */
    clearError: () => {
      set({ lastError: null });
    },
  }))
); 