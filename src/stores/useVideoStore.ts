/**
 * useVideoStore - Video asset management store.
 * 
 * Manages:
 * - Video uploads to Tauri backend
 * - Video list and metadata
 * - Video deletion
 * - Thumbnail generation
 * 
 * All videos are stored via Tauri filesystem API and can be used in scoreboard components.
 */
// src/stores/useVideoStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface StoredVideo {
  id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  duration?: number; // in seconds
  uploadedAt: Date;
  thumbnail?: string; // Base64 thumbnail for quick preview
}

interface VideoState {
  videos: StoredVideo[];
  isLoading: boolean;
  lastError: string | null;
}

interface VideoActions {
  loadVideos: () => Promise<void>;
  uploadVideo: (file: File) => Promise<StoredVideo | null>;
  deleteVideo: (videoId: string) => Promise<boolean>;
  getVideo: (videoId: string) => StoredVideo | null;
  clearError: () => void;
}

export const useVideoStore = create<VideoState & VideoActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    videos: [],
    isLoading: false,
    lastError: null,

    // === Video Management Actions ===
    
    /**
     * Loads all stored videos from the Tauri backend.
     * 
     * Side effects:
     * - Sets isLoading state during operation
     * - Updates videos array with loaded videos
     * - Sets lastError on failure
     */
    loadVideos: async () => {
      set({ isLoading: true, lastError: null });
      
      try {
        // Import Tauri APIs dynamically to avoid SSR issues
        const { invoke } = await import('@tauri-apps/api/core');
        
        const videos = await invoke<StoredVideo[]>('get_stored_videos');
        set({ videos, isLoading: false });
      } catch (error) {
        console.error('Failed to load videos:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to load videos',
          isLoading: false 
        });
      }
    },

    /**
     * Uploads a video file to the Tauri backend.
     * 
     * Process:
     * 1. Converts file to base64
     * 2. Sends to Tauri backend via invoke
     * 3. Backend stores file and generates thumbnail
     * 4. Adds to local videos array
     * 
     * @param file - The video file to upload
     * @returns The stored video object, or null if upload fails
     * 
     * Side effects:
     * - Sets isLoading state during operation
     * - Adds video to videos array on success
     * - Sets lastError on failure
     */
    uploadVideo: async (file: File) => {
      set({ isLoading: true, lastError: null });
      
      try {
        // Import Tauri APIs dynamically
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (data:video/mp4;base64,)
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload video to Tauri backend
        const storedVideo = await invoke<StoredVideo>('upload_video', {
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
          fileSize: file.size
        });

        // Add to local state
        set(state => ({
          videos: [...state.videos, storedVideo],
          isLoading: false
        }));

        return storedVideo;
      } catch (error) {
        console.error('Failed to upload video:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to upload video',
          isLoading: false 
        });
        return null;
      }
    },

    /**
     * Deletes a video from the Tauri backend and local state.
     * 
     * @param videoId - The ID of the video to delete
     * @returns true if successful, false if failed
     * 
     * Side effects:
     * - Deletes file from Tauri backend
     * - Removes video from local videos array
     * - Sets lastError on failure
     */
    deleteVideo: async (videoId: string) => {
      set({ isLoading: true, lastError: null });
      
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        
        await invoke('delete_video', { videoId });
        
        // Remove from local state
        set(state => ({
          videos: state.videos.filter(video => video.id !== videoId),
          isLoading: false
        }));

        return true;
      } catch (error) {
        console.error('Failed to delete video:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to delete video',
          isLoading: false 
        });
        return false;
      }
    },

    /**
     * Gets a video by ID.
     * 
     * @param videoId - The ID of the video to retrieve
     * @returns The video object, or null if not found
     */
    getVideo: (videoId: string) => {
      const { videos } = get();
      return videos.find(video => video.id === videoId) || null;
    },

    /**
     * Clears the current error state.
     */
    clearError: () => {
      set({ lastError: null });
    },
  }))
);